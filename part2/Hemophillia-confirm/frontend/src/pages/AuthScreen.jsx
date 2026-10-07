







import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import api from "../apiClient";

const PatientAuthScreen = () => {
  const [mode, setMode] = useState("login");

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // =========================================================
  // LOGIN / REGISTER
  // =========================================================
  // =========================================================
// FULL NAME FORMATTING
// =========================================================

const formatFullName = (value) => {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((name) => {
      if (!name) return "";

      return (
        name.charAt(0).toUpperCase() +
        name.slice(1).toLowerCase()
      );
    })
    .join(" ");
};


// =========================================================
// NAME VALIDATION (format only; server is the authority)
// =========================================================

const validateNameParts = (first, middle, last) => {
  if (!first || !last) {
    return "First name and last name are required.";
  }

  // Allow letters, hyphen and apostrophe
  const nameRegex = /^[A-Za-z]+(?:[-'][A-Za-z]+)*$/;

  for (const part of [first, middle, last]) {
    if (!part) continue; // middle name optional

    if (part.length > 100) {
      return "Each name part must be 100 characters or fewer.";
    }

    if (!nameRegex.test(part)) {
      return "Names should contain letters only. Numbers and special characters are not allowed.";
    }
  }

  return "";
};

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

      // Follow the same patient onboarding flow as normal OTP login.
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // =====================================================
    // REGISTRATION PASSWORD VALIDATION
    // =====================================================

    if (mode === "register") {

  // =====================================================
  // FORMAT FULL NAME
  // =====================================================

  const first = formatFullName(firstName);
  const middle = formatFullName(middleName);
  const last = formatFullName(lastName);

  setFirstName(first);
  setMiddleName(middle);
  setLastName(last);


  // =====================================================
  // VALIDATE FULL NAME
  // =====================================================

  const nameError = validateNameParts(first, middle, last);

  if (nameError) {
    setError(nameError);
    return;
  }


  // =====================================================
  // PASSWORD VALIDATION
  // =====================================================

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  if (!passwordRegex.test(password)) {
    setError(
      "Password must be at least 8 characters and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character."
    );
    return;
  }
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
              firstName: first,
              middleName: middle,
              lastName: last,
              email,
              password,
            };

      const res = await api.post(endpoint, payload);

      // =====================================================
      // LOGIN
      // =====================================================

      if (mode === "login") {
        // =====================================================
        // OTP VERIFICATION REQUIRED
        // =====================================================

        if (res.data?.requiresOtp) {
          navigate("/verify-otp", {
            state: {
              challengeId: res.data.challengeId,
              role: "patient",
              maskedEmail: res.data.maskedEmail,
            },
            replace: true,
          });

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
      console.error("Authentication error:", err);

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
            FORM SIDE
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
                Somaiya Hemophysio App 
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
                <>
                <div className="patient-field">

                  <label htmlFor="firstName">
                    First Name
                  </label>

                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) =>
                      setFirstName(e.target.value)
                    }
                    onBlur={() => {
                      setFirstName(formatFullName(firstName));
                    }}
                    placeholder="First Name"
                    maxLength={100}
                    autoComplete="given-name"
                    disabled={loading || googleLoading}
                    required
                  />

                </div>

                <div className="patient-field">

                  <label htmlFor="middleName">
                    Middle Name (optional)
                  </label>

                  <input
                    id="middleName"
                    type="text"
                    value={middleName}
                    onChange={(e) =>
                      setMiddleName(e.target.value)
                    }
                    onBlur={() => {
                      setMiddleName(formatFullName(middleName));
                    }}
                    placeholder="Middle Name (optional)"
                    maxLength={100}
                    autoComplete="additional-name"
                    disabled={loading || googleLoading}
                    
                  />

                </div>

                <div className="patient-field">

                  <label htmlFor="lastName">
                    Last Name
                  </label>

                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) =>
                      setLastName(e.target.value)
                    }
                    onBlur={() => {
                      setLastName(formatFullName(lastName));
                    }}
                    placeholder="Last Name"
                    maxLength={100}
                    autoComplete="family-name"
                    disabled={loading || googleLoading}
                    required
                  />

                </div>
                </>
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
                      setEmail(e.target.value)
                    }
                    placeholder="Enter your email address"
                    autoComplete="email"
                    disabled={loading || googleLoading}
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
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete={
                      mode === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    disabled={loading || googleLoading}
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
                    disabled={loading || googleLoading}
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

                {mode === "register" && (
                  <div className="patient-password-requirements">

                    <div
                      className={
                        password.length >= 8
                          ? "requirement valid"
                          : "requirement"
                      }
                    >
                      {password.length >= 8
                        ? "✓"
                        : "○"}{" "}
                      At least 8 characters
                    </div>

                    <div
                      className={
                        /[A-Z]/.test(password)
                          ? "requirement valid"
                          : "requirement"
                      }
                    >
                      {/[A-Z]/.test(password)
                        ? "✓"
                        : "○"}{" "}
                      1 uppercase letter
                    </div>

                    <div
                      className={
                        /[a-z]/.test(password)
                          ? "requirement valid"
                          : "requirement"
                      }
                    >
                      {/[a-z]/.test(password)
                        ? "✓"
                        : "○"}{" "}
                      1 lowercase letter
                    </div>

                    <div
                      className={
                        /\d/.test(password)
                          ? "requirement valid"
                          : "requirement"
                      }
                    >
                      {/\d/.test(password)
                        ? "✓"
                        : "○"}{" "}
                      1 number
                    </div>

                    <div
                      className={
                        /[^A-Za-z0-9]/.test(password)
                          ? "requirement valid"
                          : "requirement"
                      }
                    >
                      {/[^A-Za-z0-9]/.test(password)
                        ? "✓"
                        : "○"}{" "}
                      1 special character
                    </div>

                  </div>
                )}

              </div>

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
                className="patient-main-button"
                type="submit"
                disabled={loading || googleLoading}
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                  ? "Sign In   "
                  : "Create Account   "}
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
                FORGOT PASSWORD
            ================================================= */}

            {mode === "login" && (
              <button
                type="button"
                className="patient-forgot-password"
                onClick={() =>
                  navigate(
                    "/forgot-password?role=patient"
                  )
                }
                disabled={loading}
              >
                Forgot Password?
              </button>
            )}

            {/* =================================================
                REGISTER / LOGIN
            ================================================= */}

            <div className="patient-toggle-area">

              <div className="patient-toggle-line">

                <span></span>

                <p>
                  {mode === "login"
                    ? "New to Somaiya Hemophysio App ?"
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
                  ? "Register for an Account   "
                  : "Back to Patient Login   "}
              </button>

            </div>

            {/* =================================================
                DOCTOR / PHYSIOTHERAPIST LOGIN
            ================================================= */}

            <div className="patient-doctor-link">

              <button
                type="button"
                className="patient-admin-buttonn"
                onClick={() =>
                  navigate("/doctor-login")
                }
              >
                Physiotherapist Login 
              </button>

            </div>

            {/* =================================================
                ADMIN PORTAL
            ================================================= */}

            <button
              type="button"
              className="patient-admin-button"
              onClick={() =>
                navigate("/admin-login")
              }
            >
              Administrator Portal
            </button>

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

        .patient-auth-card {
          width: 100%;
          max-width: 720px;
          min-height: 650px;

          display: flex;

          background: #ffffff;

          border-radius: 22px;

          overflow: hidden;

          box-shadow:
            0 25px 70px
            rgba(45, 82, 145, 0.16);
        }


        /* =====================================================
           FORM SIDE
        ===================================================== */

        .patient-form-side {
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

        .patient-brand {
          display: flex;
          align-items: center;

          gap: 12px;

          margin-bottom: 42px;
        }


        .patient-brand-logo {
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


        .patient-brand-name {
          font-size: 15px;
          font-weight: 700;

          color: #123c66;

          line-height: 1.1;
        }


        .patient-brand-subtitle {
          margin-top: 5px;

          font-size: 9px;

          letter-spacing: 1.6px;

          color: #7890aa;

          font-weight: 600;
        }


        /* =====================================================
           FORM CONTENT
        ===================================================== */

        .patient-form-content {
          width: 100%;
          max-width: 560px;

          margin: 0 auto;
        }


        .patient-form-content h1 {
          margin: 0 0 10px;

          font-size: 36px;

          line-height: 1.15;

          font-weight: 650;

          letter-spacing: -0.9px;

          color: #123b65;
        }


        .patient-description {
          margin: 0 0 31px;

          font-size: 14px;

          line-height: 1.6;

          color: #6683a1;
        }


        /* =====================================================
           FORM
        ===================================================== */

        .patient-form {
          display: flex;

          flex-direction: column;

          gap: 20px;
        }


        /* =====================================================
           FIELD
        ===================================================== */

        .patient-field {
          display: flex;

          flex-direction: column;

          gap: 8px;
        }


        .patient-field label {
          font-size: 13px;

          font-weight: 600;

          color: #17436e;
        }


        /* =====================================================
           INPUT WRAPPER
        ===================================================== */

        .patient-input-wrapper {
          position: relative;

          width: 100%;
        }


        .patient-input-icon {
          position: absolute;

          left: 17px;

          top: 50%;

          transform: translateY(-50%);

          color: #7594b5;

          font-size: 13px;

          z-index: 2;
        }


        /* =====================================================
           INPUT
        ===================================================== */

        .patient-field input {
          width: 100%;

          height: 54px;

          box-sizing: border-box;

          padding: 0 17px 0 44px;

          border:
            1px solid #d5e1f0;

          border-radius: 9px;

          background: #f9fbff;

          outline: none;

          color: #193b5d;

          font-size: 14px;

          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease;
        }


        .patient-field input::placeholder {
          color: #9bb0c8;
        }


        .patient-field input:focus {
          border-color: #4d7df8;

          background: #ffffff;

          box-shadow:
            0 0 0 3px
            rgba(77,125,248,0.09);
        }


        .patient-field input:disabled {
          opacity: 0.65;

          cursor: not-allowed;
        }


        /* =====================================================
           PASSWORD BUTTON
        ===================================================== */

        .patient-show-password {
          position: absolute;

          right: 14px;

          top: 50%;

          transform: translateY(-50%);

          border: none;

          background: transparent;

          color: #5279c4;

          font-size: 12px;

          font-weight: 600;

          cursor: pointer;
        }


        .patient-show-password:hover {
          color: #315db1;
        }


        /* =====================================================
           PASSWORD REQUIREMENTS
        ===================================================== */

        .patient-password-requirements {
          display: grid;

          grid-template-columns: 1fr 1fr;

          gap: 6px 16px;

          margin-top: 3px;

          padding: 8px 2px 0;
        }


        .patient-password-requirements .requirement {
          font-size: 11px;

          line-height: 1.4;

          color: #8ba0b7;

          transition: color 0.15s ease;
        }


        .patient-password-requirements .requirement.valid {
          color: #278a5b;

          font-weight: 600;
        }


        /* =====================================================
           ERROR
        ===================================================== */

        .patient-error {
          display: flex;

          align-items: flex-start;

          gap: 9px;

          padding: 11px 13px;

          border:
            1px solid #f1d0cd;

          border-radius: 9px;

          background: #fff5f4;

          color: #a53b35;
        }


        .patient-error span {
          width: 18px;

          height: 18px;

          display: flex;

          align-items: center;

          justify-content: center;

          flex-shrink: 0;

          border-radius: 50%;

          background: #f6d9d6;

          font-size: 11px;

          font-weight: 800;
        }


        .patient-error p {
          margin: 0;

          font-size: 12px;

          line-height: 1.45;
        }


        /* =====================================================
           MAIN BUTTON
        ===================================================== */

        .patient-main-button {
          width: 100%;

          height: 54px;

          margin-top: 1px;

          border: none;

          border-radius: 9px;

          background:
            linear-gradient(
              90deg,
              #4a7dfc,
              #5f87ff
            );

          color: #ffffff;

          font-size: 14px;

          font-weight: 650;

          cursor: pointer;

          box-shadow:
            0 8px 20px
            rgba(74,125,252,0.22);

          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            opacity 0.18s ease;
        }


        .patient-main-button:hover:not(:disabled) {
          transform: translateY(-2px);

          box-shadow:
            0 11px 25px
            rgba(74,125,252,0.28);
        }


        .patient-main-button:disabled {
          opacity: 0.65;

          cursor: not-allowed;
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

        .patient-google-button > div {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .patient-google-loading {
          width: 100%;
          height: 44px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #d5e1f0;
          border-radius: 8px;
          background: #f9fbff;
          color: #607c9c;
          font-size: 13px;
          font-weight: 600;
        }


        /* =====================================================
           FORGOT PASSWORD
        ===================================================== */

        .patient-forgot-password {
          display: block;

          width: 100%;

          margin: 14px 0 5px;

          border: none;

          background: transparent;

          color: #3f65c8;

          font-size: 13px;

          font-weight: 700;

          cursor: pointer;

          text-align: right;
        }


        .patient-forgot-password:disabled {
          opacity: 0.6;

          cursor: not-allowed;
        }


        /* =====================================================
           REGISTER / LOGIN AREA
        ===================================================== */

        .patient-toggle-area {
          margin-top: 25px;
        }


        .patient-toggle-line {
          display: flex;

          align-items: center;

          gap: 12px;

          margin-bottom: 11px;
        }


        .patient-toggle-line span {
          flex: 1;

          height: 1px;

          background: #e1e8f2;
        }


        .patient-toggle-line p {
          margin: 0;

          white-space: nowrap;

          font-size: 11px;

          color: #91a5bc;
        }


        .patient-register-button {
          width: 100%;

          height: 46px;

          border:
            1px solid #d5e1f0;

          border-radius: 9px;

          background: #f9fbff;

          color: #4a7dfc;

          font-size: 13px;

          font-weight: 600;

          cursor: pointer;

          transition: all 0.18s ease;
        }


        .patient-register-button:hover:not(:disabled) {
          background: #eef3ff;

          border-color: #9db7f5;
        }


        /* =====================================================
           DOCTOR / PHYSIOTHERAPIST LINK
        ===================================================== */

        .patient-doctor-link {
          margin-top: 14px;

          text-align: center;
        }


        .patient-doctor-link button {
          border: none;

          background: transparent;

          color: #6f8ba8;

          font-size: 11px;

          cursor: pointer;

          padding: 4px 6px;
        }


        .patient-doctor-link button:hover {
          color: #4a7dfc;
        }


        /* =====================================================
           ADMIN PORTAL
        ===================================================== */

        .patient-admin-button {
          width: 100%;

          height: 40px;

          margin-top: 8px;

          border:
            1px solid #dce4ef;

          border-radius: 8px;

          background: #ffffff;

          color: #607c9c;

          font-size: 11px;

          font-weight: 600;

          cursor: pointer;

          transition: all 0.18s ease;
        }


        .patient-admin-buttonn {
          width: 100%;

          height: 40px;

          margin-top: 8px;

          border:
            1px solid #dce4ef;

          border-radius: 8px;

          background: #ffffff;

          color: #607c9c;

          font-size: 11px;

          font-weight: 600;

          cursor: pointer;

          transition: all 0.18s ease;
        }


        .patient-admin-button:hover {
          background: #f5f8fd;

          border-color: #b8c9df;

          color: #365e91;
        }


        .patient-admin-buttonn:hover {
          background: #f5f8fd;

          border-color: #b8c9df;

          color: #366d91;
        }


        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 760px) {

          .patient-auth-page {
            padding: 25px;
          }


          .patient-auth-card {
            max-width: 650px;
          }


          .patient-form-side {
            padding: 45px 50px;
          }


          .patient-form-content h1 {
            font-size: 34px;
          }

        }


        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 600px) {

          .patient-auth-page {
            min-height: 100dvh;

            padding: 15px;

            align-items: flex-start;

            background: #edf3ff;
          }


          .patient-auth-card {
            display: block;

            width: 100%;

            max-width: 500px;

            min-height: auto;

            margin: auto;

            border-radius: 18px;
          }


          .patient-form-side {
            width: 100%;

            padding: 34px 27px 30px;
          }


          .patient-brand {
            margin-bottom: 31px;
          }


          .patient-form-content {
            max-width: none;
          }


          .patient-form-content h1 {
            font-size: 30px;
          }


          .patient-description {
            margin-bottom: 27px;

            font-size: 13px;
          }


          .patient-field input {
            height: 52px;
          }


          .patient-main-button {
            height: 52px;
          }


          .patient-password-requirements {
            grid-template-columns: 1fr;
          }

        }
          .patient-input-wrapper {
  position: relative;
  width: 100%;
}

.patient-field input {
  width: 100%;
  height: 54px;

  box-sizing: border-box;

  /* Extra right padding for the Show button */
  padding: 0 75px 0 44px;

  border: 1px solid #d5e1f0;
  border-radius: 9px;

  background: #f9fbff;

  outline: none;

  color: #193b5d;
  font-size: 14px;

  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.patient-field input::placeholder {
  color: #9bb0c8;
}

.patient-field input:focus {
  border-color: #4d7df8;

  background: #ffffff;

  box-shadow:
    0 0 0 3px
    rgba(77,125,248,0.09);
}

.patient-show-password {
  position: absolute;

  right: 16px;
  top: 50%;

  transform: translateY(-50%);

  border: none;
  background: transparent;

  color: #5279c4;

  font-size: 12px;
  font-weight: 600;

  cursor: pointer;

  z-index: 5;

  padding: 4px 2px;
}

.patient-show-password:hover {
  color: #315db1;
}


        /* =====================================================
           SMALL MOBILE
        ===================================================== */

        @media (max-width: 380px) {

          .patient-auth-page {
            padding: 8px;
          }


          .patient-form-side {
            padding: 28px 18px 25px;
          }


          .patient-brand {
            margin-bottom: 25px;
          }


          .patient-form-content h1 {
            font-size: 28px;
          }


          .patient-field input {
            height: 48px;
          }


          .patient-main-button {
            height: 48px;
          }

        }

      `}</style>

    </div>
  );
};

const AuthScreen = () => {
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
      <PatientAuthScreen />
    </GoogleOAuthProvider>
  );
};

export default AuthScreen;