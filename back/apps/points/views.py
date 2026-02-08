from rest_framework import viewsets, status, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db import transaction, models
from django.db.models import Sum, Q, DecimalField
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Wallet, Transaction
from apps.chat.services import notify_balance_update
from .serializers import (
    WalletSerializer, 
    TransactionSerializer, 
    PointTransferSerializer,
    RFIDPaymentSerializer
)
from apps.vendors.models import VendorProfile
from apps.users.models import StudentProfile
from django.contrib.auth import get_user_model

User = get_user_model()

class WalletViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing wallets.
    """
    queryset = Wallet.objects.all()
    serializer_class = WalletSerializer
    
    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.role == User.Role.DIRECTOR:
            return Wallet.objects.all()
        return Wallet.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def me(self, request):
        wallet, created = Wallet.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(wallet)
        return Response(serializer.data)

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing transaction history.
    """
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = {
        'timestamp': ['gte', 'lte', 'date'],
        'transaction_type': ['exact'],
        'sender': ['exact'],
        'receiver': ['exact'],
    }
    search_fields = ['comment', 'sender__username', 'receiver__username', 'sender__first_name', 'sender__last_name']
    ordering_fields = ['timestamp', 'amount']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == User.Role.DIRECTOR:
            return Transaction.objects.all()
        return Transaction.objects.filter(models.Q(sender=user) | models.Q(receiver=user))

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def transfer_gems(request):
    """
    Transfer Gems from one staff member to another or to a student.
    """
    serializer = PointTransferSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    sender = request.user
    receiver = get_object_or_404(User, id=serializer.validated_data['receiver_id'])
    amount = serializer.validated_data['amount']
    comment = serializer.validated_data.get('comment', '')

    # Permission and Hierarchy check
    if sender.role == User.Role.DIRECTOR:
        # Director can send to anyone
        pass
    elif sender.role == User.Role.HEAD_TEACHER:
        # Head Teacher can only send to Teachers
        if receiver.role != User.Role.TEACHER:
            return Response({'error': 'Head Teachers can only transfer Gems to Teachers'}, status=status.HTTP_403_FORBIDDEN)
    elif sender.role == User.Role.TEACHER:
        # Teacher can only send to Students
        if receiver.role != User.Role.STUDENT:
            return Response({'error': 'Teachers can only award Gems to Students'}, status=status.HTTP_403_FORBIDDEN)
    else:
        return Response({'error': 'Only staff can transfer Gems'}, status=status.HTTP_403_FORBIDDEN)

    with transaction.atomic():
        sender_wallet, sender_created = Wallet.objects.get_or_create(user=sender)
        receiver_wallet, receiver_created = Wallet.objects.get_or_create(user=receiver)

        # Check balance (Director is exempt from balance check as they are the source)
        if sender.role != User.Role.DIRECTOR and sender_wallet.balance < amount:
            return Response({'error': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)

        # Create transaction record
        if receiver.role == User.Role.STUDENT:
            trans_type = Transaction.TransactionType.AWARD
        else:
            trans_type = Transaction.TransactionType.TRANSFER
        
        Transaction.objects.create(
            sender=sender,
            receiver=receiver,
            amount=amount,
            transaction_type=trans_type,
            comment=comment
        )

        # Update balances (Director's balance can go negative as they emit Gems)
        sender_wallet.balance -= amount
        sender_wallet.save()
        
        receiver_wallet.balance += amount
        receiver_wallet.save()

        # WebSocket уведомления
        notify_balance_update(sender.id, sender_wallet.balance)
        notify_balance_update(receiver.id, receiver_wallet.balance)

    return Response({
        'message': 'Transfer successful', 
        'new_balance': float(sender_wallet.balance)
    })

@api_view(['POST'])
@permission_classes([permissions.AllowAny])  # ESP32 uses token auth
def rfid_payment(request):
    """
    Process payment from RFID bracelet.
    Used by ESP32 terminals.
    """
    serializer = RFIDPaymentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    rfid_uid = serializer.validated_data['rfid_uid']
    amount = serializer.validated_data['amount']
    terminal_id = serializer.validated_data['terminal_id']
    auth_token = serializer.validated_data['auth_token']

    # 1. Validate Terminal
    vendor_profile = get_object_or_404(
        VendorProfile, 
        terminal_id=terminal_id, 
        auth_token=auth_token,
        is_active=True
    )
    vendor_user = vendor_profile.user

    # 2. Find Student by RFID
    student_profile = get_object_or_404(StudentProfile, rfid_uid=rfid_uid)
    student_user = student_profile.user

    with transaction.atomic():
        student_wallet, created = Wallet.objects.get_or_create(user=student_user)
        vendor_wallet, created = Wallet.objects.get_or_create(user=vendor_user)

        # 3. Check Student Balance
        if student_wallet.balance < amount:
            return Response({
                'status': 'error',
                'message': 'Insufficient balance'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 4. Create Transaction
        Transaction.objects.create(
            sender=student_user,
            receiver=vendor_user,
            amount=amount,
            transaction_type=Transaction.TransactionType.PURCHASE,
            comment=f"Payment at {vendor_profile.name_ru} (Terminal: {terminal_id})"
        )

        # 5. Update Balances
        student_wallet.balance -= amount
        student_wallet.save()
        
        vendor_wallet.balance += amount
        vendor_wallet.save()

        # WebSocket уведомления
        notify_balance_update(student_user.id, student_wallet.balance)
        notify_balance_update(vendor_user.id, vendor_wallet.balance)

    return Response({
        'status': 'success',
        'message': 'Payment successful',
        'student_name': student_user.get_full_name() or student_user.username,
        'new_balance': float(student_wallet.balance)
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def report_users(request):
    """
    Get list of all users for reports (only for directors/admins).
    """
    user = request.user
    
    if not (user.is_staff or user.role == User.Role.DIRECTOR):
        return Response(
            {'error': 'Only directors and admins can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get all users with wallets (they have transactions)
    users = User.objects.filter(is_active=True).select_related('wallet').order_by('role', 'first_name', 'last_name')
    
    result = []
    for u in users:
        result.append({
            'id': u.id,
            'username': u.username,
            'full_name': u.get_full_name() or u.username,
            'role': u.role,
            'wallet_balance': float(u.wallet.balance) if hasattr(u, 'wallet') else 0.0
        })
    
    return Response(result, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def gems_report(request):
    """
    Generate Gems report for a user within a date range.
    Returns: balance, income, expenses, and transaction list.
    """
    user = request.user
    
    # Only directors and admins can view reports for all users
    if not (user.is_staff or user.role == User.Role.DIRECTOR):
        return Response(
            {'error': 'Only directors and admins can access reports'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    user_id = request.query_params.get('user_id')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    
    if not user_id:
        return Response(
            {'error': 'user_id parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get wallet
    wallet, _ = Wallet.objects.get_or_create(user=target_user)
    current_balance = float(wallet.balance)
    
    # Parse dates
    try:
        if date_from:
            if 'T' in date_from:
                date_from_dt = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                if date_from_dt.tzinfo is None:
                    date_from_dt = timezone.make_aware(date_from_dt)
            else:
                date_from_dt = datetime.strptime(date_from, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
                date_from_dt = timezone.make_aware(date_from_dt)
        else:
            date_from_dt = timezone.make_aware(datetime(2000, 1, 1, 0, 0, 0))
        
        if date_to:
            if 'T' in date_to:
                date_to_dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                if date_to_dt.tzinfo is None:
                    date_to_dt = timezone.make_aware(date_to_dt)
            else:
                date_to_dt = datetime.strptime(date_to, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
                date_to_dt = timezone.make_aware(date_to_dt)
        else:
            date_to_dt = timezone.now()
    except (ValueError, AttributeError, TypeError) as e:
        return Response(
            {'error': f'Invalid date format: {str(e)}. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get all transactions for this user in the date range
    transactions = Transaction.objects.filter(
        (Q(sender=target_user) | Q(receiver=target_user)),
        timestamp__gte=date_from_dt,
        timestamp__lte=date_to_dt
    ).select_related('sender', 'receiver').order_by('-timestamp')
    
    # Calculate income (received) and expenses (sent)
    income = transactions.filter(receiver=target_user).aggregate(
        total=Sum('amount', output_field=DecimalField())
    )['total'] or 0
    
    expenses = transactions.filter(sender=target_user).aggregate(
        total=Sum('amount', output_field=DecimalField())
    )['total'] or 0
    
    # Serialize transactions
    transaction_serializer = TransactionSerializer(transactions, many=True)
    
    return Response({
        'user': {
            'id': target_user.id,
            'username': target_user.username,
            'full_name': target_user.get_full_name() or target_user.username,
            'role': target_user.role
        },
        'balance': current_balance,
        'income': float(income),
        'expenses': float(expenses),
        'period': {
            'from': date_from_dt.isoformat(),
            'to': date_to_dt.isoformat()
        },
        'transactions': transaction_serializer.data,
        'transactions_count': transactions.count()
    }, status=status.HTTP_200_OK)
