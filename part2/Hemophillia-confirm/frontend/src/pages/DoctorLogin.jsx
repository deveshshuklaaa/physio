import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../apiClient";

const DoctorLogin = () => {
  const [doctorId, setDoctorId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);


  const navigate = useNavigate();

  // =========================================================
  // LOGIN
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await api.post("/doctor/login", {
        professionalId: doctorId.trim(),
        password,
      });

      if (res.data?.requiresOtp) {
  navigate(
    "/verify-otp",
    {
      state: {
        challengeId:
          res.data.challengeId,

        role:
          res.data.role ||
          "doctor",

        maskedEmail:
          res.data.maskedEmail,

        user:
          res.data.user || null,
      },

      replace: true,
    }
  );

  return;
}

      const { token, user } = res.data;

      // Save authentication
      localStorage.setItem("staffAuthToken", token);

      localStorage.setItem(
        "staffUser",
        JSON.stringify(user)
      );

      // Set authorization header
      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      // =====================================================
      // FIRST LOGIN
      // =====================================================

      if (user.mustChangePassword === true) {
        localStorage.setItem(
          "professionalId",
          doctorId.trim()
        );

        navigate("/doctor-change-password");
        return;
      }

      // =====================================================
      // NORMAL LOGIN
      // =====================================================

      navigate("/doctor-dashboard");

    } catch (err) {
      console.error("Doctor login error:", err);

      setError(
        err.response?.data?.message ||
          "Invalid Doctor ID or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doctor-login-page">

      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <div className="doctor-login-card">

        {/* ===================================================
            LEFT SIDE - LOGIN
        =================================================== */}

        <div className="doctor-login-left">

          {/* Logo */}

          <div className="login-brand">

            <div className="brand-logo">
              +
            </div>

            <div className="brand-text">
              <h3>Hemophilia Care</h3>
              <span>Clinical Platform</span>
            </div>

          </div>

          {/* Heading */}

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

            {/* Doctor ID */}

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
                    setDoctorId(e.target.value)
                  }
                  required
                />

              </div>

            </div>

            {/* Password */}

            <div className="form-group">

  <label>
    Password
  </label>

  <div className="input-container">

    <div className="input-symbol password-symbol">
      ●
    </div>

    <input
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Enter password"
      minLength={8}
      required
      autoComplete="new-password"
    />

    <button
      type="button"
      className="show-password-btn"
      onClick={() => setShowPassword(!showPassword)}
    >
      {showPassword ? "Hide" : "Show"}
    </button>

  </div>

  

</div>

            {/* Error */}

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

            {/* Login */}

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
              SIGN UP
          ================================================= */}

          <div className="signup-area">

            <div className="signup-divider">
              <span></span>
              <p>New Physiotherapist?</p>
              <span></span>
            </div>

            <button
              type="button"
              className="register-button"
              onClick={() =>
                navigate("/doctor-registration")
              }
            >
              Register for an Account
              <span>→</span>
            </button>

          </div>

          {/* =================================================
              BACK TO PATIENT
          ================================================= */}

          <button
            type="button"
            className="patient-back-button"
            onClick={() => navigate("/")}
          >
            ← Back to Patient Login
          </button>

        </div>


        {/* ===================================================
            RIGHT SIDE - VISUAL PANEL
        =================================================== */}

        <div className="doctor-login-right">

          {/* Decorative circles */}

          <div className="decor-circle circle-one"></div>
          <div className="decor-circle circle-two"></div>
          <div className="decor-circle circle-three"></div>

          {/* Medical cross */}

          <div className="large-cross">
            +
          </div>

          {/* Content */}

          <div className="right-panel-content">

            <div className="secure-tag">
              <span className="secure-dot">
                ✓
              </span>

              Secure Clinical Access
            </div>

            <h2>
              Caring for Patients.
              <br />
              <span>Connecting Care.</span>
            </h2>

            <p>
              Access patient information, clinical
              insights and healthcare tools through
              one secure platform.
            </p>

            {/* Features */}

            <div className="feature-list">

              <div className="feature-item">

                <div className="feature-icon">
                  ✓
                </div>

                <div>
                  <strong>
                    Secure Access
                  </strong>

                  <span>
                    Protected clinical information
                  </span>
                </div>

              </div>


              <div className="feature-item">

                <div className="feature-icon">
                  ✓
                </div>

                <div>
                  <strong>
                    Patient Care
                  </strong>

                  <span>
                    Manage connected patient care
                  </span>
                </div>

              </div>


              <div className="feature-item">

                <div className="feature-icon">
                  ✓
                </div>

                <div>
                  <strong>
                    Clinical Workspace
                  </strong>

                  <span>
                    Tools designed for healthcare teams
                  </span>
                </div>

              </div>

            </div>

          </div>

          {/* Bottom decoration */}

          <div className="bottom-wave"></div>

        </div>

      </div>


      {/* =====================================================
          STYLES
      ===================================================== */}

      <style>{`

        /* ===================================================
           PAGE
        =================================================== */

        .doctor-login-page {
          min-height: 100vh;
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 35px;

          box-sizing: border-box;

          background:
            linear-gradient(
              135deg,
              #f3f7ff 0%,
              #edf3ff 45%,
              #f7f9ff 100%
            );

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }


        /* ===================================================
           CARD
        =================================================== */

        .doctor-login-card {
          width: 100%;
          max-width: 980px;

          min-height: 570px;

          display: flex;

          overflow: hidden;

          background: white;

          border-radius: 24px;

          box-shadow:
            0 25px 80px
            rgba(42, 73, 125, 0.14);

          border:
            1px solid #e5edf8;
        }


        /* ===================================================
           LEFT
        =================================================== */

        .doctor-login-left {
          width: 55%;

          padding: 45px 55px;

          box-sizing: border-box;

          display: flex;

          flex-direction: column;

          justify-content: center;

          background: white;
        }

        .input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-container input {
  width: 100%;
  padding-right: 70px;
}

.show-password-btn {
  position: absolute;
  right: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.password-requirements {
  margin-top: 8px;
  font-size: 12px;
}

.password-requirements small {
  font-weight: 600;
}

.password-requirements ul {
  margin: 5px 0 0 18px;
  padding: 0;
}

.password-requirements li {
  margin-bottom: 3px;
}

.password-requirements li.valid {
  color: green;
}

.password-requirements li.valid::before {
  content: "✓ ";
}


        /* ===================================================
           BRAND
        =================================================== */

        .login-brand {
          display: flex;

          align-items: center;

          gap: 11px;

          margin-bottom: 35px;
        }

        .brand-logo {
          width: 39px;
          height: 39px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 10px;

          background:
            linear-gradient(
              135deg,
              #4b7cfb,
              #657fff
            );

          color: white;

          font-size: 25px;

          font-weight: 400;

          box-shadow:
            0 8px 20px
            rgba(75,124,251,0.22);
        }

        .brand-text h3 {
          margin: 0;

          color: #163b63;

          font-size: 15px;

          font-weight: 700;
        }

        .brand-text span {
          display: block;

          margin-top: 2px;

          color: #91a4ba;

          font-size: 8px;

          font-weight: 600;

          letter-spacing: 1.1px;

          text-transform: uppercase;
        }


        /* ===================================================
           HEADING
        =================================================== */

        .login-heading {
          margin-bottom: 27px;
        }

        .login-heading h1 {
          margin: 0 0 7px;

          color: #163b63;

          font-size: 29px;

          font-weight: 650;

          letter-spacing: -0.5px;
        }

        .login-heading p {
          margin: 0;

          color: #7890a9;

          font-size: 12px;

          line-height: 1.6;

          max-width: 360px;
        }


        /* ===================================================
           FORM
        =================================================== */

        .form-group {
          margin-bottom: 17px;
        }

        .form-group label {
          display: block;

          margin-bottom: 7px;

          color: #345a7d;

          font-size: 11px;

          font-weight: 600;
        }

        .input-container {
          width: 100%;

          height: 47px;

          display: flex;

          align-items: center;

          border:
            1px solid #dbe5f1;

          border-radius: 8px;

          background: #f9fbff;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;

          box-sizing: border-box;
        }

        .input-container:focus-within {
          background: white;

          border-color: #4a7dfc;

          box-shadow:
            0 0 0 3px
            rgba(74,125,252,0.08);
        }

        .input-symbol {
          width: 43px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #7894b0;

          font-size: 9px;

          font-weight: 700;
        }

        .password-symbol {
          font-size: 8px;

          letter-spacing: 1px;
        }

        .input-container input {
          width: 100%;
          height: 100%;

          border: none;

          outline: none;

          background: transparent;

          color: #163b63;

          font-size: 12px;

          padding: 0 14px 0 0;

          box-sizing: border-box;
        }

        .input-container input::placeholder {
          color: #a4b4c6;
        }


        /* ===================================================
           ERROR
        =================================================== */

        .login-error {
          display: flex;

          align-items: center;

          gap: 8px;

          margin-bottom: 12px;

          padding: 10px 11px;

          border-radius: 7px;

          background: #fff4f4;

          border: 1px solid #ffd7d7;

          color: #c62828;

          font-size: 11px;

          line-height: 1.4;
        }

        .error-circle {
          width: 17px;
          height: 17px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #d93025;

          color: white;

          font-size: 10px;

          font-weight: 700;
        }


        /* ===================================================
           LOGIN BUTTON
        =================================================== */

        .login-button {
          width: 100%;

          height: 47px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 11px;

          border: none;

          border-radius: 8px;

          background:
            linear-gradient(
              90deg,
              #4a7dfc,
              #5f82ff
            );

          color: white;

          font-size: 12px;

          font-weight: 600;

          cursor: pointer;

          transition: 0.2s ease;
        }

        .login-button:hover {
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
          font-size: 16px;

          line-height: 1;
        }


        /* ===================================================
           LOADING
        =================================================== */

        .loading-spinner {
          width: 14px;
          height: 14px;

          border:
            2px solid
            rgba(255,255,255,0.4);

          border-top-color: white;

          border-radius: 50%;

          animation:
            doctor-spin 0.7s linear infinite;
        }

        @keyframes doctor-spin {
          to {
            transform: rotate(360deg);
          }
        }


        /* ===================================================
           SIGN UP
        =================================================== */

        .signup-area {
          margin-top: 20px;
        }

        .signup-divider {
          display: flex;

          align-items: center;

          gap: 9px;

          margin-bottom: 11px;
        }

        .signup-divider span {
          flex: 1;

          height: 1px;

          background: #e8edf4;
        }

        .signup-divider p {
          margin: 0;

          color: #94a5b7;

          font-size: 9px;

          white-space: nowrap;
        }

        .register-button {
          width: 100%;

          height: 42px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 8px;

          border:
            1px solid #d8e4f4;

          border-radius: 8px;

          background: #f8faff;

          color: #4a7dfc;

          font-size: 11px;

          font-weight: 600;

          cursor: pointer;

          transition: 0.2s ease;
        }

        .register-button span {
          font-size: 15px;
        }

        .register-button:hover {
          background: #f0f5ff;

          border-color: #bcd0ee;

          transform: translateY(-1px);
        }


        /* ===================================================
           PATIENT LOGIN
        =================================================== */

        .patient-back-button {
          align-self: center;

          margin-top: 17px;

          border: none;

          background: transparent;

          color: #8195aa;

          font-size: 10px;

          cursor: pointer;

          transition: 0.2s ease;
        }

        .patient-back-button:hover {
          color: #4a7dfc;

          text-decoration: underline;
        }


        /* ===================================================
           RIGHT PANEL
        =================================================== */

        .doctor-login-right {
          width: 45%;

          position: relative;

          overflow: hidden;

          display: flex;

          align-items: center;

          justify-content: center;

          background:
            linear-gradient(
              145deg,
              #416ff0 0%,
              #526ff4 45%,
              #716de9 100%
            );

          color: white;
        }


        /* ===================================================
           DECORATIVE CIRCLES
        =================================================== */

        .decor-circle {
          position: absolute;

          border-radius: 50%;

          border:
            1px solid
            rgba(255,255,255,0.16);
        }

        .circle-one {
          width: 380px;
          height: 380px;

          top: -170px;
          right: -130px;
        }

        .circle-two {
          width: 280px;
          height: 280px;

          bottom: -130px;
          left: -120px;
        }

        .circle-three {
          width: 170px;
          height: 170px;

          bottom: 60px;
          right: -75px;

          background:
            rgba(255,255,255,0.035);
        }


        /* ===================================================
           LARGE MEDICAL CROSS
        =================================================== */

        .large-cross {
          position: absolute;

          right: 35px;
          top: 25px;

          color:
            rgba(255,255,255,0.09);

          font-size: 150px;

          line-height: 1;

          font-weight: 200;

          transform: rotate(-10deg);
        }


        /* ===================================================
           RIGHT CONTENT
        =================================================== */

        .right-panel-content {
          position: relative;

          z-index: 3;

          width: 100%;

          max-width: 300px;

          padding: 40px;

          box-sizing: border-box;
        }


        /* ===================================================
           SECURE TAG
        =================================================== */

        .secure-tag {
          display: inline-flex;

          align-items: center;

          gap: 7px;

          padding: 7px 11px;

          border-radius: 20px;

          background:
            rgba(255,255,255,0.14);

          border:
            1px solid
            rgba(255,255,255,0.16);

          color: rgba(255,255,255,0.95);

          font-size: 9px;

          font-weight: 600;

          backdrop-filter: blur(5px);
        }

        .secure-dot {
          width: 16px;
          height: 16px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: rgba(255,255,255,0.95);

          color: #4a75ef;

          font-size: 9px;
        }


        /* ===================================================
           RIGHT HEADING
        =================================================== */

        .right-panel-content h2 {
          margin: 23px 0 12px;

          color: white;

          font-size: 27px;

          line-height: 1.25;

          font-weight: 650;

          letter-spacing: -0.4px;
        }

        .right-panel-content h2 span {
          color: #dce6ff;
        }

        .right-panel-content > p {
          margin: 0;

          color:
            rgba(255,255,255,0.78);

          font-size: 11px;

          line-height: 1.7;
        }


        /* ===================================================
           FEATURES
        =================================================== */

        .feature-list {
          margin-top: 27px;

          display: flex;

          flex-direction: column;

          gap: 15px;
        }

        .feature-item {
          display: flex;

          align-items: center;

          gap: 11px;
        }

        .feature-icon {
          width: 27px;
          height: 27px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 8px;

          background:
            rgba(255,255,255,0.14);

          border:
            1px solid
            rgba(255,255,255,0.12);

          color: white;

          font-size: 10px;

          font-weight: 700;
        }

        .feature-item strong {
          display: block;

          color: white;

          font-size: 10px;

          font-weight: 600;

          margin-bottom: 2px;
        }

        .feature-item span {
          display: block;

          color:
            rgba(255,255,255,0.62);

          font-size: 9px;
        }


        /* ===================================================
           BOTTOM DECORATION
        =================================================== */

        .bottom-wave {
          position: absolute;

          bottom: -130px;
          left: -40px;

          width: 430px;
          height: 220px;

          border-radius: 50%;

          background:
            rgba(255,255,255,0.055);

          transform: rotate(-8deg);
        }


        /* ===================================================
           TABLET
        =================================================== */

        @media (max-width: 850px) {

          .doctor-login-page {
            padding: 20px;
          }

          .doctor-login-card {
            max-width: 560px;

            min-height: auto;
          }

          .doctor-login-left {
            width: 100%;

            padding: 45px;
          }

          .doctor-login-right {
            display: none;
          }

        }


        /* ===================================================
           MOBILE
        =================================================== */

        @media (max-width: 550px) {

          .doctor-login-page {
            min-height: 100vh;

            padding: 12px;

            align-items: flex-start;
          }

          .doctor-login-card {
            margin: auto 0;

            border-radius: 20px;
          }

          .doctor-login-left {
            padding: 32px 22px;
          }

          .login-brand {
            margin-bottom: 29px;
          }

          .login-heading h1 {
            font-size: 27px;
          }

          .login-heading p {
            font-size: 11px;
          }

          .input-container {
            height: 49px;
          }

          .input-container input {
            font-size: 13px;
          }

          .login-button {
            height: 49px;

            font-size: 13px;
          }

          .register-button {
            height: 45px;

            font-size: 11px;
          }

        }

      `}</style>

    </div>
  );
};

export default DoctorLogin;