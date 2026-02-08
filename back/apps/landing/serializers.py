"""
Serializers for landing app.
"""
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import News, ContactMessage, CourseCategory, CourseSubCategory, Course, LeaderboardCarousel


class NewsSerializer(serializers.ModelSerializer):
    """Serializer for News model with language support."""
    title = serializers.SerializerMethodField()
    content = serializers.SerializerMethodField()
    preview = serializers.SerializerMethodField()
    
    class Meta:
        model = News
        fields = [
            "id",
            "image",
            "title",
            "content",
            "preview",
            "views",
            "is_featured",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "views"]
    
    def get_title(self, obj):
        """Get title based on request language."""
        request = self.context.get('request')
        if request:
            language = request.query_params.get('lang', 'tm')
        else:
            language = 'tm'
        
        return obj.get_title(language)
    
    def get_content(self, obj):
        """Get content based on request language."""
        request = self.context.get('request')
        if request:
            language = request.query_params.get('lang', 'tm')
        else:
            language = 'tm'
        
        return obj.get_content(language)
    
    def get_preview(self, obj):
        """Get preview of content (first 150 characters)."""
        request = self.context.get('request')
        if request:
            language = request.query_params.get('lang', 'tm')
        else:
            language = 'tm'
        
        content = obj.get_content(language)
        return content[:150] + '...' if len(content) > 150 else content
    
    def to_representation(self, instance):
        """Add full image URL."""
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if request and instance.image:
            representation['image'] = request.build_absolute_uri(instance.image.url)
        return representation


class AdminNewsSerializer(serializers.ModelSerializer):
    """Serializer for News model in admin panel - returns all fields."""
    
    class Meta:
        model = News
        fields = [
            "id",
            "image",
            "title_tm",
            "title_ru",
            "title_en",
            "content_tm",
            "content_ru",
            "content_en",
            "views",
            "is_published",
            "is_featured",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "views"]
    
    def to_representation(self, instance):
        """Add full image URL."""
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if request and instance.image:
            representation['image'] = request.build_absolute_uri(instance.image.url)
        return representation


class LeaderboardCarouselSerializer(serializers.ModelSerializer):
    """Serializer for LeaderboardCarousel model with dynamic student data."""
    title = serializers.SerializerMethodField()
    students = serializers.SerializerMethodField()
    course_name = serializers.CharField(source='course.name', read_only=True)
    exam_type_name = serializers.CharField(source='exam_type.name', read_only=True)

    class Meta:
        model = LeaderboardCarousel
        fields = ['id', 'title', 'course_name', 'exam_type_name', 'students', 'order']

    def get_title(self, obj):
        request = self.context.get('request')
        language = get_language_from_request(request)
        return obj.get_title(language)

    def get_students(self, obj):
        """Fetch top 10 students for this course and exam type across all groups."""
        from apps.courses.models import Group, ExamGrade
        
        # Find all groups for this course
        groups = Group.objects.filter(course=obj.course, is_active=True)
        if not groups.exists():
            return []

        # Get all grades for this exam type in these groups
        grades = ExamGrade.objects.filter(
            group__in=groups,
            exam_scheme_item__exam_type=obj.exam_type
        ).select_related('student', 'group')

        leaderboard_data = []
        # Student ID -> Max Score map to avoid duplicates if a student is in multiple groups (rare but possible)
        student_scores = {}

        request = self.context.get('request')

        for grade in grades:
            total_score = grade.get_total_score()
            if total_score > 0:
                student_id = grade.student.id
                if student_id not in student_scores or total_score > student_scores[student_id]['score']:
                    avatar_url = None
                    if grade.student.avatar:
                        avatar_url = request.build_absolute_uri(grade.student.avatar.url) if request else grade.student.avatar.url
                        
                    student_scores[student_id] = {
                        'student_name': grade.student.get_full_name() or grade.student.username,
                        'group_name': grade.group.name,
                        'score': total_score,
                        'student_avatar_url': avatar_url,
                        'student_gender': grade.student.gender,
                    }
        
        leaderboard_data = list(student_scores.values())
        leaderboard_data.sort(key=lambda x: x['score'], reverse=True)
        return leaderboard_data[:10]


