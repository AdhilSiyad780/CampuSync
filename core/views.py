from datetime import timedelta
import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate

from subscription.models import Subscription, SubscriptionPlan
from .serializer import( SuperAdminLoginSerializer,AdminVerifyOTPSerializer,
                        AdminSignupCompleteLoginflow,SuperAdminProfileSerializer,
                        SuperAdminProfileUpdateSerializer,AdminSignupSendOTPSerializer,
                        AdminSignupComlpeteSignupflow,AdminLoginSerializer,
                        TenantWithPlanSerializer,StudentLoginSerializers,TeacherLoginSerializers,
                        ParentLoginSerializer)

from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
from .models import User, Tenant
from .serializer import GoogleAuthSerializer
from .permission import IsStudent

# core/views.py
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Tenant
from rest_framework import permissions

from  subscription.permissions import IsSuperAdminOrAdmin  # or a stricter IsSuperAdmin if you have it





class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        print(request.user.user_type, "======================================" ,request.user.email)
        return bool(request.user and request.user.is_authenticated and request.user.user_type == "superadmin")

class SuperAdminLoginView(APIView):
    permission_classes = [AllowAny] 
    def post(self,request):
        serializers = SuperAdminLoginSerializer(data=request.data)
        serializers.is_valid(raise_exception=True)
        user = authenticate(
            email=request.data.get("email"),
            password=request.data.get("password"),
        )
        refresh = RefreshToken.for_user(user)

        
        response =  Response(serializers.validated_data,status=status.HTTP_200_OK)
        response.set_cookie(
            key="access_token",
            value=str(refresh.access_token),
            httponly=True,
            samesite="Lax",
            secure=False,
            path="/",
            )

        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            samesite="Lax",
            secure=False,
            path="/",
        )
        return response
    
class SuperAdminProfileView(APIView):
    permission_classes = [IsAuthenticated,IsSuperUser]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        # USE PROFILE SERIALIZER HERE, NOT LOGIN SERIALIZER
        serializer = SuperAdminProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        # Use update serializer to validate + save
        serializer = SuperAdminProfileUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # After saving, return FULL updated profile
        profile_serializer = SuperAdminProfileSerializer(request.user)
        return Response(profile_serializer.data, status=status.HTTP_200_OK)



# -------------------------------AdminSignup--------------------------------------------------------------------


class AdminSignupSendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AdminSignupSendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.create(serializer.validated_data)
        return Response(
            {"detail": "OTP sent to email if it is valid."},
            status=status.HTTP_200_OK,
        )
  
class AdminSignupView(APIView):
    permission_classes = [AllowAny]  # keep AllowAny to support OTP path

    def post(self, request):
        # OTP-driven path (frontend sends signup_token)
       
        serializer = AdminSignupComlpeteSignupflow(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        tenant = user.tenant
        data = {
                
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "fullname": user.fullname,
                    "user_type": user.user_type,
                    "is_setup_complete": user.is_setup_complete,
                },
                "tenant": {
                    "id": tenant.id,
                    "tenant_id": tenant.tenant_id,
                    "instance_name": tenant.instance_name,
                    "email": tenant.email,
                    "phone": tenant.phone,
                    "address": tenant.address,
                    "status": tenant.status,
                } if tenant else None,
            }
        response =  Response(data,status=status.HTTP_200_OK)

        response.set_cookie(
            key="access_token",
            value=str(refresh.access_token),
            httponly=True,
            samesite="Lax",
            secure=False,
            path="/",

            )

        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            samesite="Lax",
            secure=False,
            path="/",
        )
        return response

        

class AdminVerifyOTPView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = AdminVerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(
            {"detail": "OTP verified and account created.", **data},
            status=status.HTTP_201_CREATED,
        )


from django.utils import timezone

class AdminSignupSendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AdminSignupSendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        otp_obj = serializer.save()  # <-- use save(), get otp_obj

        # how many seconds until expiry
        expires_in = 0
        if getattr(otp_obj, "expires_at", None):
            expires_in = max(
                int((otp_obj.expires_at - timezone.now()).total_seconds()),
                0
            )
        else:
            # fallback if you somehow don't set expires_at; assume 5 mins
            expires_in = 5 * 60

        return Response(
            {
                "detail": "OTP sent to email if it is valid.",
                "expires_in": expires_in,
            },
            status=status.HTTP_200_OK,
        )


# --------------------------------------Google Auth----------------------------------------------------



