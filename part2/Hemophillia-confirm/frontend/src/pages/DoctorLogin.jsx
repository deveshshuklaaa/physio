import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import api from "../apiClient";

const DoctorLogin = () => {
  const [doctorId, setDoctorId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // =========================================================
  // GO TO OTP STEP
  // =========================================================

  const goToOtp = (data) => {
    navigate("/verify-otp", {
      state: {
        challengeId: data.challengeId,
        role: data.role || "doctor",
        maskedEmail: data.maskedEmail,
        user: data.user || null,
      },
      replace: true,
    });
  };

  // =========================================================
  // GOOGLE LOGIN - EXISTING DOCTOR ACCOUNTS ONLY
  // =========================================================

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setGoogleLoading(true);

    try {
      if (!credentialResponse?.credential) {
        throw new Error(
          "Google authentication credential is missing."
        );
      }

      const res = await api.post("/doctor/google", {
        credential: credentialResponse.credential,
      });

      // Google sign-in still goes through the email OTP step, same as
      // password login -- staff 2FA is not bypassed.
      if (res.data?.requiresOtp) {
        goToOtp(res.data);
        return;
      }

      throw new Error(
        res.data?.message ||
          "Unable to complete Google sign-in."
      );
    } catch (err) {
      console.error("Doctor Google login error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Google sign-in failed. Please try again."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError(
      "Google sign-in was cancelled or could not be completed."
    );
  };

  // =========================================================
  // FORMAT PHYSIOTHERAPIST ID
  // =========================================================

  const formatProfessionalId = (value) => {
    return value
      .trim()
      .replace(/\s+/g, "")
      .toUpperCase();
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    // Make sure the ID is formatted before login
    const formattedDoctorId =
      formatProfessionalId(doctorId);

    setDoctorId(formattedDoctorId);

    try {
      const res = await api.post("/doctor/login", {
        professionalId: formattedDoctorId,
        password,
      });

      // =====================================================
      // OTP VERIFICATION
      // =====================================================

      if (res.data?.requiresOtp) {
        goToOtp(res.data);

        return;
      }

      const { token, user } = res.data;

      // =====================================================
      // SAVE AUTHENTICATION
      // =====================================================

      localStorage.setItem(
        "staffAuthToken",
        token
      );

      localStorage.setItem(
        "staffUser",
        JSON.stringify(user)
      );

      // =====================================================
      // SET AUTHORIZATION HEADER
      // =====================================================

      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      // =====================================================
      // FIRST LOGIN
      // =====================================================

      if (user.mustChangePassword === true) {
        localStorage.setItem(
          "professionalId",
          formattedDoctorId
        );

        navigate("/doctor-change-password");

        return;
      }

      // =====================================================
      // NORMAL LOGIN
      // =====================================================

      navigate("/doctor-dashboard");

    } catch (err) {
      console.error(
        "Doctor login error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Invalid Physiotherapist ID or password"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="doctor-login-page">

      <div className="doctor-login-card">

        {/* ===================================================
            LEFT SIDE - LOGIN
        =================================================== */}

        <div className="doctor-login-left">

          {/* =================================================
              BRAND
          ================================================= */}

          <div className="login-brand">

            <div className="brand-logo">
              +
            </div>

            <div className="brand-text">

              <h3>
                Somaiya Hemophysio App
              </h3>

              <span>
                Clinical Platform
              </span>

            </div>

          </div>


          {/* =================================================
              HEADING
          ================================================= */}

          <div className="login-heading">

            <h1>
              Physiotherapist Login
            </h1>

            <p>
              Sign in to securely access your
              clinical workspace.
            </p>

          </div>


          {/* =================================================
              LOGIN FORM
          ================================================= */}

          <form onSubmit={handleSubmit}>

            {/* =================================================
                PHYSIOTHERAPIST ID
            ================================================= */}

            <div className="form-group">

              <label>
                Physiotherapist ID
              </label>

              <div className="input-container">

                <div className="input-symbol">
                  ID
                </div>

                <input
                  type="text"
                  placeholder="Enter your professional ID"
                  value={doctorId}
                  onChange={(e) =>
                    setDoctorId(
                      formatProfessionalId(
                        e.target.value
                      )
                    )
                  }
                  required
                  autoComplete="username"
                />

              </div>

            </div>


            {/* =================================================
                PASSWORD
            ================================================= */}

            <div className="form-group">

              <label>
                Password
              </label>

              <div className="input-container">

                <div className="input-symbol password-symbol">
                  ●
                </div>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  required
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>


            {/* =================================================
                FORGOT PASSWORD
            ================================================= */}

            <button
              type="button"
              className="forgot-password-button"
              onClick={() =>
                navigate(
                  "/forgot-password?role=doctor"
                )
              }
              disabled={loading}
            >
              Forgot Password?
            </button>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="login-error">

                <div className="error-circle">
                  !
                </div>

                <span>
                  {error}
                </span>

              </div>
            )}


            {/* =================================================
                LOGIN BUTTON
            ================================================= */}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In

                  <span className="button-arrow">
                    →
                  </span>
                </>
              )}

            </button>

          </form>


          {/* =================================================
              GOOGLE SIGN-IN
          ================================================= */}

          <div className="doctor-google-section">

            <div className="doctor-google-divider">
              <span></span>
              <p>OR</p>
              <span></span>
            </div>

            <div className="doctor-google-button">
              {googleLoading ? (
                <div className="doctor-google-loading">
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

            <p className="doctor-google-note">
              Use the Google account registered with your
              Physiotherapist ID.
            </p>

          </div>


          {/* =================================================
              SIGN UP
          ================================================= */}

          <div className="signup-area">

            <div className="signup-divider">

              <span></span>

              <p>
                New Physiotherapist?
              </p>

              <span></span>

            </div>


            <button
              type="button"
              className="register-button"
              onClick={() =>
                navigate(
                  "/doctor-registration"
                )
              }
            >
              Register for an Account

              <span>
                →
              </span>

            </button>

          </div>


          {/* =================================================
              BACK TO PATIENT
          ================================================= */}

          <button
            type="button"
            className="patient-back-button"
            onClick={() =>
              navigate("/")
            }
          >
            ← Back to Patient Login
          </button>

        </div>

      </div>


      {/* =====================================================
          STYLES
      ===================================================== */}

      <style>{`

        /* =====================================================
           PAGE
        ===================================================== */

        .doctor-login-page {
          min-height: 100vh;
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 35px;

          box-sizing: border-box;

          background: #edf3ff;

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          color: #163b63;
        }


        /* =====================================================
           MAIN CARD
        ===================================================== */

        .doctor-login-card {
          width: 100%;
          max-width: 720px;

          min-height: 620px;

          display: flex;

          overflow: hidden;

          background: #ffffff;

          border-radius: 22px;

          box-shadow:
            0 25px 70px
            rgba(45, 82, 145, 0.16);

          border:
            1px solid #e5edf8;
        }


        /* =====================================================
           LEFT SIDE ONLY
        ===================================================== */

        .doctor-login-left {
          width: 100%;

          padding: 52px 68px;

          box-sizing: border-box;

          display: flex;

          flex-direction: column;

          justify-content: flex-start;

          background: #ffffff;
        }


        /* =====================================================
           BRAND
        ===================================================== */

        .login-brand {
          display: flex;

          align-items: center;

          gap: 12px;

          margin-bottom: 42px;
        }


        .brand-logo {
          width: 44px;
          height: 44px;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 10px;

          background:
            linear-gradient(
              135deg,
              #4b78f5,
              #5c82ff
            );

          color: #ffffff;

          font-size: 27px;

          font-weight: 400;

          box-shadow:
            0 8px 18px
            rgba(75,120,245,0.20);
        }


        .brand-text h3 {
          margin: 0;

          color: #163b63;

          font-size: 15px;

          font-weight: 700;
        }


        .brand-text span {
          display: block;

          margin-top: 4px;

          color: #91a4ba;

          font-size: 9px;

          font-weight: 600;

          letter-spacing: 1.5px;

          text-transform: uppercase;
        }


        /* =====================================================
           HEADING
        ===================================================== */

        .login-heading {
          margin-bottom: 31px;
        }


        .login-heading h1 {
          margin: 0 0 9px;

          color: #163b63;

          font-size: 36px;

          line-height: 1.15;

          font-weight: 650;

          letter-spacing: -0.8px;
        }


        .login-heading p {
          margin: 0;

          color: #7890a9;

          font-size: 14px;

          line-height: 1.6;

          max-width: 480px;
        }


        /* =====================================================
           FORM
        ===================================================== */

        .form-group {
          margin-bottom: 20px;
        }


        .form-group label {
          display: block;

          margin-bottom: 8px;

          color: #345a7d;

          font-size: 13px;

          font-weight: 600;
        }


        /* =====================================================
           INPUT CONTAINER
        ===================================================== */

        .input-container {
          width: 100%;

          height: 54px;

          display: flex;

          align-items: center;

          border:
            1px solid #d5e1f0;

          border-radius: 9px;

          background: #f9fbff;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;

          box-sizing: border-box;
        }


        .input-container:focus-within {
          background: #ffffff;

          border-color: #4a7dfc;

          box-shadow:
            0 0 0 3px
            rgba(74,125,252,0.09);
        }


        /* =====================================================
           LEFT INPUT SYMBOL
        ===================================================== */

        .input-symbol {
          width: 45px;

          flex-shrink: 0;

          display: flex;

          align-items: center;

          justify-content: center;

          color: #7894b0;

          font-size: 10px;

          font-weight: 700;
        }


        .password-symbol {
          font-size: 8px;

          letter-spacing: 1px;
        }


        /* =====================================================
           INPUT
        ===================================================== */

        .input-container input {
          width: 100%;

          min-width: 0;

          height: 100%;

          border: none;

          outline: none;

          background: transparent;

          color: #163b63;

          font-size: 14px;

          padding: 0 14px 0 0;

          box-sizing: border-box;
        }


        .input-container input::placeholder {
          color: #a4b4c6;
        }


        /* =====================================================
           PASSWORD SHOW / HIDE
        ===================================================== */

        .password-toggle-button {
          flex-shrink: 0;

          height: 100%;

          min-width: 65px;

          padding: 0 14px;

          border: none;

          background: transparent;

          color: #4a7dfc;

          font-size: 12px;

          font-weight: 700;

          cursor: pointer;

          white-space: nowrap;
        }


        .password-toggle-button:hover {
          color: #315fd4;
        }


        .password-toggle-button:disabled {
          opacity: 0.6;

          cursor: not-allowed;
        }


        /* =====================================================
           FORGOT PASSWORD
        ===================================================== */

        .forgot-password-button {
          display: block;

          width: 100%;

          margin: -5px 0 17px;

          padding: 0;

          border: none;

          background: transparent;

          color: #3f65c8;

          font-size: 13px;

          font-weight: 700;

          text-align: right;

          cursor: pointer;
        }


        .forgot-password-button:disabled {
          opacity: 0.6;

          cursor: not-allowed;
        }


        /* =====================================================
           ERROR
        ===================================================== */

        .login-error {
          display: flex;

          align-items: center;

          gap: 9px;

          margin-bottom: 14px;

          padding: 11px 13px;

          border-radius: 8px;

          background: #fff4f4;

          border: 1px solid #ffd7d7;

          color: #c62828;

          font-size: 12px;

          line-height: 1.4;
        }


        .error-circle {
          width: 18px;

          height: 18px;

          flex-shrink: 0;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 50%;

          background: #d93025;

          color: #ffffff;

          font-size: 10px;

          font-weight: 700;
        }


        /* =====================================================
           LOGIN BUTTON
        ===================================================== */

        .login-button {
          width: 100%;

          height: 54px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 11px;

          border: none;

          border-radius: 9px;

          background:
            linear-gradient(
              90deg,
              #4a7dfc,
              #5f82ff
            );

          color: #ffffff;

          font-size: 14px;

          font-weight: 600;

          cursor: pointer;

          transition: 0.2s ease;
        }


        .login-button:hover:not(:disabled) {
          transform: translateY(-1px);

          box-shadow:
            0 9px 22px
            rgba(74,125,252,0.25);
        }


        .login-button:disabled {
          opacity: 0.7;

          cursor: not-allowed;

          transform: none;

          box-shadow: none;
        }


        .button-arrow {
          font-size: 17px;

          line-height: 1;
        }


        /* =====================================================
           LOADING
        ===================================================== */

        .loading-spinner {
          width: 15px;

          height: 15px;

          border:
            2px solid
            rgba(255,255,255,0.4);

          border-top-color: #ffffff;

          border-radius: 50%;

          animation:
            doctor-spin 0.7s linear infinite;
        }


        @keyframes doctor-spin {
          to {
            transform: rotate(360deg);
          }
        }


        /* =====================================================
           SIGN UP
        ===================================================== */

        .doctor-google-section {
          margin-top: 22px;
        }


        .doctor-google-divider {
          display: flex;

          align-items: center;

          gap: 11px;

          margin-bottom: 14px;
        }


        .doctor-google-divider span {
          flex: 1;

          height: 1px;

          background: #e8edf4;
        }


        .doctor-google-divider p {
          margin: 0;

          color: #94a5b7;

          font-size: 11px;

          white-space: nowrap;
        }


        .doctor-google-button {
          display: flex;

          justify-content: center;
        }


        .doctor-google-loading {
          height: 46px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #617691;

          font-size: 13px;
          font-weight: 700;
        }


        .doctor-google-note {
          margin: 10px 0 0;

          text-align: center;

          color: #94a5b7;

          font-size: 11px;

          line-height: 1.5;
        }


        .signup-area {
          margin-top: 26px;
        }


        .signup-divider {
          display: flex;

          align-items: center;

          gap: 11px;

          margin-bottom: 12px;
        }


        .signup-divider span {
          flex: 1;

          height: 1px;

          background: #e8edf4;
        }


        .signup-divider p {
          margin: 0;

          color: #94a5b7;

          font-size: 11px;

          white-space: nowrap;
        }


        .register-button {
          width: 100%;

          height: 46px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 9px;

          border:
            1px solid #d8e4f4;

          border-radius: 9px;

          background: #f8faff;

          color: #4a7dfc;

          font-size: 13px;

          font-weight: 600;

          cursor: pointer;

          transition: 0.2s ease;
        }


        .register-button span {
          font-size: 16px;
        }


        .register-button:hover {
          background: #f0f5ff;

          border-color: #bcd0ee;

          transform: translateY(-1px);
        }


        /* =====================================================
           PATIENT LOGIN
        ===================================================== */

        .patient-back-button {
          align-self: center;

          margin-top: 18px;

          border: none;

          background: transparent;

          color: #8195aa;

          font-size: 12px;

          cursor: pointer;

          transition: 0.2s ease;
        }


        .patient-back-button:hover {
          color: #4a7dfc;

          text-decoration: underline;
        }


        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 760px) {

          .doctor-login-page {
            padding: 25px;
          }


          .doctor-login-card {
            max-width: 650px;
          }


          .doctor-login-left {
            padding: 45px 50px;
          }


          .login-heading h1 {
            font-size: 34px;
          }

        }


        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 600px) {

          .doctor-login-page {
            min-height: 100dvh;

            padding: 15px;

            align-items: flex-start;
          }


          .doctor-login-card {
            width: 100%;

            max-width: 500px;

            min-height: auto;

            margin: auto;

            border-radius: 18px;
          }


          .doctor-login-left {
            width: 100%;

            padding: 34px 27px 30px;
          }


          .login-brand {
            margin-bottom: 31px;
          }


          .login-heading h1 {
            font-size: 30px;
          }


          .login-heading p {
            font-size: 13px;
          }


          .input-container {
            height: 52px;
          }


          .input-container input {
            font-size: 14px;
          }


          .login-button {
            height: 52px;

            font-size: 14px;
          }


          .register-button {
            height: 46px;

            font-size: 13px;
          }

        }


        /* =====================================================
           SMALL MOBILE
        ===================================================== */

        @media (max-width: 380px) {

          .doctor-login-page {
            padding: 8px;
          }


          .doctor-login-left {
            padding: 28px 18px 25px;
          }


          .login-brand {
            margin-bottom: 25px;
          }


          .login-heading h1 {
            font-size: 28px;
          }


          .input-container {
            height: 49px;
          }


          .login-button {
            height: 49px;
          }

        }

      `}</style>

    </div>
  );
};

const DoctorLoginScreen = () => {
  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.error(
      "VITE_GOOGLE_CLIENT_ID is missing from the frontend .env file."
    );
  }

  return (
    <GoogleOAuthProvider
      clientId={googleClientId || ""}
    >
      <DoctorLogin />
    </GoogleOAuthProvider>
  );
};

export default DoctorLoginScreen;