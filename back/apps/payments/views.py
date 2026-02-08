from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django_filters.rest_framework import DjangoFilterBackend
from .models import Payment
from .serializers import PaymentSerializer
from .permissions import IsHeadTeacherOrDirector
from django.db.models import Q, Sum
from django.utils import timezone as django_timezone
from datetime import datetime
from django.template.loader import render_to_string
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and creating payments.
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['student', 'group', 'status', 'payment_method']
    search_fields = ['invoice_number', 'comment', 'student__username', 'student__first_name', 'student__last_name']
    ordering_fields = ['created_at', 'amount']

    def get_queryset(self):
        user = self.request.user
        queryset = Payment.objects.all().select_related('student', 'group', 'group__course', 'received_by')
        
        if user.is_staff or user.role in ['director', 'head_teacher']:
            return queryset
        
        if user.role == 'teacher':
            from apps.courses.models import Group
            teacher_groups = Group.objects.filter(teacher=user)
            return queryset.filter(group__in=teacher_groups)
        
        return queryset.filter(student=user)

    def get_permissions(self):
        if self.action == 'create':
            return [IsHeadTeacherOrDirector()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def group_stats(self, request):
        """
        Get total paid amount for a specific group.
        """
        group_id = request.query_params.get('group_id')
        if not group_id:
            return Response({"error": "group_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        total_paid = Payment.objects.filter(
            group_id=group_id, 
            status=Payment.Status.COMPLETED
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({"group_id": group_id, "total_paid": float(total_paid)})

    @action(detail=True, methods=['get'])
    def download_receipt(self, request, pk=None):
        """
        Generate and download a PDF receipt for the payment.
        """
        payment = self.get_object()
        
        school_info = {
            'name': 'LanG School',
            'address': '801 West End Avenue, Turkmenabat',
            'phone': '+993 64 585958',
            'email': 'hi@lang-school.com',
            'country': 'Turkmenistan'
        }
        
        context = {
            'payment': payment,
            'school': school_info,
            'date_now': django_timezone.now(),
            'subtotal': payment.amount + payment.discount,
        }
        
        html_string = render_to_string('payments/receipt_pdf.html', context)
        
        try:
            from weasyprint import HTML
            html = HTML(string=html_string)
            pdf_file = html.write_pdf()
            
            response = HttpResponse(pdf_file, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="receipt_{payment.invoice_number}.pdf"'
            return response
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error generating PDF: {str(e)}")
            return Response({"error": "Failed to generate PDF receipt."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsHeadTeacherOrDirector])
def payment_report_users(request):
    """
    Get users list for payment reports (all students).
    """
    from apps.users.models import User
    users = User.objects.filter(role=User.Role.STUDENT, is_active=True).values('id', 'username', 'first_name', 'last_name', 'role')
    
    formatted_users = []
    for u in users:
        formatted_users.append({
            'id': u['id'],
            'username': u['username'],
            'full_name': f"{u['first_name']} {u['last_name']}".strip() or u['username'],
            'role': u['role']
        })
    return Response(formatted_users)

@api_view(['GET'])
@permission_classes([IsHeadTeacherOrDirector])
def payment_report(request):
    """
    Generate detailed payment report with filters.
    """
    student_id = request.query_params.get('student_id')
    group_id = request.query_params.get('group_id')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    method = request.query_params.get('method')
    
    queryset = Payment.objects.all().select_related('student', 'group', 'group__course', 'received_by')
    
    if student_id:
        queryset = queryset.filter(student_id=student_id)
    if group_id:
        queryset = queryset.filter(group_id=group_id)
    if method:
        queryset = queryset.filter(payment_method=method)
        
    try:
        if date_from:
            start_date = datetime.strptime(date_from, '%Y-%m-%d')
            queryset = queryset.filter(created_at__gte=django_timezone.make_aware(start_date))
        if date_to:
            end_date = datetime.strptime(date_to, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
            queryset = queryset.filter(created_at__lte=django_timezone.make_aware(end_date))
    except (ValueError, TypeError):
        return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

    # Calculate summary
    summary = queryset.filter(status=Payment.Status.COMPLETED).aggregate(
        total_amount=Sum('amount'),
        count=Sum(1) # Count items
    )
    
    # Structure data for response
    serializer = PaymentSerializer(queryset, many=True)
    
    return Response({
        'total_amount': float(summary['total_amount'] or 0),
        'transaction_count': queryset.count(),
        'payments': serializer.data,
        'period': {
            'from': date_from,
            'to': date_to
        }
    })