class GoogleAuthView(APIView):
    authentication_classes = []  # public
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        credential = serializer.validated_data["credential"]

        try:
            # Verify token with Google
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )

            # Basic checks
            if idinfo.get("iss") not in [
                "accounts.google.com",
                "https://accounts.google.com",
            ]:
                return Response({"detail": "Invalid issuer."}, status=status.HTTP_400_BAD_REQUEST)

            email = idinfo.get("email")
            fullname = idinfo.get("name", "")
            picture = idinfo.get("picture", "")

            if not email:
                return Response({"detail": "Email not available from Google."},
                                status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            # Don't leak internal errors to client
            print(e)
            return Response({"detail": "Invalid Google token."}, status=status.HTTP_400_BAD_REQUEST)

        # Find or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "fullname": fullname,
                "user_type": "admin",      # you can change this
                "status": "active",
                "is_staff": True,
                "profile_picture": picture,
            },
        )

        # If created and you want to auto-create a Tenant, you can do it here.
        # For now, we won't, to avoid over-complicating:
        tenant = Tenant.objects.create(
            tenant_id=str(uuid.uuid4()),
            instance_name="",
            email=email,
            phone="",
            address="",
            status="trial",
        )

        # 3️⃣ Attach trial subscription
        trial_plan = SubscriptionPlan.objects.filter(
            plan_name__iexact="Trial", is_active=True
        ).first()

        if not trial_plan:
            trial_plan = SubscriptionPlan.objects.create(
                plan_name="Trial",
                description="Default trial plan",
                duration_days=7,
                price=0,
                max_students=None,
                max_teachers=None,
                max_admins=1,
                features=["Basic features"],
                is_active=True,
            )

        now = timezone.now()
        Subscription.objects.create(
            tenant=tenant,
            plan=trial_plan,
            start_date=now,
            expiry_date=now + timedelta(days=trial_plan.duration_days),
            status="trial",
            is_active=True,
        )

        # 4️⃣ Link user ↔ tenant
        user.tenant = tenant
        user.is_setup_complete = False
        user.save(update_fields=["tenant", "is_setup_complete"])

        # Issue JWT
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        data = {
            
            "user": {
                "id": user.id,
                "email": user.email,
                "fullname": user.fullname,
                "user_type": user.user_type,
            },
            "tenant": {
                "id": tenant.id,
                "tenant_id": tenant.tenant_id,
                "instance_name": tenant.instance_name,
                "email": tenant.email,
                "phone": tenant.phone,
                "address": tenant.address,
                "status": tenant.status,
            } if tenant else None,
        }

        response =  Response(data,status=status.HTTP_200_OK)

        response.set_cookie(
            key="access_token",
            value=str(refresh.access_token),
            httponly=True,
            samesite="Lax",
            secure=False,
            path="/",
            )

        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            samesite="Lax",
            secure=False,
            path="/",
        )
        return response
    

class AdminLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []


    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            email=request.data.get("email"),
            password=request.data.get("password"),
        )
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        response =  Response(serializer.validated_data,status=status.HTTP_200_OK)
        response.set_cookie(
            key="access_token",
            value=str(refresh.access_token),
            httponly=True,
            samesite="Lax",
            secure=False,
            path="/",
            )

        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            samesite="Lax",
            secure=False,
            path="/",
        )
        return response

    


# ===========================================student Login =======================================
class StudentLoginView(APIView):
    permission_classes = [AllowAny]
    def post(self,request):
        serializer = StudentLoginSerializers(
            data=request.data,context={'request':request}
        )
        serializer.is_valid(raise_exception=True)


        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
      
        student_profile = getattr(user,'studentprofile',None)
        profile_data = {}
        if  student_profile:
            profile_data = {
                "id": student_profile.id,
                "admission_number": getattr(student_profile, "admission_number", None),
                "class_id": getattr(student_profile, "class_id", None),
                "section": getattr(student_profile, "section", ""),
                "roll_number": getattr(student_profile, "roll_number", None),
            }
        data  = {
            'authenticated': True,
         
            'user':{
                'id':user.id,
                'fullname':user.fullname,
                'email':user.email,
                'user_type':user.user_type
            },
            'profile_data':profile_data
        }
        response  =  Response(data,status=status.HTTP_200_OK)
        response.set_cookie(
            key="access_token",
            value=str(refresh.access_token),
            httponly=True,
            samesite="Lax",
            secure=False,
            path="/",
            )

        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            samesite="Lax",
            secure=False,
            path="/",
        )
        return response









