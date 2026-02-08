// src/pages/UnauthorizedPage.jsx
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12 text-slate-900">
      <div className="w-full max-w-md text-center">
        {/* Icon with Glowing Effect */}
        <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-red-100 opacity-75"></div>
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-600 shadow-sm border border-red-100">
            <ShieldAlert size={40} />
          </div>
        </div>

        {/* Text Content */}
        <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Access Denied
        </h1>
        <p className="mb-10 text-slate-500 font-medium leading-relaxed">
          Oops! It looks like you don't have the necessary permissions to view this section of <span className="text-indigo-600 font-bold">CampuSync</span>.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        
         
        </div>

        {/* Bottom Support Text */}
        <p className="mt-12 text-xs font-bold uppercase tracking-widest text-slate-400">
          Error Code: 403 Forbidden
        </p>
      </div>
    </div>
  );
}