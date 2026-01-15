
from config import settings
from core.models import User,Tenant

from rest_framework import serializers
from members.models import StudentProfile,ParentProfile,ParentStudentRelation
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail


class AdminProfileSerializers(serializers.ModelSerializer):
    class Meta:
        model  = User 
        fields = [
            'fullname',
            
            'phone',
            'DOB',
            'gender'
        ]
        extra_kwargs = {
            'phone': {'required': False},
            'DOB': {'required': False},
            'gender': {'required': False},
            'fullname': {'required': False},
        }

class SchoolProfileSerializers(serializers.ModelSerializer):
    class Meta:
        model  = Tenant
        fields = [
             "instance_name",
            "email",
            "phone",
        ]
        extra_kwargs = {
            'instance_name': {'required': False},
            'email': {'required': False},
            'phone': {'required': False},
        }


class StudentProfileSerializers(serializers.ModelSerializer):
    admission_number = serializers.CharField(source='student_profile.admission_number', read_only=True)
    admission_date = serializers.DateTimeField(source='student_profile.admission_date', read_only=True)
    blood_group = serializers.CharField(source='student_profile.blood_group', required=False, allow_blank=True)
    section = serializers.CharField(source='student_profile.section', required=False, allow_blank=True)  # ADD allow_blank=True
    guardian_name = serializers.CharField(source='student_profile.guardian_name', required=False, allow_blank=True)
    guardian_number = serializers.CharField(source='student_profile.guardian_number', required=False, allow_blank=True)
    roll_number = serializers.IntegerField(source='student_profile.roll_number', required=False, allow_null=True)
    student_contact = serializers.CharField(source='student_profile.student_contact', required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'fullname', 'email', 'phone', 'DOB', 'gender', 'profile_picture',
            'admission_number', 'admission_date', 'blood_group', 'section',
            'guardian_name', 'guardian_number', 'roll_number', 'student_contact'
        ]
        extra_kwargs = {'email': {'read_only': True}}

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('student_profile', {})
        
        # Update User
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update StudentProfile
        profile = instance.student_profile
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()
        
        return instance
    
class ParentProfileSerializers(serializers.ModelSerializer):
    contact_number = serializers.CharField(source='parent_profile.contact_number')
    whatsapp_number = serializers.CharField(source='parent_profile.whatsapp_number')
    occupation = serializers.CharField(source='parent_profile.occupation')
    
    # We add this to show the linked children
    relations = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'fullname', 'phone', 'gender', 'DOB', 'email', 'profile_picture',
            'contact_number', 'whatsapp_number', 'occupation', 'relations'
        ]
        # This makes email read-only so it cannot be edited
        extra_kwargs = {'email': {'read_only': True}}

    def get_relations(self, obj):
        # Accessing the ParentProfile linked to the User
        profile = getattr(obj, 'parent_profile', None)
        if not profile:
            return []
        # Return a simple list of children and the relation
        return [
            {
                "student_name": rel.student.user.fullname,
                "relation_type": rel.relation_type,
                "is_primary": rel.is_primary
            } for rel in profile.relations.all()
        ]

    def update(self, instance, validated_data):
        
        profile_data = validated_data.pop('parent_profile', {})
    
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        profile = instance.parent_profile 
    
        for attr, value in profile_data.items():
            setattr(profile, attr, value) # Added 'profile' here
        profile.save()
    
        return instance
    




class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    def validate_email(self,value):
        try:
            user = User.objects.get(email__iexact=value)
        except User.DoesNotExist:
            pass 
        return value.lower()
    def save(self):
        email = self.validated_data['email']
        try:
            user = User.objects.get(email__iexact=email)
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            subject = "Password Reset Request - CampuSync"
            message = f"""
                      Hello {user.fullname},

                     You requested to reset your password for your CampuSync account.

                     Click the link below to reset your password:
                     {reset_link}

                     This link will expire in 24 hours.

                     If you didn't request this, please ignore this email.

                     Best regards,
                     CampuSync Team
                                 """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            return True
        except User.DoesNotExist:
            return True
        except Exception as e:
            print(f"Error sending password reset email: {e}")
            return False
        


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8,write_only=True)
    confirm_password = serializers.CharField(min_length=8,write_only=True)

    def validate(self, attrs):
        if attrs['new_password']!=attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password':'password do not match   '
            })
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=uid)
        except(TypeError,ValueError,OverflowError,User.DoesNotExist):
            raise serializers.ValidationError({
                'token':'invalid reset Link'
            })
        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError({
                "token": "Reset link has expired or is invalid"
            })
        
        attrs['user'] = user
        return attrs
    def save(self):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user  


    

            