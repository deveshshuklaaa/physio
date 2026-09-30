

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import api from "../apiClient";

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const PatientAuthScreen = () => {
  const [mode, setMode] = useState("login");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const isPasswordValid = PASSWORD_REGEX.test(password);

  const requirements = useMemo(
    () => [
      { label: "At least 8 characters", valid: password.length >= 8 },
      { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
      { label: "One lowercase letter", valid: /[a-z]/.test(password) },
      { label: "One number", valid: /\d/.test(password) },
      { label: "One special character", valid: /[^A-Za-z0-9]/.test(password) },
    ],
    [password]
  );

  // =========================================================
  // GOOGLE LOGIN / REGISTRATION - PATIENT ONLY
  // =========================================================

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setGoogleLoading(true);

    try {
      if (!credentialResponse?.credential) {
        throw new Error("Google authentication credential is missing.");
      }

      const response = await api.post("/auth/google/patient", {
        credential: credentialResponse.credential,
      });

      if (!response.data?.success || !response.data?.token) {
        throw new Error(response.data?.message || "Google authentication failed.");
      }

      const token = response.data.token;
      const googleUser = response.data.user;

      localStorage.setItem("authToken", token);

      if (googleUser) {
        localStorage.setItem("user", JSON.stringify(googleUser));
      }

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Follow the same patient onboarding flow as normal login.
      try {
        const profileResponse = await api.get("/profile/patient-profile");
        const profile = profileResponse.data || {};

        const consentCompleted =
          profile.consentDataCollection === true &&
          profile.consentAI === true &&
          profile.consentVideoMonitoring === true &&
          profile.privacyAccepted === true &&
          profile.termsAccepted === true &&
          !!profile.consentTimestamp;

        if (!consentCompleted) {
          navigate("/consent", { replace: true });
          return;
        }

        const profileCompleted =
          typeof profile.fullName === "string" && profile.fullName.trim().length > 0 &&
          typeof profile.gender === "string" && profile.gender.trim().length > 0 &&
          !!profile.dob &&
          typeof profile.bloodGroup === "string" && profile.bloodGroup.trim().length > 0 &&
          typeof profile.mobile === "string" && /^\d{10}$/.test(profile.mobile.trim()) &&
          typeof profile.state === "string" && profile.state.trim().length > 0 &&
          typeof profile.city === "string" && profile.city.trim().length > 0 &&
          typeof profile.pinCode === "string" && /^\d{6}$/.test(profile.pinCode.trim()) &&
          typeof profile.emergencyName === "string" && profile.emergencyName.trim().length > 0 &&
          typeof profile.emergencyRelationship === "string" && profile.emergencyRelationship.trim().length > 0 &&
          typeof profile.emergencyPhone === "string" && /^\d{10}$/.test(profile.emergencyPhone.trim());

        if (!profileCompleted) {
          navigate("/register/profile", { replace: true });
          return;
        }

        navigate("/awareness", { replace: true });
        return;
      } catch (profileError) {
        if (profileError.response?.status === 404) {
          navigate("/consent", { replace: true });
          return;
        }

        console.error("Google patient onboarding error:", profileError);
        setError("Google login succeeded, but we could not check your patient profile. Please try again.");
      }
    } catch (err) {
      console.error("Google authentication error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Google authentication failed. Please try again."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error("Google Sign-In failed.");
    setError("Google Sign-In was cancelled or failed. Please try again.");
  };

  // =========================================================
  // LOGIN / REGISTER
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (mode === "register" && !isPasswordValid) {
      setError("Password must be at least 8 characters and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.");
      return;
    }

    setLoading(true);

    try {
      const endpoint =
        mode === "login"
          ? "/auth/login"
          : "/auth/register";

      const payload =
        mode === "login"
          ? {
              email,
              password,
            }
          : {
              fullName,
              email,
              password,
            };

      const res = await api.post(
        endpoint,
        payload
      );

      // =====================================================
      // LOGIN
      // =====================================================

      // if (mode === "login") {
      //   const token = res.data.token;

      //   // Save authentication token
      //   localStorage.setItem(
      //     "authToken",
      //     token
      //   );

      //   // Set Authorization header
      //   api.defaults.headers.common[
      //     "Authorization"
      //   ] = `Bearer ${token}`;

      //   // ===================================================
      //   // CHECK PATIENT PROFILE
      //   // ===================================================

      //   try {
      //     await api.get(
      //       "/profile/patient-profile"
      //     );

      //     // Existing patient
      //     navigate("/awareness");

      //   } catch (err) {
      //     console.log(
      //       "PROFILE ERROR:",
      //       err
      //     );

      //     // New patient
      //     navigate("/consent");
      //   }
// =====================================================
// LOGIN
// =====================================================

if (mode === "login") {

  // =====================================================
  // OTP VERIFICATION REQUIRED
  // =====================================================

  if (res.data?.requiresOtp) {

    navigate(
      "/verify-otp",
      {
        state: {
          challengeId:
            res.data.challengeId,

          role: "patient",

          maskedEmail:
            res.data.maskedEmail,
        },

        replace: true,
      }
    );

    return;
  }

} else {

  // ===================================================
  // REGISTER SUCCESS
  // ===================================================

  setMode("login");

  setPassword("");

  setShowPassword(false);

  setError("");
}

    } catch (err) {

      console.error(
        "Authentication error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };


  // =========================================================
  // SWITCH LOGIN / REGISTER
  // =========================================================

  const switchMode = () => {

    setMode(
      mode === "login"
        ? "register"
        : "login"
    );

    setError("");
    setPassword("");
    setShowPassword(false);
  };


  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="patient-auth-page">

      <div className="patient-auth-card">


        {/* ===================================================
            LEFT SIDE — FORM
        =================================================== */}

        <div className="patient-form-side">


          {/* =================================================
              BRAND
          ================================================= */}

          <div className="patient-brand">

            <div className="patient-brand-logo">
              +
            </div>

            <div>

              <div className="patient-brand-name">
                Hemophilia Care
              </div>

              <div className="patient-brand-subtitle">
                CLINICAL PLATFORM
              </div>

            </div>

          </div>


          {/* =================================================
              FORM CONTENT
          ================================================= */}

          <div className="patient-form-content">


            <h1>
              {mode === "login"
                ? "Patient Login"
                : "Create Account"}
            </h1>


            <p className="patient-description">

              {mode === "login"
                ? "Sign in to securely access your patient workspace."
                : "Create your secure patient account to get started."}

            </p>


            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="patient-form"
            >


              {/* ===============================================
                  FULL NAME
              =============================================== */}

              {mode === "register" && (

                <div className="patient-field">

                  <label htmlFor="fullName">
                    Full Name
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(
                        e.target.value
                      )
                    }
                    placeholder="Enter your full name"
                    autoComplete="name"
                    disabled={loading}
                    required
                  />

                </div>

              )}


              {/* ===============================================
                  EMAIL
              =============================================== */}

              <div className="patient-field">

                <label htmlFor="email">
                  Email Address
                </label>

                <div className="patient-input-wrapper">

                  <span className="patient-input-icon">
                    @
                  </span>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    placeholder="Enter your email address"
                    autoComplete="email"
                    disabled={loading}
                    required
                  />

                </div>

              </div>


              {/* ===============================================
                  PASSWORD
              =============================================== */}

              <div className="patient-field">

                <label htmlFor="password">
                  Password
                </label>

                <div className="patient-input-wrapper">

                  <span className="patient-input-icon">
                    •
                  </span>

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="Enter your password"
                    autoComplete={
                      mode === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    disabled={loading}
                    required
                  />

                  <button
                    type="button"
                    className="patient-show-password"
                    onClick={() =>
                      setShowPassword(
                        (prev) => !prev
                      )
                    }
                    disabled={loading}
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              {mode === "register" && password.length > 0 && (
                <div className="patient-password-requirements">
                  <div className="patient-req-title">Password must contain:</div>
                  {requirements.map((item) => (
                    <div
                      key={item.label}
                      className="patient-req-item"
                      style={{ color: item.valid ? "#16805c" : "#65758b" }}
                    >
                      {item.valid ? "✓" : "○"} {item.label}
                    </div>
                  ))}
                </div>
              )}

              </div>


              {mode === "login" && (
                <div style={{textAlign: "right", marginTop: "-8px", marginBottom: "8px"}}>
                  <a
                    href="/forgot-password"
                    style={{
                      fontSize: "13px",
                      color: "var(--accent, #4a90d9)",
                      textDecoration: "none",
                    }}
                  >
                    Forgot Password?
                  </a>
                </div>
              )}

              {/* ===============================================
                  ERROR
              =============================================== */}

              {error && (

                <div className="patient-error">

                  <span>
                    !
                  </span>

                  <p>
                    {error}
                  </p>

                </div>

              )}


              {/* ===============================================
                  LOGIN / REGISTER BUTTON
              =============================================== */}

              <button
                className={`patient-main-button${mode === "register" && !isPasswordValid ? " patient-main-button-disabled" : ""}`}
                type="submit"
                disabled={loading || googleLoading || (mode === "register" && !isPasswordValid)}
              >

                {loading
                  ? "Please wait..."
                  : mode === "login"
                  ? "Sign In   →"
                  : "Create Account   →"}

              </button>

            </form>

            {/* =================================================
                GOOGLE SIGN-IN
            ================================================= */}

            <div className="patient-google-section">
              <div className="patient-google-divider">
                <span></span>
                <p>OR</p>
                <span></span>
              </div>

              <div className="patient-google-button">
                {googleLoading ? (
                  <div className="patient-google-loading">
                    Signing in with Google...
                  </div>
                ) : (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    width="100%"
                    text="continue_with"
                    shape="rectangular"
                  />
                )}
              </div>
            </div>


            {/* =================================================
                REGISTER / LOGIN
            ================================================= */}

            <div className="patient-toggle-area">

              <div className="patient-toggle-line">
                <span></span>

                <p>
                  {mode === "login"
                    ? "New to Hemophilia Care?"
                    : "Already have an account?"}
                </p>

                <span></span>
              </div>


              <button
                type="button"
                className="patient-register-button"
                onClick={switchMode}
                disabled={loading}
              >

                {mode === "login"
                  ? "Register for an Account   →"
                  : "Back to Patient Login   →"}

              </button>

            </div>


            {/* =================================================
                DOCTOR LOGIN
            ================================================= */}

            <div className="patient-doctor-link">

              <button
                type="button"
                className="patient-admin-buttonn"
                onClick={() =>
                  navigate(
                    "/doctor-login"
                  )
                }
              >
                ← Back to Physiotherapist Login
              </button>

            </div>


            {/* =================================================
                ADMIN PORTAL
            ================================================= */}

            <button
              type="button"
              className="patient-admin-button"
              onClick={() =>
                navigate(
                  "/admin-login"
                )
              }
            >
              Administrator Portal
            </button>


          </div>

        </div>


        {/* ===================================================
            RIGHT SIDE — BLUE INFORMATION PANEL
        =================================================== */}

        <div className="patient-info-side">


          {/* =================================================
              DECORATIVE ELEMENTS
          ================================================= */}

          <div className="patient-circle-top"></div>

          <div className="patient-circle-bottom"></div>

          <div className="patient-cross">
            +
          </div>


          {/* =================================================
              INFORMATION CONTENT
          ================================================= */}

          <div className="patient-info-content">


            {/* SECURE BADGE */}

            <div className="patient-secure-badge">

              <span className="patient-check">
                ✓
              </span>

              Secure Patient Access

            </div>


            {/* HEADING */}

            <h2>

              Your Health.
              <br />

              Your Care.
              <br />

              <span>
                One Secure Platform.
              </span>

            </h2>


            {/* DESCRIPTION */}

            <p className="patient-info-description">

              Access your hemophilia health
              information, assessments and
              personalized care support through
              one secure platform.

            </p>


            {/* =================================================
                FEATURES
            ================================================= */}

            <div className="patient-features">


              <div className="patient-feature">

                <div className="patient-feature-icon">
                  ✓
                </div>

                <div>

                  <strong>
                    Secure Access
                  </strong>

                  <p>
                    Protected patient information
                  </p>

                </div>

              </div>


              <div className="patient-feature">

                <div className="patient-feature-icon">
                  ✓
                </div>

                <div>

                  <strong>
                    Health Assessment
                  </strong>

                  <p>
                    Understand your hemophilia risk
                  </p>

                </div>

              </div>


              <div className="patient-feature">

                <div className="patient-feature-icon">
                  ✓
                </div>

                <div>

                  <strong>
                    Personalized Care
                  </strong>

                  <p>
                    Keep your health information connected
                  </p>

                </div>

              </div>


            </div>


          </div>

        </div>

      </div>


      {/* =====================================================
          STYLES
      ===================================================== */}

      <style>{`

        /* =====================================================
           PAGE
        ===================================================== */

        .patient-auth-page {

          min-height: 100vh;

          width: 100%;

          display: flex;

          align-items: center;

          justify-content: center;

          padding: 30px;

          box-sizing: border-box;

          background:
            #edf3ff;

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          color:
            #163b63;

        }


        /* =====================================================
           MAIN CARD
        ===================================================== */

        .patient-auth-card {

          width: 100%;

          max-width: 1050px;

          min-height: 590px;

          display: flex;

          background:
            #ffffff;

          border-radius:
            22px;

          overflow: hidden;

          box-shadow:
            0 25px 70px
            rgba(45, 82, 145, 0.16);

        }


        /* =====================================================
           LEFT FORM SIDE
        ===================================================== */

        .patient-form-side {

          width: 51%;

          padding:
            45px 55px;

          box-sizing: border-box;

          display: flex;

          flex-direction: column;

          justify-content: flex-start;

          background:
            #ffffff;

        }


        /* =====================================================
           BRAND
        ===================================================== */

        .patient-brand {

          display: flex;

          align-items: center;

          gap: 11px;

          margin-bottom:
            36px;

        }


        .patient-brand-logo {

          width: 40px;

          height: 40px;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius:
            9px;

          background:
            linear-gradient(
              135deg,
              #4b78f5,
              #5c82ff
            );

          color:
            #ffffff;

          font-size:
            25px;

          font-weight:
            400;

          box-shadow:
            0 8px 18px
            rgba(75,120,245,0.20);

        }


        .patient-brand-name {

          font-size:
            14px;

          font-weight:
            700;

          color:
            #123c66;

          line-height:
            1.1;

        }


        .patient-brand-subtitle {

          margin-top:
            4px;

          font-size:
            8px;

          letter-spacing:
            1.5px;

          color:
            #7890aa;

          font-weight:
            600;

        }


        /* =====================================================
           FORM CONTENT
        ===================================================== */

        .patient-form-content {

          width: 100%;

          max-width:
            430px;

        }


        .patient-form-content h1 {

          margin:
            0 0 9px;

          font-size:
            31px;

          line-height:
            1.15;

          font-weight:
            650;

          letter-spacing:
            -0.8px;

          color:
            #123b65;

        }


        .patient-description {

          margin:
            0 0 28px;

          font-size:
            12px;

          line-height:
            1.6;

          color:
            #6683a1;

        }


        /* =====================================================
           FORM
        ===================================================== */

        .patient-form {

          display:
            flex;

          flex-direction:
            column;

          gap:
            18px;

        }


        /* =====================================================
           FIELD
        ===================================================== */

        .patient-field {

          display:
            flex;

          flex-direction:
            column;

          gap:
            7px;

        }


        .patient-field label {

          font-size:
            11px;

          font-weight:
            600;

          color:
            #17436e;

        }


        /* =====================================================
           INPUT WRAPPER
        ===================================================== */

        .patient-input-wrapper {

          position:
            relative;

          width:
            100%;

        }


        .patient-input-icon {

          position:
            absolute;

          left:
            15px;

          top:
            50%;

          transform:
            translateY(-50%);

          color:
            #7594b5;

          font-size:
            11px;

          z-index:
            2;

        }


        /* =====================================================
           INPUT
        ===================================================== */

        .patient-field input {

          width:
            100%;

          height:
            47px;

          box-sizing:
            border-box;

          padding:
            0 15px 0 40px;

          border:
            1px solid #d5e1f0;

          border-radius:
            8px;

          background:
            #f9fbff;

          outline:
            none;

          color:
            #193b5d;

          font-size:
            12px;

          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease;

        }


        .patient-field input::placeholder {

          color:
            #9bb0c8;

        }


        .patient-field input:focus {

          border-color:
            #4d7df8;

          background:
            #ffffff;

          box-shadow:
            0 0 0 3px
            rgba(77,125,248,0.09);

        }


        .patient-field input:disabled {

          opacity:
            0.65;

          cursor:
            not-allowed;

        }


        /* =====================================================
           PASSWORD BUTTON
        ===================================================== */

        .patient-show-password {

          position:
            absolute;

          right:
            12px;

          top:
            50%;

          transform:
            translateY(-50%);

          border:
            none;

          background:
            transparent;

          color:
            #5279c4;

          font-size:
            10px;

          font-weight:
            600;

          cursor:
            pointer;

        }


        .patient-show-password:hover {

          color:
            #315db1;

        }


        /* =====================================================
           ERROR
        ===================================================== */

        .patient-error {

          display:
            flex;

          align-items:
            flex-start;

          gap:
            8px;

          padding:
            10px 12px;

          border:
            1px solid #f1d0cd;

          border-radius:
            8px;

          background:
            #fff5f4;

          color:
            #a53b35;

        }


        .patient-error span {

          width:
            17px;

          height:
            17px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          flex-shrink:
            0;

          border-radius:
            50%;

          background:
            #f6d9d6;

          font-size:
            10px;

          font-weight:
            800;

        }


        .patient-error p {

          margin:
            0;

          font-size:
            11px;

          line-height:
            1.45;

        }


        /* =====================================================
           MAIN BUTTON
        ===================================================== */

        .patient-main-button {

          width:
            100%;

          height:
            47px;

          margin-top:
            1px;

          border:
            none;

          border-radius:
            8px;

          background:
            linear-gradient(
              90deg,
              #4a7dfc,
              #5f87ff
            );

          color:
            #ffffff;

          font-size:
            12px;

          font-weight:
            650;

          cursor:
            pointer;

          box-shadow:
            0 8px 20px
            rgba(74,125,252,0.22);

          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            opacity 0.18s ease;

        }


        .patient-main-button:hover:not(:disabled) {

          transform:
            translateY(-2px);

          box-shadow:
            0 11px 25px
            rgba(74,125,252,0.28);

        }


        .patient-main-button:disabled {

          opacity:
            0.65;

          cursor:
            not-allowed;

        }

        .patient-password-requirements {
          background: #f5f8fc;
          border: 1px solid #e0e7f0;
          border-radius: 10px;
          padding: 10px 13px;
          margin-top: 6px;
        }

        .patient-req-title {
          color: #40536d;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .patient-req-item {
          font-size: 11px;
          line-height: 1.8;
        }


        /* =====================================================
           GOOGLE SIGN-IN
        ===================================================== */

        .patient-google-section {
          width: 100%;
          margin-top: 18px;
        }

        .patient-google-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          margin-bottom: 15px;
        }

        .patient-google-divider span {
          flex: 1;
          height: 1px;
          background: #e1e8f2;
        }

        .patient-google-divider p {
          margin: 0;
          font-size: 11px;
          font-weight: 600;
          color: #91a5bc;
        }

        .patient-google-button {
          width: 100%;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .patient-google-loading {
          font-size: 13px;
          color: #91a5bc;
        }


        /* =====================================================
           REGISTER / LOGIN AREA
        ===================================================== */

        .patient-toggle-area {

          margin-top:
            22px;

        }


        .patient-toggle-line {

          display:
            flex;

          align-items:
            center;

          gap:
            10px;

          margin-bottom:
            10px;

        }


        .patient-toggle-line span {

          flex:
            1;

          height:
            1px;

          background:
            #e1e8f2;

        }


        .patient-toggle-line p {

          margin:
            0;

          white-space:
            nowrap;

          font-size:
            9px;

          color:
            #91a5bc;

        }


        .patient-register-button {

          width:
            100%;

          height:
            42px;

          border:
            1px solid #d5e1f0;

          border-radius:
            8px;

          background:
            #f9fbff;

          color:
            #4a7dfc;

          font-size:
            11px;

          font-weight:
            600;

          cursor:
            pointer;

          transition:
            all 0.18s ease;

        }


        .patient-register-button:hover:not(:disabled) {

          background:
            #eef3ff;

          border-color:
            #9db7f5;

        }


        /* =====================================================
           DOCTOR LINK
        ===================================================== */

        .patient-doctor-link {

          margin-top:
            12px;

          text-align:
            center;

        }


        .patient-doctor-link button {

          border:
            none;

          background:
            transparent;

          color:
            #6f8ba8;

          font-size:
            9px;

          cursor:
            pointer;

          padding:
            3px 5px;

        }


        .patient-doctor-link button:hover {

          color:
            #4a7dfc;

        }


        /* =====================================================
           ADMIN PORTAL
        ===================================================== */

        .patient-admin-button {

          width:
            100%;

          height:
            36px;

          margin-top:
            7px;

          border:
            1px solid #dce4ef;

          border-radius:
            7px;

          background:
            #ffffff;

          color:
            #607c9c;

          font-size:
            9px;

          font-weight:
            600;

          cursor:
            pointer;

          transition:
            all 0.18s ease;

        }

        .patient-admin-buttonn {

          width:
            100%;

          height:
            36px;

          margin-top:
            7px;

          border:
            3px solid #020202;

          border-radius:
            7px;

          background:
            #ffffff;

          color:
            #607c9c;

          font-size:
            9px;

          font-weight:
            600;

          cursor:
            pointer;

          transition:
            all 0.18s ease;

        }


        .patient-admin-button:hover {

          background:
            #f5f8fd;

          border-color:
            #b8c9df;

          color:
            #365e91;

        }
          
        .patient-admin-buttonn:hover {

          background:
            #f5f8fd;

          border-color:
            #0c0c0c;

          color:
            #366d91;

        }


        /* =====================================================
           RIGHT BLUE PANEL
        ===================================================== */

        .patient-info-side {

          width:
            49%;

          position:
            relative;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          overflow:
            hidden;

          background:
            linear-gradient(
              135deg,
              #426df0 0%,
              #506ff1 52%,
              #656ee8 100%
            );

          color:
            #ffffff;

        }


        /* =====================================================
           TOP CIRCLE
        ===================================================== */

        .patient-circle-top {

          position:
            absolute;

          width:
            310px;

          height:
            310px;

          border:
            1px solid
            rgba(255,255,255,0.15);

          border-radius:
            50%;

          top:
            -105px;

          right:
            -60px;

        }


        /* =====================================================
           BOTTOM CIRCLE
        ===================================================== */

        .patient-circle-bottom {

          position:
            absolute;

          width:
            235px;

          height:
            235px;

          border:
            1px solid
            rgba(255,255,255,0.13);

          border-radius:
            50%;

          bottom:
            -115px;

          left:
            -95px;

        }


        /* =====================================================
           CROSS
        ===================================================== */

        .patient-cross {

          position:
            absolute;

          top:
            65px;

          right:
            58px;

          font-size:
            70px;

          line-height:
            1;

          font-weight:
            200;

          color:
            rgba(255,255,255,0.13);

          transform:
            rotate(-8deg);

        }


        /* =====================================================
           INFO CONTENT
        ===================================================== */

        .patient-info-content {

          position:
            relative;

          z-index:
            3;

          width:
            100%;

          max-width:
            340px;

          padding:
            40px;

          box-sizing:
            border-box;

        }


        /* =====================================================
           SECURE BADGE
        ===================================================== */

        .patient-secure-badge {

          display:
            inline-flex;

          align-items:
            center;

          gap:
            7px;

          padding:
            7px 12px;

          border:
            1px solid
            rgba(255,255,255,0.22);

          border-radius:
            20px;

          background:
            rgba(255,255,255,0.10);

          font-size:
            9px;

          color:
            rgba(255,255,255,0.88);

          margin-bottom:
            27px;

        }


        .patient-check {

          width:
            17px;

          height:
            17px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          background:
            rgba(255,255,255,0.18);

          font-size:
            9px;

        }


        /* =====================================================
           INFO HEADING
        ===================================================== */

        .patient-info-content h2 {

          margin:
            0;

          font-size:
            29px;

          line-height:
            1.13;

          letter-spacing:
            -0.7px;

          font-weight:
            700;

          color:
            #ffffff;

        }


        .patient-info-content h2 span {

          color:
            rgba(255,255,255,0.88);

        }


        /* =====================================================
           INFO DESCRIPTION
        ===================================================== */

        .patient-info-description {

          margin:
            24px 0 28px;

          font-size:
            11px;

          line-height:
            1.65;

          color:
            rgba(255,255,255,0.75);

          max-width:
            300px;

        }


        /* =====================================================
           FEATURES
        ===================================================== */

        .patient-features {

          display:
            flex;

          flex-direction:
            column;

          gap:
            16px;

        }


        .patient-feature {

          display:
            flex;

          align-items:
            flex-start;

          gap:
            10px;

        }


        .patient-feature-icon {

          width:
            26px;

          height:
            26px;

          flex-shrink:
            0;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            7px;

          border:
            1px solid
            rgba(255,255,255,0.22);

          background:
            rgba(255,255,255,0.10);

          font-size:
            10px;

        }


        .patient-feature strong {

          display:
            block;

          margin-bottom:
            2px;

          font-size:
            10px;

          font-weight:
            650;

          color:
            #ffffff;

        }


        .patient-feature p {

          margin:
            0;

          font-size:
            8.5px;

          color:
            rgba(255,255,255,0.65);

        }


        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 900px) {

          .patient-auth-page {

            padding:
              20px;

          }


          .patient-auth-card {

            max-width:
              900px;

          }


          .patient-form-side {

            padding:
              40px 35px;

          }


          .patient-info-content {

            padding:
              30px;

          }


          .patient-info-content h2 {

            font-size:
              25px;

          }


          .patient-cross {

            right:
              30px;

          }

        }


        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 700px) {

          .patient-auth-page {

            min-height:
              100dvh;

            padding:
              15px;

            align-items:
              flex-start;

            background:
              #edf3ff;

          }


          .patient-auth-card {

            display:
              block;

            width:
              100%;

            max-width:
              430px;

            min-height:
              auto;

            margin:
              auto;

            border-radius:
              18px;

          }


          .patient-form-side {

            width:
              100%;

            padding:
              32px 25px 28px;

          }


          .patient-info-side {

            display:
              none;

          }


          .patient-brand {

            margin-bottom:
              28px;

          }


          .patient-form-content {

            max-width:
              none;

          }


          .patient-form-content h1 {

            font-size:
              28px;

          }


          .patient-description {

            margin-bottom:
              25px;

          }

        }


        /* =====================================================
           SMALL MOBILE
        ===================================================== */

        @media (max-width: 380px) {

          .patient-auth-page {

            padding:
              8px;

          }


          .patient-form-side {

            padding:
              28px 18px 25px;

          }


          .patient-brand {

            margin-bottom:
              25px;

          }


          .patient-field input {

            height:
              46px;

          }


          .patient-main-button {

            height:
              46px;

          }

        }

      `}</style>

    </div>
  );
};

const AuthScreen = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.error("VITE_GOOGLE_CLIENT_ID is missing from the frontend .env file.");
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || ""}>
      <PatientAuthScreen />
    </GoogleOAuthProvider>
  );
};

export default AuthScreen;