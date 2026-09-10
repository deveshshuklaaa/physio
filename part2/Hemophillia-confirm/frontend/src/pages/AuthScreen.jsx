

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../apiClient";

const AuthScreen = () => {
  const [mode, setMode] = useState("login");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // =========================================================
  // LOGIN / REGISTER
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
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
                disabled={loading}
              >

                {loading
                  ? "Please wait..."
                  : mode === "login"
                  ? "Sign In   →"
                  : "Create Account   →"}

              </button>

            </form>


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

export default AuthScreen;