class AdminLeaderboardCarouselSerializer(serializers.ModelSerializer):
    """Serializer for LeaderboardCarousel in admin panel."""
    course_name = serializers.CharField(source='course.name', read_only=True)
    exam_type_name = serializers.CharField(source='exam_type.name', read_only=True)

    class Meta:
        model = LeaderboardCarousel
        fields = [
            'id', 'course', 'course_name', 'exam_type', 'exam_type_name',
            'title_tm', 'title_ru', 'title_en', 'is_active', 'order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ContactMessageSerializer(serializers.ModelSerializer):
    """Serializer for ContactMessage model."""
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'phone', 'email', 'message', 'status', 'likes', 'is_liked', 'created_at', 'updated_at']
        read_only_fields = ['id', 'likes', 'is_liked', 'created_at', 'updated_at']
    
    def get_is_liked(self, obj):
        """Check if current user has liked this message."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.liked_by.filter(id=request.user.id).exists()
        return False


class AdminContactMessageSerializer(serializers.ModelSerializer):
    """Serializer for ContactMessage in admin panel (allows editing)."""
    
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'phone', 'email', 'message', 'status', 'likes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'likes', 'created_at', 'updated_at']


class ContactMessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating contact messages (without status)."""
    
    class Meta:
        model = ContactMessage
        fields = ['name', 'phone', 'email', 'message']
    
    def validate_email(self, value):
        """Validate email format."""
        if not value:
            raise serializers.ValidationError(_("Email is required"))
        return value
    
    def validate_message(self, value):
        """Validate message is not empty."""
        if not value or len(value.strip()) < 10:
            raise serializers.ValidationError(_("Message must be at least 10 characters"))
        return value


def get_language_from_request(request):
    """Helper function to get language from request."""
    if request:
        lang_param = request.query_params.get('lang', '').lower()
        if lang_param in ['tm', 'ru', 'en']:
            return lang_param
        accept_lang = request.META.get('HTTP_ACCEPT_LANGUAGE', '')
        if 'ru' in accept_lang.lower():
            return 'ru'
        elif 'en' in accept_lang.lower():
            return 'en'
    return 'tm'


