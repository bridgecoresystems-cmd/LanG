"""
Serializers for users app.
"""
from rest_framework import serializers
from .models import User, TeacherProfile, StudentProfile
from .services import generate_unique_username, generate_random_password, send_welcome_email
from apps.landing.serializers import get_language_from_request


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    wallet_balance = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'gender',
            'phone',
            'avatar',
            'avatar_url',
            'date_of_birth',
            'address',
            'is_active',
            'is_staff',
            'is_superuser',
            'wallet_balance',
        ]
        read_only_fields = ['id', 'wallet_balance']
        extra_kwargs = {
            'username': {'required': False, 'allow_blank': False},
            'email': {'required': False},
        }
    
    def __init__(self, *args, **kwargs):
        """Initialize serializer and store original username."""
        super().__init__(*args, **kwargs)
        # Store original username if this is an update
        if self.instance:
            # Get fresh username from database
            if hasattr(self.instance, 'pk') and self.instance.pk:
                try:
                    self.instance.refresh_from_db(fields=['username'])
                except Exception:
                    pass
            self._original_username = getattr(self.instance, 'username', None)
    
    def validate_username(self, value):
        """Validate username uniqueness, excluding current instance."""
        import logging
        logger = logging.getLogger(__name__)
        
        # For partial updates (PATCH), if value is not provided, skip validation
        # This method is only called if 'username' is in the input data
        if value is None:
            # If None is explicitly passed, that's an error
            raise serializers.ValidationError("Username cannot be None.")
        
        # If value is provided, validate it
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise serializers.ValidationError("Username cannot be empty.")
        else:
            raise serializers.ValidationError("Username must be a string.")
        
        # If this is an update (instance exists), check if username changed
        if self.instance and hasattr(self.instance, 'pk') and self.instance.pk:
            # Get original username from stored value or instance
            if hasattr(self, '_original_username') and self._original_username is not None:
                current_username = self._original_username
            else:
                # Fallback: get from instance
                current_username = getattr(self.instance, 'username', None) or ''
            
            # Normalize both values for comparison
            current_normalized = current_username.strip() if current_username else ''
            value_normalized = value.strip() if value else ''
            
            logger.info(f"Validating username: new='{value_normalized}' (len={len(value_normalized)}), current='{current_normalized}' (len={len(current_normalized)}), instance_id={self.instance.pk}")
            logger.info(f"Username comparison: '{current_normalized}' == '{value_normalized}' ? {current_normalized == value_normalized}")
            
            # Compare normalized values (both trimmed, case-sensitive)
            if current_normalized == value_normalized:
                # Username hasn't changed, skip uniqueness check
                logger.info(f"Username unchanged, skipping uniqueness check")
                return value
            
            # Username has changed, need to check if new username is available
            logger.info(f"Username changed from '{current_normalized}' to '{value_normalized}', checking uniqueness")
            queryset = User.objects.filter(username=value_normalized).exclude(pk=self.instance.pk)
        else:
            # This is a create operation, check if username exists
            logger.info(f"Creating new user, checking username uniqueness: '{value}'")
            queryset = User.objects.filter(username=value)
        
        existing_count = queryset.count()
        if existing_count > 0:
            existing_user = queryset.first()
            logger.warning(f"Username '{value}' already exists (found {existing_count} user(s), first ID: {existing_user.pk if existing_user else 'N/A'})")
            raise serializers.ValidationError("A user with that username already exists.")
        
        logger.info(f"Username '{value}' is available")
        return value
    
    def get_full_name(self, obj):
        """Get full name of the user."""
        try:
            return obj.get_full_name() or obj.username
        except Exception:
            return getattr(obj, 'username', 'Unknown')
    
    def get_avatar_url(self, obj):
        """Get full avatar URL."""
        try:
            request = self.context.get('request')
            if hasattr(obj, 'avatar') and obj.avatar and request:
                return request.build_absolute_uri(obj.avatar.url)
        except Exception:
            pass
        return None
    
    def get_wallet_balance(self, obj):
        """Get wallet balance for the user."""
        try:
            # First check if user has a wallet via related name
            wallet = getattr(obj, 'wallet', None)
            if wallet:
                return float(wallet.balance)
            
            # If not, try to fetch it directly to be sure
            from apps.points.models import Wallet
            wallet = Wallet.objects.filter(user=obj).first()
            if wallet:
                return float(wallet.balance)
        except Exception:
            pass
        return 0.00


