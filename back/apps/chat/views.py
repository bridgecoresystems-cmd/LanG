from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Room, Message
from .serializers import RoomSerializer, MessageSerializer
from django.db.models import Q
from django.contrib.auth import get_user_model

User = get_user_model()

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Пользователь видит только свои комнаты (где он участник)
        return Room.objects.filter(participants=self.request.user, is_active=True)

    @action(detail=False, methods=['get'])
    def ai_room(self, request):
        """
        Получить или создать персональную комнату с AI ассистентом.
        """
        user = request.user
        ai_user = User.objects.filter(username="ai_assistant").first()
        
        if not ai_user:
            return Response({"error": "AI Assistant not initialized"}, status=status.HTTP_404_NOT_FOUND)

        # Ищем существующую AI комнату для этого пользователя
        room = Room.objects.filter(
            room_type=Room.RoomType.AI,
            participants=user
        ).first()

        if not room:
            # Создаем новую комнату
            room = Room.objects.create(
                name=f"AI Assistant: {user.username}",
                room_type=Room.RoomType.AI,
                is_private=True
            )
            room.participants.add(user, ai_user)

        serializer = self.get_serializer(room)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def direct_message(self, request):
        """
        Получить или создать прямую переписку между текущим пользователем и другим пользователем.
        Используется для чата между учителем и учеником.
        """
        import logging
        logger = logging.getLogger(__name__)
        
        user = request.user
        other_user_id = request.data.get('user_id')
        
        logger.info(f'📞 direct_message API called: user={user.id} ({user.username}), other_user_id={other_user_id}')
        
        if not other_user_id:
            logger.error('❌ user_id is required')
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            other_user = User.objects.get(id=other_user_id)
            logger.info(f'✅ Other user found: {other_user.id} ({other_user.username})')
        except User.DoesNotExist:
            logger.error(f'❌ User not found: {other_user_id}')
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if other_user.id == user.id:
            logger.error('❌ Cannot create room with yourself')
            return Response({"error": "Cannot create room with yourself"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Ищем существующую комнату между этими двумя пользователями
        logger.info(f'🔍 Searching for existing Direct Message room between {user.id} and {other_user.id}')
        room = Room.objects.filter(
            room_type=Room.RoomType.DIRECT,
            participants=user,
            is_private=True
        ).filter(participants=other_user).first()
        
        if room:
            logger.info(f'✅ Existing room found: ID={room.id}, name={room.name}, active={room.is_active}')
        else:
            logger.info(f'🆕 No existing room found, creating new one...')
        
        if not room:
            # Создаем новую комнату
            room_name = f"{user.get_full_name() or user.username} & {other_user.get_full_name() or other_user.username}"
            logger.info(f'🆕 Creating room: name={room_name}')
            
            room = Room.objects.create(
                name=room_name,
                room_type=Room.RoomType.DIRECT,
                is_private=True,
                is_active=True  # Явно устанавливаем is_active
            )
            logger.info(f'✅ Room created: ID={room.id}')
            
            room.participants.add(user, other_user)
            logger.info(f'✅ Participants added: {[p.username for p in room.participants.all()]}')
            
            # Проверяем что участники добавлены
            participants_count = room.participants.count()
            logger.info(f'📊 Participants count: {participants_count}')
            if participants_count != 2:
                logger.error(f'❌ Failed to add participants. Expected 2, got {participants_count}')
                return Response(
                    {"error": f"Failed to add participants. Expected 2, got {participants_count}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Убеждаемся что комната активна
        if not room.is_active:
            logger.warn(f'⚠️  Room {room.id} is inactive, activating...')
            room.is_active = True
            room.save()
        
        # Проверяем что оба пользователя являются участниками
        participants = room.participants.all()
        participant_ids = [p.id for p in participants]
        logger.info(f'👥 Current participants: {participant_ids}')
        
        if user.id not in participant_ids or other_user.id not in participant_ids:
            logger.warn(f'⚠️  Missing participants, adding...')
            # Добавляем недостающих участников
            room.participants.add(user, other_user)
            logger.info(f'✅ Participants updated: {[p.username for p in room.participants.all()]}')
        
        serializer = self.get_serializer(room)
        response_data = serializer.data
        logger.info(f'✅ Returning room data: ID={response_data.get("id")}, type={response_data.get("room_type")}, active={response_data.get("is_active")}')
        return Response(response_data)

class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.request.query_params.get('room')
        if not room_id:
            return Message.objects.none()
        
        # Проверяем, что пользователь участник комнаты
        if not Room.objects.filter(id=room_id, participants=self.request.user).exists():
            return Message.objects.none()
            
        return Message.objects.filter(room_id=room_id, is_deleted=False).order_by('created_at')
