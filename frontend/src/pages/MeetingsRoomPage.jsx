// pages/MeetingRoomPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Loader, PhoneOff } from "lucide-react";

export default function MeetingRoomPage() {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const [meetingData, setMeetingData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`meetings/join/${roomName}/`)
      .then(res => setMeetingData(res.data))
      .catch(err => {
        if (err.response?.status === 403) setError("You are not invited to this meeting.");
        else setError("Meeting not found.");
      });
  }, [roomName]);

  if (error) return (
    <div className="h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center text-white space-y-4">
        <p className="text-xl font-bold">{error}</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-red-600 rounded-2xl font-bold"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  if (!meetingData) return (
    <div className="h-screen flex items-center justify-center bg-slate-900">
      <Loader className="animate-spin text-white" size={40} />
    </div>
  );

  const jitsiUrl = `${meetingData.jitsi_url}#userInfo.displayName="${encodeURIComponent(meetingData.display_name)}"&config.prejoinPageEnabled=false`;

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700">
        <div>
          <h1 className="text-white font-black text-lg">{meetingData.title}</h1>
          <p className="text-slate-400 text-xs">
            {meetingData.is_host ? "You are the host" : "Participant"}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all"
        >
          <PhoneOff size={16} /> Leave
        </button>
      </div>

      {/* Jitsi iframe */}
      <iframe
        src={jitsiUrl}
        className="flex-1 w-full"
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        style={{ border: 'none' }}
      />
    </div>
  );
}