class TeacherProfileSerializer(serializers.ModelSerializer):
    """Serializer for TeacherProfile with user data."""
    id = serializers.IntegerField(source='user.id', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)  # Explicit user_id for consistency
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    full_name = serializers.SerializerMethodField()
    email = serializers.CharField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    avatar_url = serializers.SerializerMethodField()
    video_url = serializers.SerializerMethodField()
    specialization = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = TeacherProfile
        fields = [
            'id',
            'user_id',
            'username',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'phone',
            'is_active',
            'avatar_url',
            'specialization_tm',
            'specialization_ru',
            'specialization_en',
            'specialization',
            'experience_years',
            'bio_tm',
            'bio_ru',
            'bio_en',
            'bio',
            'video',
            'video_url',
            'views',
            'likes',
            'is_liked',
            'hire_date',
        ]
        read_only_fields = ['views', 'likes', 'avatar_url', 'is_liked']
    
    def get_full_name(self, obj):
        """Get full name of the teacher."""
        try:
            if obj.user:
                return obj.user.get_full_name() or obj.user.username
        except (AttributeError, Exception):
            pass
        return ''
    
    def get_avatar_url(self, obj):
        """Get full avatar URL."""
        request = self.context.get('request')
        try:
            if obj.user and hasattr(obj.user, 'avatar') and obj.user.avatar and request:
                return request.build_absolute_uri(obj.user.avatar.url)
        except (AttributeError, ValueError, Exception):
            pass
        return None
    
    def get_video_url(self, obj):
        """Get full video URL."""
        request = self.context.get('request')
        try:
            if hasattr(obj, 'video') and obj.video and request:
                return request.build_absolute_uri(obj.video.url)
        except (AttributeError, ValueError, Exception):
            pass
        return None
    
    def get_specialization(self, obj):
        """Get specialization in current language."""
        request = self.context.get('request')
        if not request:
            return obj.specialization_tm or ''
        
        lang = get_language_from_request(request) or 'tm'
        lang_map = {
            'tm': 'specialization_tm',
            'ru': 'specialization_ru',
            'en': 'specialization_en',
        }
        field_name = lang_map.get(lang, 'specialization_tm')
        return getattr(obj, field_name, '') or obj.specialization_tm or ''
    
    def get_bio(self, obj):
        """Get bio in current language."""
        request = self.context.get('request')
        if not request:
            return obj.bio_tm or ''
        
        lang = get_language_from_request(request) or 'tm'
        lang_map = {
            'tm': 'bio_tm',
            'ru': 'bio_ru',
            'en': 'bio_en',
        }
        field_name = lang_map.get(lang, 'bio_tm')
        return getattr(obj, field_name, '') or obj.bio_tm or ''
    
    def get_is_liked(self, obj):
        """Check if current user has liked this teacher."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.liked_by.filter(id=request.user.id).exists()
        return False


class TeacherListSerializer(serializers.ModelSerializer):
    """Serializer for TeacherProfile list view."""
    # Use TeacherProfile.id (not user.id) because ViewSet uses TeacherProfile as primary model
    id = serializers.IntegerField(read_only=True)  # This is TeacherProfile.id
    user_id = serializers.IntegerField(source='user.id', read_only=True)  # For reference
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    full_name = serializers.SerializerMethodField()
    email = serializers.CharField(source='user.email', read_only=True)
    avatar_url = serializers.SerializerMethodField()
    specialization = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = TeacherProfile
        fields = [
            'id',
            'user_id',
            'username',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'avatar_url',
            'specialization_tm',
            'specialization_ru',
            'specialization_en',
            'specialization',
            'experience_years',
            'views',
            'likes',
            'is_liked',
        ]
        read_only_fields = ['views', 'likes', 'is_liked']
    
    def get_full_name(self, obj):
        """Get full name of the teacher."""
        try:
            if obj.user:
                return obj.user.get_full_name() or obj.user.username
        except (AttributeError, Exception):
            pass
        return ''
    
    def get_avatar_url(self, obj):
        """Get full avatar URL."""
        request = self.context.get('request')
        try:
            if obj.user and hasattr(obj.user, 'avatar') and obj.user.avatar and request:
                return request.build_absolute_uri(obj.user.avatar.url)
        except (AttributeError, ValueError, Exception):
            pass
        return None
    
    def get_specialization(self, obj):
        """Get specialization in current language."""
        request = self.context.get('request')
        if not request:
            return obj.specialization_tm or ''
        
        lang = get_language_from_request(request) or 'tm'
        lang_map = {
            'tm': 'specialization_tm',
            'ru': 'specialization_ru',
            'en': 'specialization_en',
        }
        field_name = lang_map.get(lang, 'specialization_tm')
        return getattr(obj, field_name, '') or obj.specialization_tm or ''
    
    def get_is_liked(self, obj):
        """Check if current user has liked this teacher."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.liked_by.filter(id=request.user.id).exists()
        return False


