import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../apiClient";

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const roleInfo = {
  patient: {
    title: "Forgot Patient Password",
    subtitle:
      "Enter your registered email address to receive a verification code.",
    fieldLabel: "Registered Email Address",
    placeholder: "Enter your email address",
    loginPath: "/",
  },

  doctor: {
    title: "Forgot Doctor Password",
    subtitle:
      "Enter your Doctor / Clinician ID. The verification code will be sent to your registered email address.",
    fieldLabel: "Doctor / Clinician ID",
    placeholder: "Enter your professional ID",
    loginPath: "/doctor-login",
  },

  admin: {
    title: "Forgot Admin Password",
    subtitle:
      "Enter your administrator email address to receive a verification code.",
    fieldLabel: "Registered Email Address",
    placeholder: "Enter your admin email address",
    loginPath: "/admin-login",
  },
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] =
    useSearchParams();

  const requestedRole =
    searchParams.get("role") || "patient";

  const role = roleInfo[requestedRole]
    ? requestedRole
    : "patient";

  const info = roleInfo[role];

  const [step, setStep] =
    useState("request");

  const [identifier, setIdentifier] =
    useState("");

  const [challengeId, setChallengeId] =
    useState("");

  const [maskedEmail, setMaskedEmail] =
    useState("");

  const [otp, setOtp] = useState("");

  const [resetToken, setResetToken] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [secondsLeft, setSecondsLeft] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const isPasswordValid =
    PASSWORD_REGEX.test(newPassword);

  const requirements = useMemo(
    () => [
      {
        label: "At least 8 characters",
        valid:
          newPassword.length >= 8,
      },
      {
        label: "One uppercase letter",
        valid: /[A-Z]/.test(
          newPassword
        ),
      },
      {
        label: "One lowercase letter",
        valid: /[a-z]/.test(
          newPassword
        ),
      },
      {
        label: "One number",
        valid: /\d/.test(
          newPassword
        ),
      },
      {
        label: "One special character",
        valid: /[^A-Za-z0-9]/.test(
          newPassword
        ),
      },
    ],
    [newPassword]
  );

  useEffect(() => {
    if (secondsLeft <= 0) {
      return undefined;
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

  const formatTime = () => {
    const minutes =
      Math.floor(secondsLeft / 60);

    const seconds =
      secondsLeft % 60;

    return `${minutes}:${String(
      seconds
    ).padStart(2, "0")}`;
  };

  const handleRequestOTP =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      const value =
        identifier.trim();

      if (!value) {
        setError(
          role === "doctor"
            ? "Please enter your Doctor / Clinician ID."
            : "Please enter your registered email address."
        );
        return;
      }

      if (
        role !== "doctor" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          value
        )
      ) {
        setError(
          "Please enter a valid email address."
        );
        return;
      }

      try {
        setLoading(true);

        const payload =
          role === "doctor"
            ? {
                role,
                professionalId:
                  value,
              }
            : {
                role,
                email: value,
              };

        const response =
          await api.post(
            "/password-reset/request",
            payload
          );

        if (
          response.data?.success &&
          response.data?.challengeId
        ) {
          setChallengeId(
            response.data.challengeId
          );

          setMaskedEmail(
            response.data.maskedEmail ||
              ""
          );

          setSecondsLeft(
            response.data
              .expiresInSeconds ||
              300
          );

          setStep("otp");
          return;
        }

        setSuccess(
          response.data?.message ||
            "If the account exists, a verification code has been sent."
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to send the verification code. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  const handleVerifyOTP =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      const cleanOTP =
        otp.replace(/\D/g, "");

      if (cleanOTP.length !== 6) {
        setError(
          "Please enter the complete 6-digit verification code."
        );
        return;
      }

      if (!challengeId) {
        setError(
          "Your reset session has expired. Please start again."
        );
        return;
      }

      try {
        setLoading(true);

        const response =
          await api.post(
            "/password-reset/verify",
            {
              challengeId,
              otp: cleanOTP,
            }
          );

        if (
          !response.data?.success ||
          !response.data?.resetToken
        ) {
          throw new Error(
            response.data?.message ||
              "OTP verification failed."
          );
        }

        setResetToken(
          response.data.resetToken
        );

        setSecondsLeft(
          response.data
            .expiresInSeconds || 600
        );

        setStep("password");
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to verify the code. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  const handleResetPassword =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      if (!isPasswordValid) {
        setError(
          "Password must be at least 8 characters and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character."
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

      if (
        !challengeId ||
        !resetToken
      ) {
        setError(
          "Your password reset session is invalid. Please start again."
        );
        return;
      }

      try {
        setLoading(true);

        const response =
          await api.post(
            "/password-reset/reset",
            {
              challengeId,
              resetToken,
              newPassword,
            }
          );

        if (
          !response.data?.success
        ) {
          throw new Error(
            response.data?.message ||
              "Password reset failed."
          );
        }

        setSuccess(
          "Password reset successfully. Redirecting to login..."
        );

        setTimeout(() => {
          navigate(
            info.loginPath,
            { replace: true }
          );
        }, 1000);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to reset the password. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  const handleBack =
    () => {
      if (step === "request") {
        navigate(
          info.loginPath
        );
        return;
      }

      setError("");
      setSuccess("");

      if (step === "password") {
        setStep("otp");
        setNewPassword("");
        setConfirmPassword("");
        return;
      }

      setStep("request");
      setOtp("");
      setChallengeId("");
      setMaskedEmail("");
      setSecondsLeft(0);
    };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>
          🔐
        </div>

        <div style={styles.eyebrow}>
          HEMOPHILIA CARE
        </div>

        <h1 style={styles.title}>
          {info.title}
        </h1>

        <p style={styles.subtitle}>
          {step === "request"
            ? info.subtitle
            : step === "otp"
            ? "Enter the 6-digit verification code sent to your registered email address."
            : "Create a new secure password for your account."}
        </p>

        {maskedEmail &&
          step === "otp" && (
            <div style={styles.emailBadge}>
              {maskedEmail}
            </div>
          )}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {success && (
          <div style={styles.success}>
            {success}
          </div>
        )}

        {step === "request" && (
          <form
            onSubmit={handleRequestOTP}
          >
            <label style={styles.label}>
              {info.fieldLabel}
            </label>

            <input
              style={styles.input}
              type={
                role === "doctor"
                  ? "text"
                  : "email"
              }
              value={identifier}
              onChange={(e) => {
                setIdentifier(
                  e.target.value
                );
                setError("");
              }}
              placeholder={
                info.placeholder
              }
              disabled={loading}
              autoFocus
              required
            />

            <button
              type="submit"
              style={styles.primaryButton}
              disabled={loading}
            >
              {loading
                ? "Sending..."
                : "Send Verification Code"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form
            onSubmit={handleVerifyOTP}
          >
            <label style={styles.label}>
              Verification Code
            </label>

            <input
              style={{
                ...styles.input,
                letterSpacing: "6px",
                textAlign: "center",
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(
                  e.target.value
                    .replace(
                      /\D/g,
                      ""
                    )
                    .slice(0, 6)
                );
                setError("");
              }}
              placeholder="000000"
              disabled={loading}
              autoFocus
              required
            />

            <button
              type="submit"
              style={styles.primaryButton}
              disabled={
                loading ||
                otp.length !== 6
              }
            >
              {loading
                ? "Verifying..."
                : "Verify Code"}
            </button>

            <div style={styles.timer}>
              Code expires in{" "}
              <strong>
                {formatTime()}
              </strong>
            </div>
          </form>
        )}

        {step === "password" && (
          <form
            onSubmit={
              handleResetPassword
            }
          >
            <label style={styles.label}>
              New Password
            </label>

            <div style={styles.passwordWrap}>
              <input
                style={styles.passwordInput}
                type={
                  showNewPassword
                    ? "text"
                    : "password"
                }
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(
                    e.target.value
                  );
                  setError("");
                }}
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={loading}
                required
              />

              <button
                type="button"
                style={styles.showButton}
                onClick={() =>
                  setShowNewPassword(
                    (previous) =>
                      !previous
                  )
                }
                disabled={loading}
              >
                {showNewPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>

            <div style={styles.requirements}>
              <div style={styles.requirementTitle}>
                Password must contain:
              </div>

              {requirements.map(
                (item) => (
                  <div
                    key={item.label}
                    style={{
                      ...styles.requirement,
                      color: item.valid
                        ? "#16805c"
                        : "#65758b",
                    }}
                  >
                    {item.valid
                      ? "✓"
                      : "○"}{" "}
                    {item.label}
                  </div>
                )
              )}
            </div>

            <label style={styles.label}>
              Confirm New Password
            </label>

            <div style={styles.passwordWrap}>
              <input
                style={styles.passwordInput}
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={
                  confirmPassword
                }
                onChange={(e) => {
                  setConfirmPassword(
                    e.target.value
                  );
                  setError("");
                }}
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={loading}
                required
              />

              <button
                type="button"
                style={styles.showButton}
                onClick={() =>
                  setShowConfirmPassword(
                    (previous) =>
                      !previous
                  )
                }
                disabled={loading}
              >
                {showConfirmPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>

            <button
              type="submit"
              style={styles.primaryButton}
              disabled={
                loading ||
                !isPasswordValid ||
                newPassword !==
                  confirmPassword
              }
            >
              {loading
                ? "Resetting..."
                : "Reset Password"}
            </button>

            <div style={styles.timer}>
              Reset session expires in{" "}
              <strong>
                {formatTime()}
              </strong>
            </div>
          </form>
        )}

        <button
          type="button"
          style={styles.backButton}
          onClick={handleBack}
          disabled={loading}
        >
          ←{" "}
          {step === "request"
            ? "Back to Login"
            : "Back"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px 20px",
    boxSizing: "border-box",
    background:
      "linear-gradient(135deg, #eef4ff 0%, #f8fbff 55%, #edf6ff 100%)",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  card: {
    width: "100%",
    maxWidth: "470px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "38px",
    boxSizing: "border-box",
    boxShadow:
      "0 20px 60px rgba(31, 62, 104, 0.14)",
  },

  icon: {
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 15px",
    background: "#eaf0fe",
    fontSize: "26px",
  },

  eyebrow: {
    textAlign: "center",
    color: "#3e65d8",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "1.4px",
  },

  title: {
    margin:
      "10px 0 8px",
    textAlign: "center",
    color: "#142b4a",
    fontSize: "28px",
  },

  subtitle: {
    margin:
      "0 auto 25px",
    maxWidth: "390px",
    textAlign: "center",
    color: "#6d7f96",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  emailBadge: {
    marginBottom: "20px",
    padding: "11px 14px",
    borderRadius: "10px",
    background: "#f3f7ff",
    color: "#3457a5",
    textAlign: "center",
    fontWeight: 700,
    fontSize: "14px",
  },

  label: {
    display: "block",
    margin:
      "0 0 8px",
    color: "#2d3d53",
    fontSize: "13px",
    fontWeight: 700,
  },

  input: {
    width: "100%",
    height: "48px",
    padding: "0 14px",
    boxSizing: "border-box",
    border:
      "1px solid #d8e0ec",
    borderRadius: "10px",
    outline: "none",
    fontSize: "14px",
    marginBottom: "18px",
  },

  passwordWrap: {
    display: "flex",
    alignItems: "center",
    border:
      "1px solid #d8e0ec",
    borderRadius: "10px",
    marginBottom: "14px",
    overflow: "hidden",
  },

  passwordInput: {
    flex: 1,
    height: "46px",
    border: "none",
    outline: "none",
    padding: "0 14px",
    fontSize: "14px",
  },

  showButton: {
    height: "46px",
    border: "none",
    background: "#ffffff",
    color: "#3f65c8",
    padding: "0 13px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 700,
  },

  requirements: {
    background: "#f5f8fc",
    border:
      "1px solid #e0e7f0",
    borderRadius: "10px",
    padding: "12px 14px",
    marginBottom: "18px",
  },

  requirementTitle: {
    color: "#40536d",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "5px",
  },

  requirement: {
    fontSize: "11px",
    lineHeight: 1.8,
  },

  primaryButton: {
    width: "100%",
    height: "48px",
    border: "none",
    borderRadius: "10px",
    background: "#4d79e8",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    marginTop: "5px",
  },

  backButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#50647f",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "17px",
  },

  timer: {
    textAlign: "center",
    color: "#75869c",
    fontSize: "12px",
    marginTop: "13px",
  },

  error: {
    background: "#fff1f1",
    border:
      "1px solid #ffcaca",
    color: "#c44747",
    padding: "11px 13px",
    borderRadius: "9px",
    fontSize: "12px",
    lineHeight: 1.5,
    marginBottom: "16px",
  },

  success: {
    background: "#eefaf5",
    border:
      "1px solid #bfe8d4",
    color: "#197453",
    padding: "11px 13px",
    borderRadius: "9px",
    fontSize: "12px",
    lineHeight: 1.5,
    marginBottom: "16px",
  },
};
