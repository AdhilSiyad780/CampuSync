from rest_framework import serializers
from django.utils import timezone
from .models import Exam, ExamResult, ExamConcern


class ExamSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.fullname', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=True
    )
    classes_details = serializers.SerializerMethodField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)
    result_count = serializers.IntegerField(read_only=True)
    graded_count = serializers.IntegerField(read_only=True)
    
    # For student view - their own result
    my_result = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Exam
        fields = [
            'id',
            'title',
            'description',
            'subject',
            'subject_name',
            'class_ids',
            'classes_details',
            'teacher',
            'teacher_name',
            'exam_date',
            'start_time',
            'end_time',
            'room',
            'max_marks',
            'status',
            'is_past',
            'result_count',
            'graded_count',
            'my_result',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'teacher', 'created_at', 'updated_at']
    
    def get_classes_details(self, obj):
        return [
            {
                'id': cls.id,
                'class_name': cls.class_name,
                'division': cls.division,
                'academic_year': cls.academic_year
            }
            for cls in obj.classes.all()
        ]
    
    def get_my_result(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        if request.user.user_type != 'student':
            return None
        
        try:
            result = obj.results.get(student=request.user)
            return {
                'id': result.id,
                'marks_obtained': result.marks_obtained,
                'percentage': result.percentage,
                'grade': result.grade,
                'status': result.status,
                'remarks': result.remarks,
                'graded_at': result.graded_at,
            }
        except ExamResult.DoesNotExist:
            return None
    
    def create(self, validated_data):
        # Pop class_ids before the model creation
        class_ids = validated_data.pop('class_ids', [])
        request = self.context.get('request')
        
        # Create the exam instance
        exam = Exam.objects.create(
            tenant=request.user.tenant,
            teacher=request.user,
            **validated_data
        )
        
        # Sync the classes
        if class_ids:
            from class_announcement_attendence.models import SchoolClass
            classes = SchoolClass.objects.filter(id__in=class_ids, tenant=request.user.tenant)
            exam.classes.set(classes)
        
        return exam
    
    def update(self, instance, validated_data):
        class_ids = validated_data.pop('class_ids', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update classes if provided
        if class_ids is not None:
            from class_announcement_attendence.models import SchoolClass
            classes = SchoolClass.objects.filter(
                id__in=class_ids,
                tenant=instance.tenant
            )
            instance.classes.set(classes)
        
        return instance


class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.fullname', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_roll = serializers.IntegerField(
        source='student.student_profile.roll_number', 
        read_only=True
    )
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    exam_max_marks = serializers.IntegerField(source='exam.max_marks', read_only=True)
    percentage = serializers.FloatField(read_only=True)
    grade = serializers.CharField(read_only=True)
    
    # Check if student has raised concern
    has_concern = serializers.SerializerMethodField(read_only=True)
    pending_concern = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = ExamResult
        fields = [
            'id',
            'exam',
            'exam_title',
            'exam_max_marks',
            'student',
            'student_name',
            'student_email',
            'student_roll',
            'marks_obtained',
            'percentage',
            'grade',
            'status',
            'remarks',
            'has_concern',
            'pending_concern',
            'graded_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'student', 'graded_at', 'created_at', 'updated_at']
    
    def get_has_concern(self, obj):
        return obj.concerns.exists()
    
    def get_pending_concern(self, obj):
        concern = obj.concerns.filter(status__in=['pending', 'under_review']).first()
        if concern:
            return {
                'id': concern.id,
                'status': concern.status,
                'concern_text': concern.concern_text,
                'created_at': concern.created_at,
            }
        return None
    
    def update(self, instance, validated_data):
        # If grading, set graded_at timestamp
        if 'marks_obtained' in validated_data and validated_data['marks_obtained'] is not None:
            validated_data['status'] = 'graded'
            validated_data['graded_at'] = timezone.now()
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance


class ExamResultListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing results"""
    student_name = serializers.CharField(source='student.fullname', read_only=True)
    student_roll = serializers.IntegerField(
        source='student.student_profile.roll_number', 
        read_only=True
    )
    percentage = serializers.FloatField(read_only=True)
    grade = serializers.CharField(read_only=True)
    has_concern = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = ExamResult
        fields = [
            'id',
            'student',
            'student_name',
            'student_roll',
            'marks_obtained',
            'percentage',
            'grade',
            'status',
            'has_concern',
            'graded_at',
        ]
    
    def get_has_concern(self, obj):
        return obj.concerns.filter(status__in=['pending', 'under_review']).exists()


class ExamConcernSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.fullname', read_only=True)
    exam_title = serializers.CharField(source='result.exam.title', read_only=True)
    subject_name = serializers.CharField(source='result.exam.subject.name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.fullname', read_only=True)
    
    class Meta:
        model = ExamConcern
        fields = [
            'id',
            'result',
            'student',
            'student_name',
            'exam_title',
            'subject_name',
            'concern_text',
            'status',
            'response',
            'reviewed_by',
            'reviewed_by_name',
            'previous_marks',
            'revised_marks',
            'created_at',
            'reviewed_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'student', 'reviewed_by', 'reviewed_at', 
            'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        request = self.context.get('request')
        result = validated_data.get('result')
        
        # Store current marks as previous marks
        validated_data['previous_marks'] = result.marks_obtained
        
        concern = ExamConcern.objects.create(
            student=request.user,
            **validated_data
        )
        
        return concern