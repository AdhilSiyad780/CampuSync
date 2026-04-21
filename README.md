CampuSync 🎓
A modern, multi-tenant School Management Platform built for students, teachers, parents, and administrators — with real-time features, AI assistance, and video meetings.
🌐 Live: campusync.online

Features
👥 Multi-Role System

Superadmin — manages tenants and subscriptions
Admin — manages school, staff, and students
Teacher — manages classes, attendance, assignments, and exams
Student — views timetable, assignments, results, and communicates with teachers
Parent — monitors their child's attendance, performance, and communicates with teachers

📋 Core Modules

Attendance — daily session-based attendance with summaries and parent visibility
Class Management — timetable, class groups, and subject assignments
Assignments & Exams — creation, submission, and result tracking
Announcements — real-time school-wide and class-level announcements via WebSockets
Chat — teacher-to-student and teacher-to-parent messaging
Video Meetings — Jitsi-based meetings with role-based participant validation
Finance — fee management and payment tracking
Subscription — tenant-level subscription and plan management

🤖 StudyBuddy
An AI-powered student assistant built into the platform, helping students with questions and study support using Groq's llama-3.3-70b-versatile model.
🔔 Real-Time
WebSocket-based live announcements and notifications powered by Django Channels and Redis.

Tech Stack
Backend
TechnologyPurposeDjango 6 + DRFREST APIDjango ChannelsWebSockets / ASGIDaphneASGI ServerPostgreSQLPrimary DatabaseRedisChannel Layer / CachingGroq APIAI Assistant (StudyBuddy)
Frontend
TechnologyPurposeReact + ViteUI FrameworkTailwind CSSStylingAxiosHTTP ClientLucide ReactIcons
Infrastructure
TechnologyPurposeAWS EC2Server HostingNginxReverse Proxy + Static FilesLet's EncryptSSL/HTTPSHostinger DNSDomain ManagementGitHubVersion Control

Architecture
Browser
   ↓
campusync.online (Hostinger DNS → EC2)
   ↓
Nginx (reverse proxy, static files, SSL)
   ↓
Daphne (ASGI server)
   ↓
Django + Channels
   ↓
PostgreSQL + Redis

Local Development Setup
Prerequisites

Python 3.12+
Node.js 18+
PostgreSQL
Redis

Backend
bash# Clone the repo
git clone https://github.com/your-username/campusync.git
cd campusync

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirement.txt

# Create .env file
cp .env.example .env
# Fill in your environment variables

# Run migrations
python manage.py migrate

# Start server
python -m daphne -p 8000 config.asgi:application
Frontend
bashcd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_BACKEND_URL=http://localhost:8000" > .env

# Start dev server
npm run dev

Environment Variables
Create a .env file in the project root:
envDEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=campusync.online,www.campusync.online,localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/campusync

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Groq AI
GROQ_API_KEY=your-groq-api-key

Production Deployment
The project is deployed on AWS EC2 with the following stack:

Daphne runs as a systemd service
Nginx handles reverse proxy, static files, and SSL termination
Redis runs as a system service for Django Channels
Let's Encrypt provides free HTTPS via Certbot
React build is served directly by Nginx from frontend/dist/


Project Structure
CampuSync/
├── config/              # Django settings, URLs, ASGI
├── core/                # Base models, utilities
├── members/             # User accounts and roles
├── profiles/            # Student, Teacher, Parent profiles
├── attendence/          # Attendance sessions and records
├── assignment/          # Assignments and submissions
├── exams/               # Exams and results
├── class_announcement_attendence/  # Announcements + WebSockets
├── chat/                # Messaging system
├── meetings/            # Jitsi video meetings
├── finance/             # Fee management
├── subscription/        # Tenant subscriptions
├── assistant/           # StudyBuddy AI assistant
├── frontend/            # React + Vite frontend
└── requirement.txt