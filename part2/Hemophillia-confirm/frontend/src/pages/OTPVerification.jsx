

import React, {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import api from "../apiClient";

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [otp, setOtp] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [resendLoading, setResendLoading] =
    useState(false);

  const [secondsLeft, setSecondsLeft] =
    useState(300);

  // =====================================================
  // READ LOGIN INFORMATION
  // =====================================================

  const loginData =
    location.state || {};

  const challengeId =
    loginData.challengeId ||
    sessionStorage.getItem(
      "otpChallengeId"
    );

  const role =
    loginData.role ||
    sessionStorage.getItem(
      "otpRole"
    );

  const maskedEmail =
    loginData.maskedEmail ||
    sessionStorage.getItem(
      "otpMaskedEmail"
    );

  const pendingUser =
    loginData.user ||
    JSON.parse(
      sessionStorage.getItem(
        "otpUser"
      ) || "null"
    );

  // =====================================================
  // SAVE OTP STATE
  // =====================================================

  useEffect(() => {
    if (!challengeId) {
      navigate("/", {
        replace: true,
      });

      return;
    }

    sessionStorage.setItem(
      "otpChallengeId",
      challengeId
    );

    if (role) {
      sessionStorage.setItem(
        "otpRole",
        role
      );
    }

    if (maskedEmail) {
      sessionStorage.setItem(
        "otpMaskedEmail",
        maskedEmail
      );
    }

    if (pendingUser) {
      sessionStorage.setItem(
        "otpUser",
        JSON.stringify(
          pendingUser
        )
      );
    }
  }, [
    challengeId,
    role,
    maskedEmail,
    pendingUser,
    navigate,
  ]);

  // =====================================================
  // COUNTDOWN
  // =====================================================

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer =
      setInterval(() => {
        setSecondsLeft(
          (previous) =>
            Math.max(
              previous - 1,
              0
            )
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [secondsLeft]);

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = () => {
    const minutes =
      Math.floor(
        secondsLeft / 60
      );

    const seconds =
      secondsLeft % 60;

    return `${minutes}:${String(
      seconds
    ).padStart(2, "0")}`;
  };

  // =====================================================
  // OTP INPUT
  // =====================================================

  const handleOTPChange = (e) => {
    const value =
      e.target.value
        .replace(/\D/g, "")
        .slice(0, 6);

    setOtp(value);
    setError("");
  };

  // =====================================================
  // VERIFY OTP
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!otp) {
      setError(
        "Please enter the verification code."
      );

      return;
    }

    if (otp.length !== 6) {
      setError(
        "Please enter the complete 6-digit code."
      );

      return;
    }

    if (!challengeId) {
      setError(
        "Your verification session has expired. Please login again."
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await api.post(
          "/auth/verify-otp",
          {
            challengeId,
            otp,
          }
        );

      if (
        !response.data?.success ||
        !response.data?.token
      ) {
        throw new Error(
          response.data?.message ||
            "OTP verification failed."
        );
      }

      const token =
        response.data.token;

      const verifiedUser =
        response.data.user;

      const verifiedRole =
        response.data.role ||
        role;

      // =================================================
      // PATIENT
      // =================================================

      if (
        verifiedRole ===
        "patient"
      ) {
        localStorage.setItem(
          "authToken",
          token
        );

        if (verifiedUser) {
          localStorage.setItem(
            "user",
            JSON.stringify(
              verifiedUser
            )
          );
        }

        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${token}`;

        // =================================================
        // PATIENT ONBOARDING CHECK
        // =================================================
        // OTP verification proves the login is valid.
        // We must still check consent and patient profile completion.

        try {
          const profileResponse = await api.get(
            "/profile/patient-profile"
          );

          const profile =
            profileResponse.data || {};

          // A PatientProfile can already exist after consent is saved.
          // Therefore, profile existence alone does NOT mean onboarding
          // is complete.
          const consentCompleted =
            profile.consentDataCollection === true &&
            profile.consentAI === true &&
            profile.consentVideoMonitoring === true &&
            profile.privacyAccepted === true &&
            profile.termsAccepted === true &&
            !!profile.consentTimestamp;

          if (!consentCompleted) {
            clearOTPStorage();
            navigate("/consent", { replace: true });
            return;
          }

          // These are the core fields required by the patient-profile
          // backend validation.
          const profileCompleted =
            typeof profile.fullName === "string" &&
            profile.fullName.trim().length > 0 &&
            typeof profile.gender === "string" &&
            profile.gender.trim().length > 0 &&
            !!profile.dob &&
            typeof profile.bloodGroup === "string" &&
            profile.bloodGroup.trim().length > 0 &&
            typeof profile.mobile === "string" &&
            /^\d{10}$/.test(profile.mobile.trim()) &&
            typeof profile.state === "string" &&
            profile.state.trim().length > 0 &&
            typeof profile.city === "string" &&
            profile.city.trim().length > 0 &&
            typeof profile.pinCode === "string" &&
            /^\d{6}$/.test(profile.pinCode.trim()) &&
            typeof profile.emergencyName === "string" &&
            profile.emergencyName.trim().length > 0 &&
            typeof profile.emergencyRelationship === "string" &&
            profile.emergencyRelationship.trim().length > 0 &&
            typeof profile.emergencyPhone === "string" &&
            /^\d{10}$/.test(profile.emergencyPhone.trim());

          clearOTPStorage();

          if (!profileCompleted) {
            navigate("/register/profile", { replace: true });
            return;
          }

          // Consent + complete patient profile → Home
          navigate("/awareness", { replace: true });
          return;
        } catch (profileError) {
          // No PatientProfile yet → first-time patient → Consent.
          if (profileError.response?.status === 404) {
            clearOTPStorage();
            navigate("/consent", { replace: true });
            return;
          }

          console.error(
            "Patient onboarding status error:",
            profileError
          );

          setError(
            "Unable to check your patient profile. Please try again."
          );
          return;
        }
      }

      // =================================================
      // DOCTOR / CLINICIAN
      // =================================================

      if (
        verifiedRole ===
          "doctor" ||
        verifiedRole ===
          "clinician"
      ) {
        localStorage.setItem(
          "staffAuthToken",
          token
        );

        if (verifiedUser) {
          localStorage.setItem(
            "staffUser",
            JSON.stringify(
              verifiedUser
            )
          );
        }

        if (
          verifiedUser?.professionalId
        ) {
          localStorage.setItem(
            "professionalId",
            verifiedUser.professionalId
          );
        }

        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${token}`;

        clearOTPStorage();

        // =============================================
        // FIRST LOGIN
        // =============================================

        if (
          verifiedUser
            ?.mustChangePassword
        ) {
          navigate(
            "/doctor-change-password",
            {
              replace: true,
            }
          );

          return;
        }

        // =============================================
        // NORMAL LOGIN
        // =============================================

        navigate(
          "/doctor-dashboard",
          {
            replace: true,
          }
        );

        return;
      }

      // =================================================
      // ADMIN
      // =================================================

      if (
        verifiedRole === "admin"
      ) {
        localStorage.setItem(
          "adminToken",
          token
        );

        if (verifiedUser) {
          localStorage.setItem(
            "admin",
            JSON.stringify(
              verifiedUser
            )
          );
        }

        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${token}`;

        clearOTPStorage();

        // New administrators must change the temporary password
        // before accessing the dashboard.
        if (verifiedUser?.mustChangePassword) {
          navigate("/admin-change-password", { replace: true });
          return;
        }

        navigate("/admin/dashboard", { replace: true });

        return;
      }

      throw new Error(
        "Unknown login role."
      );
    } catch (err) {
      console.error(
        "OTP verification error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to verify the OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CLEAR OTP SESSION
  // =====================================================

  const clearOTPStorage = () => {
    sessionStorage.removeItem(
      "otpChallengeId"
    );

    sessionStorage.removeItem(
      "otpRole"
    );

    sessionStorage.removeItem(
      "otpMaskedEmail"
    );

    sessionStorage.removeItem(
      "otpUser"
    );
  };

  // =====================================================
  // CANCEL
  // =====================================================

  const handleBackToLogin = () => {
    clearOTPStorage();

    if (
      role === "doctor" ||
      role === "clinician"
    ) {
      navigate(
        "/doctor-login"
      );
      return;
    }

    if (role === "admin") {
      navigate(
        "/admin-login"
      );
      return;
    }

    navigate("/");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="otp-page">

      <div className="otp-card">

        <div className="otp-icon">
          ✉
        </div>

        <p className="otp-eyebrow">
          TWO-STEP VERIFICATION
        </p>

        <h1>
          Verify your login
        </h1>

        <p className="otp-description">
          We've sent a 6-digit verification
          code to your registered email address.
        </p>

        {maskedEmail && (
          <div className="otp-email">
            {maskedEmail}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="otp-form"
        >

          <label htmlFor="otp">
            Verification code
          </label>

          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={handleOTPChange}
            placeholder="000000"
            disabled={loading}
            autoFocus
          />

          {error && (
            <div className="otp-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              otp.length !== 6
            }
          >
            {loading
              ? "Verifying..."
              : "Verify & Continue"}
          </button>

        </form>

        <div className="otp-timer">
          Code expires in{" "}
          <strong>
            {formatTime()}
          </strong>
        </div>

        <button
          type="button"
          className="otp-back"
          onClick={
            handleBackToLogin
          }
          disabled={loading}
        >
          ← Back to login
        </button>

      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          margin: 0;
          min-height: 100%;
        }

        .otp-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 20px;

          background-image:
            linear-gradient(
              rgba(245, 248, 252, 0.88),
              rgba(245, 248, 252, 0.88)
            ),
            url("/images/login-bg.png");

          background-size: cover;
          background-position: center;

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .otp-card {
          width: 100%;
          max-width: 500px;

          background: rgba(
            255,
            255,
            255,
            0.97
          );

          border-radius: 28px;
          padding: 48px 45px;

          text-align: center;

          box-shadow:
            0 25px 70px
              rgba(20, 45, 80, 0.16);

          border:
            1px solid
            rgba(255, 255, 255, 0.9);
        }

        .otp-icon {
          width: 64px;
          height: 64px;

          margin: 0 auto 20px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #eaf0fe;
          color: #2c5ce0;

          font-size: 27px;
        }

        .otp-eyebrow {
          margin: 0 0 10px;

          color: #2c5ce0;

          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .otp-card h1 {
          margin: 0;

          color: #10233f;

          font-size: 30px;
          font-weight: 800;
        }

        .otp-description {
          margin:
            14px auto 10px;

          max-width: 390px;

          color: #687b94;

          font-size: 14px;
          line-height: 1.6;
        }

        .otp-email {
          display: inline-block;

          margin: 8px 0 25px;

          padding: 8px 14px;

          border-radius: 20px;

          background: #f1f5fa;

          color: #344b68;

          font-size: 13px;
          font-weight: 700;
        }

        .otp-form {
          text-align: left;
        }

        .otp-form label {
          display: block;

          margin-bottom: 8px;

          color: #30445f;

          font-size: 13px;
          font-weight: 700;
        }

        .otp-form input {
          width: 100%;

          height: 62px;

          border:
            1px solid #d7e0eb;

          border-radius: 14px;

          outline: none;

          text-align: center;

          font-size: 28px;
          font-weight: 800;

          letter-spacing: 10px;

          color: #10233f;

          background: #ffffff;

          transition: 0.2s ease;
        }

        .otp-form input:focus {
          border-color: #2c5ce0;

          box-shadow:
            0 0 0 4px
              rgba(
                44,
                92,
                224,
                0.10
              );
        }

        .otp-form button {
          width: 100%;

          height: 52px;

          margin-top: 20px;

          border: none;

          border-radius: 12px;

          background: #2c5ce0;

          color: white;

          font-size: 14px;
          font-weight: 800;

          cursor: pointer;
        }

        .otp-form button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .otp-error {
          margin-top: 12px;

          padding: 11px 13px;

          border-radius: 10px;

          background: #fff1f1;

          color: #c53d3d;

          font-size: 13px;
        }

        .otp-timer {
          margin-top: 20px;

          color: #71839b;

          font-size: 13px;
        }

        .otp-timer strong {
          color: #2c5ce0;
        }

        .otp-back {
          margin-top: 22px;

          border: none;
          background: transparent;

          color: #617691;

          font-size: 13px;
          font-weight: 700;

          cursor: pointer;
        }

        .otp-back:hover {
          color: #2c5ce0;
        }

        @media (
          max-width: 550px
        ) {
          .otp-card {
            padding:
              38px 24px;
            border-radius: 22px;
          }

          .otp-card h1 {
            font-size: 26px;
          }

          .otp-form input {
            font-size: 24px;
            letter-spacing: 7px;
          }
        }
      `}</style>

    </div>
  );
};

export default OTPVerification;