class CourseCategorySerializer(serializers.ModelSerializer):
    """Serializer for CourseCategory with language support."""
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    
    class Meta:
        model = CourseCategory
        fields = [
            'id',
            'image',
            'icon',
            'name',
            'description',
            'order',
            'is_active',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_name(self, obj):
        """Get name based on request language."""
        request = self.context.get('request')
        language = get_language_from_request(request)
        return obj.get_name(language)
    
    def get_description(self, obj):
        """Get description based on request language."""
        request = self.context.get('request')
        language = get_language_from_request(request)
        return obj.get_description(language)


class CourseSubCategorySerializer(serializers.ModelSerializer):
    """Serializer for CourseSubCategory with language support."""
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    category_id = serializers.IntegerField(source='category.id', read_only=True)
    category_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CourseSubCategory
        fields = [
            'id',
            'image',
            'category_id',
            'category_name',
            'name',
            'description',
            'order',
            'is_active',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_name(self, obj):
        """Get name based on request language."""
        request = self.context.get('request')
        language = get_language_from_request(request)
        return obj.get_name(language)
    
    def get_description(self, obj):
        """Get description based on request language."""
        request = self.context.get('request')
        language = get_language_from_request(request)
        return obj.get_description(language)
    
    def get_category_name(self, obj):
        """Get category name based on request language."""
        request = self.context.get('request')
        language = get_language_from_request(request)
        return obj.category.get_name(language)


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course with language support."""
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    subcategory_id = serializers.IntegerField(source='subcategory.id', read_only=True)
    subcategory_name = serializers.SerializerMethodField()
    category_id = serializers.IntegerField(source='subcategory.category.id', read_only=True)
    category_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id',
            'image',
            'category_id',
            'category_name',
            'subcategory_id',
            'subcategory_name',
            'title',
            'description',
            'duration_weeks',
            'hours_per_week',
            'price',
            'discount_price',
            'is_active',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_title(self, obj):
        """Get title based on request language."""
        request = self.context.get('request')
        language = get_language_from_request(request)
        return obj.get_title(language)
    
    def get_description(self, obj):
        """Get description based on request language."""
        request = self.context.get('request')
        language = get_language_from_request(request)
        return obj.get_description(language)
    
    def get_subcategory_name(self, obj):
        """Get subcategory name based on request language."""
        request = self.context.get('request')
        language = get_language_from_request(request)
        return obj.subcategory.get_name(language)
    
    def get_category_name(self, obj):
        """Get category name based on request language."""
        request = self.context.get('request')
        language = get_language_from_request(request)
        return obj.subcategory.category.get_name(language)


# Admin Serializers with all multilingual fields exposed
class AdminCourseCategorySerializer(serializers.ModelSerializer):
    """Serializer for CourseCategory for admin panel with all multilingual fields."""
    class Meta:
        model = CourseCategory
        fields = [
            'id',
            'image',
            'icon',
            'name_tm',
            'name_ru',
            'name_en',
            'description_tm',
            'description_ru',
            'description_en',
            'order',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def to_representation(self, instance):
        """Add full image URL."""
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if request and instance.image:
            representation['image'] = request.build_absolute_uri(instance.image.url)
        return representation


class AdminCourseSubCategorySerializer(serializers.ModelSerializer):
    """Serializer for CourseSubCategory for admin panel with all multilingual fields."""
    category = serializers.PrimaryKeyRelatedField(queryset=CourseCategory.objects.all(), write_only=True, required=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True)
    category_name_tm = serializers.CharField(source='category.name_tm', read_only=True)
    category_name_ru = serializers.CharField(source='category.name_ru', read_only=True)
    category_name_en = serializers.CharField(source='category.name_en', read_only=True)
    
    class Meta:
        model = CourseSubCategory
        fields = [
            'id',
            'image',
            'category',
            'category_id',
            'category_name_tm',
            'category_name_ru',
            'category_name_en',
            'name_tm',
            'name_ru',
            'name_en',
            'description_tm',
            'description_ru',
            'description_en',
            'order',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def to_representation(self, instance):
        """Add full image URL."""
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if request and instance.image:
            representation['image'] = request.build_absolute_uri(instance.image.url)
        return representation


class AdminCourseSerializer(serializers.ModelSerializer):
    """Serializer for Course for admin panel with all multilingual fields."""
    subcategory = serializers.PrimaryKeyRelatedField(queryset=CourseSubCategory.objects.all(), write_only=True, required=True)
    subcategory_id = serializers.IntegerField(source='subcategory.id', read_only=True)
    subcategory_name_tm = serializers.CharField(source='subcategory.name_tm', read_only=True)
    subcategory_name_ru = serializers.CharField(source='subcategory.name_ru', read_only=True)
    subcategory_name_en = serializers.CharField(source='subcategory.name_en', read_only=True)
    category_id = serializers.IntegerField(source='subcategory.category.id', read_only=True)
    category_name_tm = serializers.CharField(source='subcategory.category.name_tm', read_only=True)
    category_name_ru = serializers.CharField(source='subcategory.category.name_ru', read_only=True)
    category_name_en = serializers.CharField(source='subcategory.category.name_en', read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id',
            'image',
            'subcategory',
            'subcategory_id',
            'subcategory_name_tm',
            'subcategory_name_ru',
            'subcategory_name_en',
            'category_id',
            'category_name_tm',
            'category_name_ru',
            'category_name_en',
            'title_tm',
            'title_ru',
            'title_en',
            'description_tm',
            'description_ru',
            'description_en',
            'duration_weeks',
            'hours_per_week',
            'price',
            'discount_price',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def to_representation(self, instance):
        """Add full image URL."""
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if request and instance.image:
            representation['image'] = request.build_absolute_uri(instance.image.url)
        return representation
