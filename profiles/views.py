from rest_framework.response import Response
from rest_framework.views import APIView   
from rest_framework.permissions import IsAuthenticated
from .serializers import AdminProfileSerializers,SchoolProfileSerializers,StudentProfileSerializers,ParentProfileSerializers

class AdminProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        if request.user.user_type!='admin':
            return Response({'detail':'forbidden'},status=403)
        serilazer = AdminProfileSerializers(request.user,partial=True)
        return Response(serilazer.data)
    def put(self,request):
        if request.user.user_type!='admin':
            return Response({'detail':'forbidden'},status=403)
        serializer = AdminProfileSerializers(request.user,
                                             data = request.data,
                                             partial = True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
class SchoolProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        if request.user.user_type!='admin':
            return Response({'detail':'forbidden'},status=403)
        serilazer = SchoolProfileSerializers(request.user.tenant)
        return Response(serilazer.data)
    def put(self,request):
        if request.user.user_type!='admin':
            return Response({'detail':'forbidden'},status=403)
        serializer = SchoolProfileSerializers(request.user.tenant,
                                             data = request.data,
                                             partial = True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)



class StudentProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        if request.user.user_type!='student':
            return Response({'detail':'forbidden'},status=403)
        serializer = StudentProfileSerializers(request.user,partial = True)
        return Response(serializer.data)
    def put(self,request):
        if request.user.user_type!='student':
            return Response({'detail':'forbidden'},status=403)
        serializer = StudentProfileSerializers(request.user,
                                             data = request.data,
                                             partial = True)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors,status=400)
    

class ParentProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        if request.user.user_type!='parent':
            return Response({'detail':'forbidden'},status=403)
        serializer = ParentProfileSerializers(request.user,partial = True)
        return Response(serializer.data)
    def put(self,request):
        if request.user.user_type!='parent':
            return Response({'detail':'forbidden'},status=403)
        serializer = ParentProfileSerializers(request.user,
                                             data = request.data,
                                             partial = True)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors,status=400)

