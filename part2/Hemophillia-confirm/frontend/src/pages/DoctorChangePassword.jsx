import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../apiClient";

const DoctorChangePassword = () => {
  const navigate = useNavigate();

  const storedUser =
    JSON.parse(
      localStorage.getItem("staffUser") || "null"
    );

  const [professionalId, setProfessionalId] = useState(
    localStorage.getItem("professionalId") ||
      storedUser?.professionalId ||
      ""
  );

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // ===================================================
    // VALIDATION
    // ===================================================

    if (
      !professionalId.trim() ||
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setError(
        "Please fill in all password fields."
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "New password and confirm password do not match."
      );
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError(
        "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character."
      );
      return;
    }

    if (
      newPassword ===
      currentPassword
    ) {
      setError(
        "New password must be different from your current password."
      );
      return;
    }

    if (
      newPassword === "123456"
    ) {
      setError(
        "You cannot use the temporary password as your new password."
      );
      return;
    }

    setLoading(true);

    // ===================================================
    // CHANGE PASSWORD
    // ===================================================

    try {

      const res =
        await api.post(
          "/doctor/change-password",
          {
            professionalId:
              professionalId.trim(),

            currentPassword,

            newPassword,
          }
        );

      const token =
        res.data.token;

      const updatedUser =
        res.data.user;

      // =================================================
      // SAVE NEW STAFF TOKEN
      // =================================================

      localStorage.setItem(
        "staffAuthToken",
        token
      );

      // =================================================
      // UPDATE API AUTHORIZATION
      // =================================================

      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      // =================================================
      // UPDATE STAFF USER
      // =================================================

      if (updatedUser) {

        localStorage.setItem(
          "staffUser",
          JSON.stringify(
            updatedUser
          )
        );
      } else if (storedUser) {

        localStorage.setItem(
          "staffUser",
          JSON.stringify({
            ...storedUser,
            mustChangePassword:
              false,
          })
        );
      }

      // =================================================
      // UPDATE PASSWORD FLAG
      // =================================================

      localStorage.setItem(
        "mustChangePassword",
        "false"
      );

      // =================================================
      // REMOVE TEMPORARY PROFESSIONAL ID STORAGE
      // =================================================

      localStorage.removeItem(
        "professionalId"
      );

      // =================================================
      // SUCCESS
      // =================================================

      setSuccess(
        "Password changed successfully. Redirecting to your dashboard..."
      );

      // =================================================
      // GO TO DASHBOARD
      // =================================================

      setTimeout(() => {

        navigate(
          "/doctor-dashboard",
          {
            replace: true,
          }
        );

      }, 1000);

    } catch (err) {

      console.error(
        "Doctor change password error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to change password."
      );

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="change-page">

      <div className="change-card">

        <h1>
          Change Password
        </h1>

        <p className="subtitle">
          For security, you must change your temporary password
          before accessing the clinical dashboard.
        </p>

        <form
          onSubmit={handleSubmit}
        >

          <input
            type="text"
            placeholder="Doctor / Clinician ID"
            value={professionalId}
            onChange={(e) =>
              setProfessionalId(
                e.target.value
              )
            }
            required
          />

          <div style={{position:"relative"}}>
            <input
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) =>
                setCurrentPassword(
                  e.target.value
                )
              }
              required
            />
            <button type="button" className="toggle-pw" onClick={() => setShowCurrentPassword(v => !v)}>
              {showCurrentPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div style={{position:"relative"}}>
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(
                  e.target.value
                )
              }
              required
            />
            <button type="button" className="toggle-pw" onClick={() => setShowNewPassword(v => !v)}>
              {showNewPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div style={{position:"relative"}}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              required
            />
            <button type="button" className="toggle-pw" onClick={() => setShowConfirmPassword(v => !v)}>
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {success && (
            <div className="success">
              {success}
            </div>
          )}

          <button
            className="main-btn"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Changing Password..."
              : "Change Password"}
          </button>

        </form>

      </div>

      <style>{`

        .change-page {
          min-height: 100vh;
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          background-image:
            url('/images/login-bg.png');

          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .change-card {
          width: 500px;
          max-width: 90%;

          padding: 50px;

          background:
            rgba(255,255,255,0.97);

          border-radius: 24px;

          box-shadow:
            0 40px 100px
            rgba(0,0,0,0.18);
        }

        .change-card h1 {
          text-align: center;

          color: #163b63;

          font-size: 30px;

          margin-bottom: 10px;
        }

        .subtitle {
          text-align: center;

          color: #6c8aa8;

          font-size: 14px;

          line-height: 1.6;

          margin-bottom: 30px;
        }

        .change-card input {
          width: 100%;

          box-sizing: border-box;

          padding: 14px 16px;

          margin-bottom: 16px;

          border-radius: 8px;

          border:
            1px solid #d8e3f2;

          background:
            #f9fbff;

          font-size: 15px;

          outline: none;
        }

        .change-card input:focus {
          border-color:
            #4a7dfc;

          background:
            white;
        }

        .main-btn {
          width: 100%;

          padding: 14px;

          margin-top: 8px;

          border: none;

          border-radius: 8px;

          background:
            linear-gradient(
              90deg,
              #4a7dfc,
              #5f8dff
            );

          color: white;

          font-size: 16px;

          cursor: pointer;
        }

        .main-btn:disabled {
          opacity: 0.7;

          cursor: not-allowed;
        }

        .error {
          padding: 10px;

          margin-bottom: 12px;

          border-radius: 8px;

          color: #d93025;

          background:
            #fff1f1;

          border:
            1px solid #ffd1d1;

          text-align: center;

          font-size: 13px;
        }

        .success {
          padding: 10px;

          margin-bottom: 12px;

          border-radius: 8px;

          color: #188038;

          background:
            #effaf1;

          border:
            1px solid #c8e6cc;

          text-align: center;

          font-size: 13px;
        }

        .toggle-pw {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-70%);
          background: none;
          border: none;
          color: #4a7dfc;
          cursor: pointer;
          font-size: 13px;
          padding: 0;
        }

        @media (max-width: 600px) {

          .change-card {
            padding:
              30px 22px;
          }

        }

      `}</style>

    </div>
  );
};

export default DoctorChangePassword;