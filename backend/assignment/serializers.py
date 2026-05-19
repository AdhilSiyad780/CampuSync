from rest_framework import serializers
from django.utils import timezone
from assignment.models import Assignment, AssignmentSubmission

class AssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.fullname', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=True
    )
    classes_details = serializers.SerializerMethodField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    submission_count = serializers.IntegerField(read_only=True)
    
    # New fields for Student Dashboard
    my_submission_status = serializers.SerializerMethodField()
    my_submission_details = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'description', 'subject', 'subject_name',
            'teacher', 'teacher_name', 'class_ids', 'classes_details',
            'due_date', 'total_marks', 'attachment', 'is_overdue',
            'submission_count', 'my_submission_status', 'my_submission_details',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'teacher', 'created_at', 'updated_at']

    # Logic moved here because 'obj' is an Assignment instance
    def get_my_submission_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.user_type == 'student':
            submission = obj.submissions.filter(student=request.user).first()
            if submission:
                return submission.status
        return 'pending'

    def get_my_submission_details(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.user_type == 'student':
            submission = obj.submissions.filter(student=request.user).first()
            if submission and submission.status == 'graded':
                return {
                    'marks_obtained': submission.marks_obtained,
                    'feedback': submission.feedback,
                    'graded_at': submission.graded_at
                }
        return None

    def get_classes_details(self, obj):
        return [
            {'id': cls.id, 'class_name': cls.class_name, 'division': cls.division}
            for cls in obj.classes.all()
        ]

    def create(self, validated_data):
        class_ids = validated_data.pop('class_ids', [])
        request = self.context.get('request')
        assignment = Assignment.objects.create(
            tenant=request.user.tenant,
            teacher=request.user,
            **validated_data
        )
        if class_ids:
            from class_announcement_attendence.models import SchoolClass
            classes = SchoolClass.objects.filter(id__in=class_ids, tenant=request.user.tenant)
            assignment.classes.set(classes)
        return assignment

    def update(self, instance, validated_data):
        class_ids = validated_data.pop('class_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if class_ids is not None:
            from class_announcement_attendence.models import SchoolClass
            classes = SchoolClass.objects.filter(id__in=class_ids, tenant=instance.tenant)
            instance.classes.set(classes)
        return instance



class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.fullname', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    assignment_total_marks = serializers.IntegerField(source='assignment.total_marks', read_only=True)
    is_late = serializers.BooleanField(read_only=True)
    percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'assignment', 'assignment_title', 'assignment_total_marks',
            'student', 'student_name', 'student_email', 'submission_text',
            'attachment', 'marks_obtained', 'feedback', 'status',
            'is_late', 'percentage', 'submitted_at', 'graded_at', 'updated_at',
        ]
        read_only_fields = ['id', 'student', 'submitted_at', 'graded_at', 'updated_at']

    def create(self, validated_data):
        # View passes student=user in serializer.save(student=user)
        student = validated_data.pop('student', self.context.get('request').user)
        assignment = validated_data.get('assignment')
        
        if timezone.now() > assignment.due_date:
            validated_data['status'] = 'late'
        else:
            validated_data['status'] = 'submitted'

        return AssignmentSubmission.objects.create(student=student, **validated_data)

    def update(self, instance, validated_data):
        if 'marks_obtained' in validated_data and validated_data['marks_obtained'] is not None:
            validated_data['status'] = 'graded'
            validated_data['graded_at'] = timezone.now()
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class AssignmentSubmissionListSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.fullname', read_only=True)
    student_roll = serializers.IntegerField(source='student.student_profile.roll_number', read_only=True)
    
    class Meta:
        model = AssignmentSubmission
        fields = ['id', 'student', 'student_name', 'student_roll', 'marks_obtained', 'status', 'submitted_at']