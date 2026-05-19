import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.conf import settings

logger = logging.getLogger(__name__)


class StudentAIAssistantView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.user_type != 'student':
            return Response(
                {"error": "Only students can access the AI assistant"},
                status=status.HTTP_403_FORBIDDEN
            )

        messages = request.data.get('messages', [])
        if not messages:
            return Response({"error": "No messages provided"}, status=status.HTTP_400_BAD_REQUEST)

        for msg in messages:
            if msg.get('role') not in ['user', 'assistant']:
                return Response({"error": "Invalid message role"}, status=status.HTTP_400_BAD_REQUEST)
            if not msg.get('content', '').strip():
                return Response({"error": "Message content cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)

        student_name = request.user.fullname
        try:
            class_name = request.user.student_profile.school_class.class_name
            division = request.user.student_profile.school_class.division
            class_info = f"Class {class_name} - {division}"
        except Exception as e:
            logger.warning(f"Could not get class info: {e}")
            class_info = "School"

        system_prompt = f"""You are StudyBuddy, a friendly and encouraging AI learning assistant for {student_name}, a student in {class_info}.

Your role is to:
- Help students understand concepts across all school subjects (Math, Science, English, History, Geography, etc.)
- Answer academic questions clearly and at an age-appropriate level
- Break down complex problems into simple steps
- Encourage curiosity and a love for learning
- Provide hints and guide students to think rather than just giving direct answers when appropriate
- Help with homework explanations (but guide, don't do it for them)
- Explain topics in multiple ways if the student doesn't understand
- Use examples, analogies, and relatable scenarios to explain concepts

Important rules:
- Stay focused on educational topics
- Be warm, patient, and encouraging
- If asked about inappropriate or non-educational topics, politely redirect to studies
- Keep responses concise and easy to read — use bullet points and numbered steps where helpful
- Always verify understanding by asking if the explanation was clear

You are NOT a replacement for teachers. Encourage students to also ask their teachers for help."""

        # ── Check API key is configured ───────────────────────
        api_key = getattr(settings, 'GROQ_API_KEY', None)
        if not api_key:
            logger.error("GROQ_API_KEY is not set in settings/env")
            return Response(
                {"error": "AI service not configured. Please contact admin."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            from groq import Groq

            client = Groq(api_key=api_key)

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    *messages
                ],
                max_tokens=1024,
            )

            reply = response.choices[0].message.content
            logger.info(f"AI response generated for student {request.user.id}")
            return Response({"reply": reply})

        except ImportError:
            logger.error("groq package not installed. Run: pip install groq")
            return Response(
                {"error": "AI service not available. Please contact admin."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            # Log the FULL error so you can see it in the terminal
            logger.error(f"Groq API error: {type(e).__name__}: {e}", exc_info=True)

            error_msg = str(e)
            if "429" in error_msg or "rate" in error_msg.lower():
                return Response(
                    {"error": "AI service is busy. Please try again in a moment."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            if "401" in error_msg or "api key" in error_msg.lower() or "invalid" in error_msg.lower():
                return Response(
                    {"error": "Invalid API key. Please contact admin."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            if "model" in error_msg.lower():
                return Response(
                    {"error": "AI model not available. Please contact admin."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            return Response(
                {"error": f"AI error: {str(e)}"},   # show raw error during development
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )