# meetings/views.py
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Meeting
from .serializers import MeetingSerializer
from django.db.models import Q

class MeetingListCreateView(generics.ListCreateAPIView):
    serializer_class = MeetingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return  Meeting.objects.filter(
            tenant=user.tenant
        ).filter(
            Q(host=user) | Q(participants=user)  # ✅ host OR participant
        ).distinct().order_by('-scheduled_at')


class MeetingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MeetingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Meeting.objects.filter(tenant=self.request.user.tenant)


class JoinMeetingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_name):
        try:
            meeting = Meeting.objects.get(
                room_name=room_name,
                tenant=request.user.tenant
            )
        except Meeting.DoesNotExist:
            return Response({'error': 'Meeting not found'}, status=404)

        user = request.user

        # Check if user is host or participant
        is_host = meeting.host == user
        is_participant = meeting.participants.filter(id=user.id).exists()

        if not is_host and not is_participant:
            return Response({'error': 'You are not invited to this meeting'}, status=403)

        return Response({
            'title': meeting.title,
            'room_name': meeting.room_name,
            'jitsi_url': f'https://meet.jit.si/campusync-{meeting.room_name}',
            'display_name': user.fullname,
            'is_host': is_host,
        })


class EndMeetingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            meeting = Meeting.objects.get(pk=pk, tenant=request.user.tenant)
        except Meeting.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if meeting.host != request.user:
            return Response({'error': 'Only the host can end the meeting'}, status=403)

        meeting.status = 'ended'
        meeting.save()
        return Response({'message': 'Meeting ended'})