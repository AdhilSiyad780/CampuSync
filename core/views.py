from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializer import SuperAdminLoginSerializer
from rest_framework.permissions import AllowAny


class SuperAdminLoginView(APIView):
    permission_classes = [AllowAny] 
    def post(self,request):
        serializers = SuperAdminLoginSerializer(data=request.data)
        serializers.is_valid(raise_exception=True)
        return Response(serializers.validated_data,status=status.HTTP_200_OK)