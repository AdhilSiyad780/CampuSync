# meetings/serializers.py
from rest_framework import serializers
from .models import Meeting
from django.contrib.auth import get_user_model

User = get_user_model()

class MeetingSerializer(serializers.ModelSerializer):
    host_name = serializers.CharField(source='host.fullname', read_only=True)
    participant_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(), 
        source='participants',
        write_only=True,
        required=False
    )
    participant_count = serializers.SerializerMethodField()
    jitsi_url = serializers.SerializerMethodField()

    class Meta:
        model = Meeting
        fields = [
            'id', 'title', 'room_name', 'host_name',
            'participant_ids', 'participant_count',
            'scheduled_at', 'status', 'jitsi_url', 'created_at'
        ]
        read_only_fields = ['id', 'room_name', 'created_at', 'host_name']

    def get_participant_count(self, obj):
        return obj.participants.count()

    def get_jitsi_url(self, obj):
        return f"https://meet.jit.si/campusync-{obj.room_name}"

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['tenant'] = request.user.tenant
        validated_data['host'] = request.user
        participants = validated_data.pop('participants', [])
        meeting = super().create(validated_data)
        print(participants,'======================')
        meeting.participants.set(participants)
        return meeting