class StudentProfileSerializer(serializers.ModelSerializer):
    """Serializer for StudentProfile with user data."""
    # Use StudentProfile.id (not user.id) because ViewSet uses StudentProfile as primary model
    id = serializers.IntegerField(read_only=True)  # This is StudentProfile.id
    user_id = serializers.IntegerField(source='user.id', read_only=True)  # For reference
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    full_name = serializers.SerializerMethodField()
    email = serializers.CharField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    gender = serializers.CharField(source='user.gender', read_only=True)
    date_of_birth = serializers.DateField(source='user.date_of_birth', read_only=True)
    address = serializers.CharField(source='user.address', read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    avatar_url = serializers.SerializerMethodField()
    wallet_balance = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentProfile
        fields = [
            'id',
            'user_id',
            'username',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'phone',
            'gender',
            'date_of_birth',
            'address',
            'parent1_name',
            'parent1_phone',
            'parent2_name',
            'parent2_phone',
            'parent_name',
            'parent_phone',
            'wallet_balance',
            'rfid_uid',
            'is_active',
            'avatar_url',
        ]
    
    def get_wallet_balance(self, obj):
        """Get wallet balance for the student."""
        try:
            # Check user's wallet
            wallet = getattr(obj.user, 'wallet', None)
            if wallet:
                return float(wallet.balance)
            
            # Try direct fetch
            from apps.points.models import Wallet
            wallet = Wallet.objects.filter(user=obj.user).first()
            if wallet:
                return float(wallet.balance)
        except Exception:
            pass
        return 0.00
    
    def get_full_name(self, obj):
        """Get full name of the student."""
        try:
            if obj.user:
                return obj.user.get_full_name() or obj.user.username
        except (AttributeError, Exception):
            pass
        return ''
    
    def get_avatar_url(self, obj):
        """Get full avatar URL."""
        request = self.context.get('request')
        try:
            if obj.user and hasattr(obj.user, 'avatar') and obj.user.avatar and request:
                return request.build_absolute_uri(obj.user.avatar.url)
        except (AttributeError, ValueError, Exception):
            pass
        return None


class CreateTeacherSerializer(serializers.Serializer):
    """Serializer for creating a teacher with user and profile."""
    # User fields
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password_confirmation = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    
    # Teacher profile fields
    specialization_tm = serializers.CharField(required=False, allow_blank=True)
    specialization_ru = serializers.CharField(required=False, allow_blank=True)
    specialization_en = serializers.CharField(required=False, allow_blank=True)
    bio_tm = serializers.CharField(required=False, allow_blank=True)
    bio_ru = serializers.CharField(required=False, allow_blank=True)
    bio_en = serializers.CharField(required=False, allow_blank=True)
    experience_years = serializers.IntegerField(required=False, default=0, min_value=0)
    hire_date = serializers.DateField(required=False, allow_null=True)
    video = serializers.FileField(required=False, allow_null=True)
    
    def validate(self, data):
        """Validate password confirmation."""
        if data.get('password') != data.get('password_confirmation'):
            raise serializers.ValidationError({
                'password_confirmation': 'Passwords do not match.'
            })
        return data
    
    def create(self, validated_data):
        """Create user and teacher profile."""
        password = validated_data.pop('password')
        password_confirmation = validated_data.pop('password_confirmation')
        
        # Extract user fields
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        
        # Check if username already exists
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({
                'username': 'A user with this username already exists.'
            })
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({
                'email': 'A user with this email already exists.'
            })
        
        user_data = {
            'username': username,
            'email': email,
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'phone': validated_data.pop('phone', ''),
            'role': User.Role.TEACHER,
        }
        avatar = validated_data.pop('avatar', None)
        
        # Create user
        user = User.objects.create_user(**user_data)
        user.set_password(password)
        if avatar:
            user.avatar = avatar
        user.save()
        
        # Create teacher profile
        teacher_profile = TeacherProfile.objects.create(
            user=user,
            specialization_tm=validated_data.get('specialization_tm', ''),
            specialization_ru=validated_data.get('specialization_ru', ''),
            specialization_en=validated_data.get('specialization_en', ''),
            bio_tm=validated_data.get('bio_tm', ''),
            bio_ru=validated_data.get('bio_ru', ''),
            bio_en=validated_data.get('bio_en', ''),
            experience_years=validated_data.get('experience_years', 0),
            hire_date=validated_data.get('hire_date'),
            video=validated_data.get('video'),
        )
        
        return teacher_profile
    
    def to_representation(self, instance):
        """Convert TeacherProfile to dict with user data."""
        # Use TeacherProfileSerializer to properly serialize the instance
        return TeacherProfileSerializer(instance, context=self.context).data


class CreateStudentSerializer(serializers.Serializer):
    """Serializer for creating a student with user and profile."""
    # User fields - made optional for automatic generation
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)
    password_confirmation = serializers.CharField(write_only=True, required=False, allow_blank=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    gender = serializers.ChoiceField(choices=User.Gender.choices, required=False, allow_null=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    
    # Student profile fields
    parent1_name = serializers.CharField(required=False, allow_blank=True)
    parent1_phone = serializers.CharField(required=False, allow_blank=True)
    parent2_name = serializers.CharField(required=False, allow_blank=True)
    parent2_phone = serializers.CharField(required=False, allow_blank=True)
    rfid_uid = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    def validate(self, data):
        """Validate password confirmation if provided."""
        password = data.get('password')
        password_confirmation = data.get('password_confirmation')
        
        if password and password != password_confirmation:
            raise serializers.ValidationError({
                'password_confirmation': 'Passwords do not match.'
            })
        return data
    
    def create(self, validated_data):
        """Create user and student profile with auto-generation."""
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        email = validated_data.pop('email')
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({
                'email': 'A user with this email already exists.'
            })
            
        # 1. Automatic Gender Determination if not provided
        gender = validated_data.pop('gender', None)
        if not gender:
            last_name_lower = last_name.lower()
            if last_name_lower.endswith('wa'):
                gender = User.Gender.GIRL
            elif last_name_lower.endswith('w'):
                gender = User.Gender.BOY
            else:
                gender = User.Gender.BOY  # Default fallback

        # 2. Automatic Username Generation
        username = validated_data.pop('username', None)
        if not username:
            username = generate_unique_username(first_name)
        
        # Check if username already exists (just in case)
        if User.objects.filter(username=username).exists():
            username = generate_unique_username(first_name)
            if User.objects.filter(username=username).exists():
                raise serializers.ValidationError({
                    'username': 'Could not generate a unique username. Please provide one manually.'
                })
        
        # 3. Automatic Password Generation
        password = validated_data.pop('password', None)
        validated_data.pop('password_confirmation', None) # Remove if exists
        
        raw_password = password
        if not raw_password:
            raw_password = generate_random_password()
        
        user_data = {
            'username': username,
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'phone': validated_data.pop('phone', ''),
            'gender': gender,
            'role': User.Role.STUDENT,
        }
        avatar = validated_data.pop('avatar', None)
        
        # Create user
        user = User.objects.create_user(**user_data)
        user.set_password(raw_password)
        if avatar:
            user.avatar = avatar
        user.save()
        
        # Create student profile
        student_profile = StudentProfile.objects.create(
            user=user,
            parent1_name=validated_data.get('parent1_name', ''),
            parent1_phone=validated_data.get('parent1_phone', ''),
            parent2_name=validated_data.get('parent2_name', ''),
            parent2_phone=validated_data.get('parent2_phone', ''),
            points=0,
            rfid_uid=validated_data.get('rfid_uid'),
        )
        
        # 4. Send Welcome Email
        send_welcome_email(user, raw_password)
        
        return student_profile
    
    def to_representation(self, instance):
        """Convert StudentProfile to dict with user data."""
        # Use StudentProfileSerializer to properly serialize the instance
        return StudentProfileSerializer(instance, context=self.context).data


class CreateDirectorSerializer(serializers.Serializer):
    """Serializer for creating a director."""
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password_confirmation = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    
    def validate(self, data):
        """Validate password confirmation."""
        if data.get('password') != data.get('password_confirmation'):
            raise serializers.ValidationError({
                'password_confirmation': 'Passwords do not match.'
            })
        return data
    
    def create(self, validated_data):
        """Create director user."""
        password = validated_data.pop('password')
        password_confirmation = validated_data.pop('password_confirmation')
        
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        
        # Check if username already exists
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({
                'username': 'A user with this username already exists.'
            })
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({
                'email': 'A user with this email already exists.'
            })
        
        user_data = {
            'username': username,
            'email': email,
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'phone': validated_data.pop('phone', ''),
            'role': User.Role.DIRECTOR,
        }
        avatar = validated_data.pop('avatar', None)
        
        user = User.objects.create_user(**user_data)
        user.set_password(password)
        if avatar:
            user.avatar = avatar
        user.save()
        
        return user
    
    def to_representation(self, instance):
        """Convert User to dict."""
        # Use UserSerializer to properly serialize the instance
        return UserSerializer(instance, context=self.context).data


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password."""
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)
    new_password_confirmation = serializers.CharField(write_only=True, required=True)
    
    def validate_old_password(self, value):
        """Validate that old password is correct."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
    
    def validate(self, data):
        """Validate that new passwords match."""
        if data.get('new_password') != data.get('new_password_confirmation'):
            raise serializers.ValidationError({
                'new_password_confirmation': 'New passwords do not match.'
            })
        return data
    
    def save(self):
        """Update user password."""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class CreateAdministratorSerializer(serializers.Serializer):
    """Serializer for creating an administrator (not superuser)."""
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password_confirmation = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    
    def validate(self, data):
        """Validate password confirmation."""
        if data.get('password') != data.get('password_confirmation'):
            raise serializers.ValidationError({
                'password_confirmation': 'Passwords do not match.'
            })
        return data
    
    def create(self, validated_data):
        """Create administrator user."""
        password = validated_data.pop('password')
        password_confirmation = validated_data.pop('password_confirmation')
        
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        
        # Check if username already exists
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({
                'username': 'A user with this username already exists.'
            })
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({
                'email': 'A user with this email already exists.'
            })
        
        user_data = {
            'username': username,
            'email': email,
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'phone': validated_data.pop('phone', ''),
            'role': User.Role.ADMIN,
            'is_staff': True,  # Administrator can access admin panel
        }
        avatar = validated_data.pop('avatar', None)
        
        user = User.objects.create_user(**user_data)
        user.set_password(password)
        if avatar:
            user.avatar = avatar
        user.save()
        
        return user
    
    def to_representation(self, instance):
        """Convert User to dict."""
        # Use UserSerializer to properly serialize the instance
        return UserSerializer(instance, context=self.context).data


class CreateHeadTeacherSerializer(serializers.Serializer):
    """Serializer for creating a head teacher."""
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password_confirmation = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    
    def validate(self, data):
        """Validate password confirmation."""
        if data.get('password') != data.get('password_confirmation'):
            raise serializers.ValidationError({
                'password_confirmation': 'Passwords do not match.'
            })
        return data
    
    def create(self, validated_data):
        """Create head teacher user."""
        password = validated_data.pop('password')
        password_confirmation = validated_data.pop('password_confirmation')
        
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        
        # Check if username already exists
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({
                'username': 'A user with this username already exists.'
            })
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({
                'email': 'A user with this email already exists.'
            })
        
        user_data = {
            'username': username,
            'email': email,
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'phone': validated_data.pop('phone', ''),
            'role': User.Role.HEAD_TEACHER,
            'is_staff': True,  # Head teacher can access admin panel
        }
        avatar = validated_data.pop('avatar', None)
        
        user = User.objects.create_user(**user_data)
        user.set_password(password)
        if avatar:
            user.avatar = avatar
        user.save()
        
        return user
    
    def to_representation(self, instance):
        """Convert User to dict."""
        # Use UserSerializer to properly serialize the instance
        return UserSerializer(instance, context=self.context).data


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password."""
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)
    new_password_confirmation = serializers.CharField(write_only=True, required=True)
    
    def validate_old_password(self, value):
        """Validate that old password is correct."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
    
    def validate(self, data):
        """Validate that new passwords match."""
        if data.get('new_password') != data.get('new_password_confirmation'):
            raise serializers.ValidationError({
                'new_password_confirmation': 'New passwords do not match.'
            })
        return data
    
    def save(self):
        """Update user password."""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