# ===========================================student Login =======================================
class TeacherLoginView(APIView):
    permission_classes = [AllowAny]
    def post(self,request):
        serializer = TeacherLoginSerializers(
            data=request.data,context={'request':request}
        )
        serializer.is_valid(raise_exception=True)


        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        student_profile = getattr(user,'studentprofile',None)
        profile_data = {}
        if  student_profile:
            profile_data = {
                "id": student_profile.id,
                "admission_number": getattr(student_profile, "admission_number", None),
                "class_id": getattr(student_profile, "class_id", None),
                "section": getattr(student_profile, "section", ""),
                "roll_number": getattr(student_profile, "roll_number", None),
            }
        data  = {
            'authenticated': True,
            'user':{
                'id':user.id,
                'fullname':user.fullname,
                'email':user.email,
                'user_type':user.user_type
            },
            'profile_data':profile_data
        }
        response =  Response(data,status=status.HTTP_200_OK)

        response.set_cookie(
            key="access_token",
            value=str(refresh.access_token),
            httponly=True,
            samesite="Lax",
            secure=False,
            path="/",
            )

        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            samesite="Lax",
            secure=False,
            path="/",
        )
        return response



    # ==============================tenent list in superadmin ========================

class TenantListForSuperadminView(generics.ListAPIView):
    """
    List all tenants with their current subscription plan.
    Intended for superadmin dashboard.
    """
    queryset = Tenant.objects.all().order_by("-created_at")
    serializer_class = TenantWithPlanSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrAdmin]  # tighten if needed

class ToggleTenantBlockView(APIView):
    # Ensure only SuperAdmins can hit this
    permission_classes = [IsAuthenticated] 

    def post(self, request, pk):
        try:
            tenant = Tenant.objects.get(pk=pk)
            
            # If the tenant is currently suspended, unblock them (set to active)
            # Otherwise, block them (set to suspended)
            if tenant.status == "suspended":
                tenant.status = "active"
                message = "Tenant has been unblocked."
            else:
                tenant.status = "suspended"
                message = "Tenant has been blocked."
            
            tenant.save()
            return Response({"message": message, "new_status": tenant.status}, status=status.HTTP_200_OK)
        except Tenant.DoesNotExist:
            return Response({"error": "Tenant not found."}, status=status.HTTP_404_NOT_FOUND)


class ParentLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ParentLoginSerializer(data=request.data, context={"request": request})
        # IMPORTANT: correct method name -> raise_exception (not raise_exeption)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        # Optionally include a small profile payload for frontend convenience
        parent_profile = getattr(user, "parentprofile", None)
        profile_data = None
        if parent_profile:
            profile_data = {
                "id": parent_profile.id,
                "contact_number": getattr(parent_profile, "contact_number", None),
            }

        data = {
           
            "user": {
                "id": user.id,
                "fullname": getattr(user, "fullname", ""),
                "email": user.email,
                "user_type": user.user_type,
            },
            "profile": profile_data,
        }
        response =  Response(data, status=status.HTTP_200_OK)
        response.set_cookie(
            key="access_token",
            value=str(refresh.access_token),
            httponly=True,
            samesite="Lax",
            secure=False,
            path="/",
          
            )

        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            samesite="Lax",
            secure=False,
            path="/",
          
        )
        return response
    
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        
        # Mirroring your Login setup exactly to ensure the browser finds the cookies
        # cookie_params = {
        #     "path": "/",
        #     "httponly": True,
        #     "samesite": "Lax",
        #     "secure": False, # Switch to True in production with HTTPS
        # }

        response.delete_cookie(
            "access_token",
            path="/",
            samesite="Lax",
        )

        response.delete_cookie(
            "refresh_token",
            path="/",
            samesite="Lax",
        )

        
        return response
    


# core/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def check_auth(request):
    print(f"Session ID in cookie: {request.COOKIES.get('sessionid', 'NONE')}")
    print(f"User authenticated: {request.user.is_authenticated}")
    print(f"User: {request.user}")
    """Check if user is authenticated and return user data safely"""
    if request.user.is_authenticated:
        user = request.user
        return Response({
            'authenticated': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'fullname': getattr(user, 'fullname', user.username),
                'user_type': getattr(user, 'user_type', None),
            }
        }, status=200)
    
    # This is the important part: return a clean response for guests
    return Response({
        'authenticated': False,
        'user': None
    }, status=200)