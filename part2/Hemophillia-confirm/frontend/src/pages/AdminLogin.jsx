import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../apiClient";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/admin/login", {
        email,
        password,
      });

      console.log("ADMIN LOGIN RESPONSE:", response.data);

      if (!response.data?.success) {
        setError(
          response.data?.message ||
            "Unable to login as administrator."
        );
        return;
      }

      // =================================================
      // SAVE ADMIN AUTH
      // =================================================

      // localStorage.setItem(
      //   "adminToken",
      //   response.data.token
      // );

      // localStorage.setItem(
      //   "admin",
      //   JSON.stringify(response.data.admin)
      // );

      // // =================================================
      // // NAVIGATE
      // // =================================================

      // navigate("/admin/dashboard", {
      //   replace: true,
      // });
      // =================================================
// OTP VERIFICATION REQUIRED
// =================================================

if (response.data?.requiresOtp) {

  navigate(
    "/verify-otp",
    {
      state: {
        challengeId:
          response.data.challengeId,

        role: "admin",

        maskedEmail:
          response.data.maskedEmail,
      },

      replace: true,
    }
  );

  return;
}

    } catch (err) {
      console.error("ADMIN LOGIN ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to login. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="admin-login-page">

      <div className="admin-login-card">

        {/* LEFT */}

        <div className="admin-login-brand">

          <div className="admin-brand-content">

            <div className="admin-logo">
              ✚
            </div>

            <p className="admin-eyebrow">
              HEMOPHILIA CARE
            </p>

            <h1>
              Administration
              <br />
              Portal
            </h1>

            <p className="admin-brand-description">
              Secure administrative access for reviewing
              healthcare professional registrations and
              managing platform access.
            </p>

            <div className="admin-security-note">
              <span>✓</span>

              <p>
                Access to this portal is restricted to
                authorized administrators.
              </p>
            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="admin-login-form-section">

          <div className="admin-form-wrapper">

            <div className="admin-mobile-logo">
              ✚
            </div>

            <p className="admin-form-label">
              ADMIN ACCESS
            </p>

            <h2>Welcome back</h2>

            <p className="admin-form-subtitle">
              Sign in with your administrator credentials
              to continue.
            </p>

            <form
              onSubmit={handleSubmit}
              className="admin-form"
            >

              {/* EMAIL */}

              <div className="admin-field">

                <label htmlFor="admin-email">
                  Email address
                </label>

                <input
                  id="admin-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@hemophiliacare.com"
                  autoComplete="email"
                  disabled={loading}
                />

              </div>

              {/* PASSWORD */}

              <div className="admin-field">

                <label htmlFor="admin-password">
                  Password
                </label>

                <div className="admin-password-wrapper">

                  <input
                    id="admin-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (prev) => !prev
                      )
                    }
                    disabled={loading}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>

                </div>

              </div>

              {/* ERROR */}

              {error && (
                <div className="admin-error">
                  <span>!</span>

                  <p>{error}</p>
                </div>
              )}

              {/* LOGIN */}

              <button
                type="submit"
                className="admin-login-button"
                disabled={loading}
              >
                {loading
                  ? "Signing in..."
                  : "Sign in to Admin Portal"}
              </button>

              <button
                type="button"
                className="patient-admin-buttonn"
                onClick={() =>
                  navigate(
                    "/doctor-login"
                  )
                }
              >
                Physiotherapist Login
              </button>
              <button
                type="button"
                className="patient-back-button"
                onClick={() => navigate("/")}
              >
                Patient Login
              </button>

            </form>

            <div className="admin-login-footer">
              Hemophilia Diagnosis & Care Platform
            </div>

          </div>

        </div>

      </div>

      <style>{`

        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          margin: 0;
          width: 100%;
          min-height: 100%;
        }

        .admin-login-page {
          min-height: 100vh;
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 32px;

          background:
            radial-gradient(
              circle at 10% 10%,
              rgba(54, 82, 190, 0.08),
              transparent 35%
            ),
            #f4f6fa;

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          color: #172033;
        }

        .patient-back-button , .patient-admin-buttonn{
          width: 100%;
          height: 49px;

          margin-top: 3px;

          border: none;

          border-radius: 10px;

          background:
            linear-gradient(
              135deg,
              #4e69e6,
              #354ba8
            );

          color: white;

          font-size: 14px;
          font-weight: 650;

          cursor: pointer;

          box-shadow:
            0 8px 20px
            rgba(40,58,148,0.18);

          transition:
            transform 0.15s ease,
            box-shadow 0.15s ease,
            opacity 0.15s ease;
        }

        .patient-back-button:hover {
          background-color: blue;

          text-decoration: underline;
        }

        .admin-login-card {
          width: 100%;
          max-width: 1050px;
          min-height: 610px;

          display: grid;
          grid-template-columns: 0.9fr 1.1fr;

          background: #ffffff;

          border:
            1px solid #e0e5ef;

          border-radius: 22px;

          overflow: hidden;

          box-shadow:
            0 24px 70px
            rgba(27, 39, 94, 0.1);
        }

        /* =============================================
           LEFT
           ============================================= */

        .admin-login-brand {
          position: relative;

          display: flex;
          align-items: center;

          padding: 60px;

          background:
            linear-gradient(
              145deg,
              #202c80 0%,
              #273899 55%,
              #3148ad 100%
            );

          color: white;

          overflow: hidden;
        }

        .admin-login-brand::before {
          content: "";

          position: absolute;

          width: 330px;
          height: 330px;

          border:
            1px solid
            rgba(255,255,255,0.08);

          border-radius: 50%;

          top: -170px;
          right: -150px;
        }

        .admin-login-brand::after {
          content: "";

          position: absolute;

          width: 240px;
          height: 240px;

          border:
            1px solid
            rgba(255,255,255,0.07);

          border-radius: 50%;

          bottom: -120px;
          left: -100px;
        }

        .admin-brand-content {
          position: relative;
          z-index: 2;

          max-width: 380px;
        }

        .admin-logo,
        .admin-mobile-logo {
          width: 52px;
          height: 52px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 14px;

          font-size: 26px;
          font-weight: 700;
        }

        .admin-logo {
          margin-bottom: 32px;

          background:
            rgba(255,255,255,0.12);

          border:
            1px solid
            rgba(255,255,255,0.16);

          color: white;
        }

        .admin-eyebrow {
          margin:
            0 0 14px;

          font-size: 12px;
          font-weight: 700;

          letter-spacing: 2px;

          color:
            rgba(255,255,255,0.68);
        }

        .admin-brand-content h1 {
          margin: 0;

          font-size:
            clamp(34px, 4vw, 48px);

          line-height: 1.08;

          letter-spacing: -1.4px;

          font-weight: 700;
        }

        .admin-brand-description {
          margin:
            25px 0 0;

          font-size: 15px;

          line-height: 1.75;

          color:
            rgba(255,255,255,0.75);
        }

        .admin-security-note {
          display: flex;
          align-items: flex-start;

          gap: 11px;

          margin-top: 42px;

          padding-top: 25px;

          border-top:
            1px solid
            rgba(255,255,255,0.12);
        }

        .admin-security-note span {
          width: 22px;
          height: 22px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background:
            rgba(255,255,255,0.12);

          font-size: 11px;
        }

        .admin-security-note p {
          margin: 0;

          font-size: 12.5px;

          line-height: 1.6;

          color:
            rgba(255,255,255,0.65);
        }

        /* =============================================
           FORM SIDE
           ============================================= */

        .admin-login-form-section {
          display: flex;
          align-items: center;
          justify-content: center;

          padding: 60px 70px;
        }

        .admin-form-wrapper {
          width: 100%;
          max-width: 400px;
        }

        .admin-mobile-logo {
          display: none;

          margin-bottom: 25px;

          background: #eef1fb;
          color: #24328f;
        }

        .admin-form-label {
          margin: 0 0 10px;

          font-size: 11px;
          font-weight: 700;

          letter-spacing: 1.6px;

          color: #31449d;
        }

        .admin-form-wrapper h2 {
          margin: 0;

          font-size: 31px;

          letter-spacing: -0.7px;

          color: #18213a;
        }

        .admin-form-subtitle {
          margin:
            10px 0 32px;

          font-size: 14px;

          line-height: 1.6;

          color: #737d91;
        }

        .admin-form {
          display: flex;
          flex-direction: column;

          gap: 21px;
        }

        .admin-field {
          display: flex;
          flex-direction: column;

          gap: 8px;
        }

        .admin-field label {
          font-size: 13px;
          font-weight: 600;

          color: #303a4f;
        }

        .admin-field input {
          width: 100%;
          height: 48px;

          padding:
            0 15px;

          border:
            1px solid #d8deea;

          border-radius: 10px;

          outline: none;

          background: #ffffff;

          color: #172033;

          font-size: 14px;

          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .admin-field input::placeholder {
          color: #a4adbc;
        }

        .admin-field input:focus {
          border-color: #3449a4;

          box-shadow:
            0 0 0 3px
            rgba(52,73,164,0.1);
        }

        .admin-password-wrapper {
          position: relative;
        }

        .admin-password-wrapper input {
          padding-right: 70px;
        }

        .password-toggle {
          position: absolute;

          top: 50%;
          right: 13px;

          transform:
            translateY(-50%);

          padding: 5px;

          border: none;
          background: transparent;

          color: #4658a6;

          font-size: 12px;
          font-weight: 600;

          cursor: pointer;
        }

        .admin-error {
          display: flex;
          align-items: flex-start;

          gap: 9px;

          padding:
            11px 13px;

          background: #fff3f2;

          border:
            1px solid #f2d2cf;

          border-radius: 9px;

          color: #a53832;
        }

        .admin-error span {
          font-weight: 800;
        }

        .admin-error p {
          margin: 0;

          font-size: 12.5px;

          line-height: 1.5;
        }

        .admin-login-button {
          width: 100%;
          height: 49px;

          margin-top: 3px;

          border: none;

          border-radius: 10px;

          background:
            linear-gradient(
              135deg,
              #283a94,
              #354ba8
            );

          color: white;

          font-size: 14px;
          font-weight: 650;

          cursor: pointer;

          box-shadow:
            0 8px 20px
            rgba(40,58,148,0.18);

          transition:
            transform 0.15s ease,
            box-shadow 0.15s ease,
            opacity 0.15s ease;
        }

        .admin-login-button:hover:not(:disabled) {
          transform:
            translateY(-1px);

          box-shadow:
            0 11px 24px
            rgba(40,58,148,0.24);
        }

        .admin-login-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .admin-login-footer {
          margin-top: 31px;

          padding-top: 21px;

          border-top:
            1px solid #edf0f5;

          text-align: center;

          font-size: 11.5px;

          color: #9aa2b2;
        }

        /* =============================================
           TABLET
           ============================================= */

        @media (max-width: 900px) {

          .admin-login-page {
            padding: 25px;
          }

          .admin-login-card {
            grid-template-columns:
              0.8fr 1.2fr;
          }

          .admin-login-brand {
            padding: 45px 35px;
          }

          .admin-login-form-section {
            padding: 50px 40px;
          }

        }

        /* =============================================
           MOBILE
           ============================================= */

        @media (max-width: 700px) {

          .admin-login-page {
            min-height: 100dvh;

            align-items: flex-start;

            padding: 18px;

            background: #f4f6fa;
          }

          .admin-login-card {
            display: block;

            min-height: auto;

            margin:
              auto 0;

            border-radius: 18px;
          }

          .admin-login-brand {
            display: none;
          }

          .admin-login-form-section {
            padding:
              38px 25px 30px;
          }

          .admin-mobile-logo {
            display: flex;
          }

          .admin-form-wrapper {
            max-width: none;
          }

          .admin-form-wrapper h2 {
            font-size: 27px;
          }

        }

        @media (max-width: 380px) {

          .admin-login-page {
            padding: 10px;
          }

          .admin-login-form-section {
            padding:
              30px 18px 24px;
          }

          .admin-field input {
            height: 46px;
          }

        }

      `}</style>

    </div>
  );
};

export default AdminLogin;