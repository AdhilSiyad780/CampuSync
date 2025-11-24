import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function SuperAdminProfile() {
  const [profile, setProfile] = useState(null);
  const [fullname, setFullname] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.get("superadmin/profile/");
      console.log("PROFILE DATA:", res.data); // <-- see what profile_picture looks like
      setProfile(res.data);
      setFullname(res.data.fullname || "");
    } catch (err) {
      console.error("LOAD PROFILE ERROR:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        localStorage.removeItem("access");
        navigate("/");
        return;
      }
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setProfilePic(file);
    setSuccess("");
    setError("");

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url); // <-- immediate preview
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullname.trim()) {
      setError("Full name cannot be empty.");
      return;
    }

    const form = new FormData();
    form.append("fullname", fullname.trim());
    if (profilePic) {
      form.append("profile_picture", profilePic);
    }

    setSaving(true);
    try {
      const res = await api.patch("superadmin/profile/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("UPDATE RESPONSE:", res.data);
      setProfile(res.data);
      setSuccess("Profile updated successfully.");

      // DO NOT reset previewUrl here → keep showing new image
      setProfilePic(null);
    } catch (err) {
      console.error("UPDATE PROFILE ERROR:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        localStorage.removeItem("access");
        navigate("/");
        return;
      }

      const data = err.response?.data;
      if (data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
        setError(String(msg || "Failed to update profile."));
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return <p style={{ padding: "2rem" }}>Loading profile...</p>;
  }

  if (!profile) {
    return <p style={{ padding: "2rem" }}>No profile data available.</p>;
  }

  // Decide which image to show:
  // 1) If user selected a file -> show previewUrl
  // 2) Else if backend has profile_picture -> show that
  //    NOTE: adjust depending on whether backend sends full URL or relative path
  let backendImageSrc = null;
  if (profile.profile_picture) {
    // CASE 1: backend returns relative path (e.g. "/media/avatars/a.jpg")
    if (profile.profile_picture.startsWith("/")) {
      backendImageSrc = `http://127.0.0.1:8000${profile.profile_picture}`;
    } else {
      // CASE 2: backend already returns full URL (e.g. "http://127.0.0.1:8000/media/a.jpg")
      backendImageSrc = profile.profile_picture;
    }
  }

  const currentImageSrc = previewUrl || backendImageSrc;

  return (
    <div style={{ padding: "2rem", maxWidth: "480px" }}>
      <h2>Super Admin Profile</h2>

      {error && (
        <p style={{ color: "red", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
          {error}
        </p>
      )}
      {success && (
        <p style={{ color: "green", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
          {success}
        </p>
      )}

      <form onSubmit={handleUpdate} style={{ marginTop: "1rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.25rem" }}>
            Full Name
          </label>
          <input
            type="text"
            value={fullname}
            onChange={(e) => {
              setFullname(e.target.value);
              setSuccess("");
            }}
            style={{
              width: "100%",
              padding: "0.5rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.25rem" }}>
            Email
          </label>
          <p style={{ margin: 0, fontWeight: "bold" }}>{profile.email}</p>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.25rem" }}>
            Profile Picture
          </label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <small style={{ display: "block", marginTop: "0.25rem", color: "#555" }}>
            Choose a new image to update your profile picture.
          </small>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "0.5rem 1rem",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      <h3 style={{ marginTop: "2rem" }}>Preview</h3>

      {currentImageSrc ? (
        <img
          src={currentImageSrc}
          alt="Profile"
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            marginTop: "1rem",
            objectFit: "cover",
          }}
        />
      ) : (
        <p style={{ marginTop: "1rem" }}>No profile picture uploaded</p>
      )}

      <p style={{ marginTop: "1rem" }}>
        Last Login: {profile.last_login || "No login record"}
      </p>
      <div className="p-4 bg-slate-800 text-white">
  Tailwind is working
      </div>

    </div>
  );
}
