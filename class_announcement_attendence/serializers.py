from django.utils import timezone
from rest_framework import serializers
from .models import Announcement, SchoolClass,Subject
from core.models import User

class ClassTeacherSerializer(serializers.ModelSerializer):
    """Nested serializer for class teacher details"""
    class Meta:
        model = User
        fields = ['id', 'fullname', 'email']

class SchoolClassSerializer(serializers.ModelSerializer):
    class_teacher_details = ClassTeacherSerializer(source='class_teacher', read_only=True)
    class_teacher_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(user_type='teacher'),
        source='class_teacher',
        required=False,
        allow_null=True
    )
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SchoolClass
        fields = [
            'id', 
            'class_name', 
            'division', 
            'academic_year',
            'capacity',
            'class_teacher_id',
            'class_teacher_details',
            'student_count',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_student_count(self, obj):
        """Count students enrolled in this class"""
        return obj.tenant.student_profiles.filter(class_id=obj.id).count()
    
    def validate(self, attrs):
        """Custom validation"""
        capacity = attrs.get('capacity', 0)
        if capacity < 0:
            raise serializers.ValidationError({"capacity": "Capacity cannot be negative"})
        
        # Check for duplicate class in same academic year
        request = self.context.get('request')
        if request and request.user:
            tenant = request.user.tenant
            class_name = attrs.get('class_name')
            division = attrs.get('division')
            academic_year = attrs.get('academic_year')
            
            # Exclude current instance when updating
            queryset = SchoolClass.objects.filter(
                tenant=tenant,
                class_name=class_name,
                division=division,
                academic_year=academic_year
            )
            
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            
            if queryset.exists():
                raise serializers.ValidationError(
                    "A class with this name, division, and academic year already exists."
                )
        
        return attrs
    
    def create(self, validated_data):
        request = self.context.get('request')
        tenant = request.user.tenant
        return SchoolClass.objects.create(tenant=tenant, **validated_data)



class AnnouncementSerializer(serializers.ModelSerializer):
    # 1. Custom Field Definitions
    author_name = serializers.CharField(source='author.fullname', read_only=True)
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        # 2. Field Inclusion
        fields = [
            'id', 'title', 'description', 'attachment', 
            'target_audience', 'expiry_date', 'author_name', 
            'is_active', 'created_at'
        ]
        # 3. Restriction
        read_only_fields = ['id', 'created_at', 'author_name']

    # 4. Logic for MethodField
    def get_is_active(self, obj):
        return obj.expiry_date > timezone.now()

    # 5. Custom Save Logic
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['tenant'] = request.user.tenant
        validated_data['author'] = request.user
        return super().create(validated_data)
    

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields =  [
            'id','name','code','description'
        ]
    def create(self,validated_data):
        requets  = self.context.get('request')
        validated_data['tenant'] = requets.user.tenant
        return super().create(validated_data)
    

