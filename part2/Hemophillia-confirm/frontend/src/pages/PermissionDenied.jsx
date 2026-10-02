import React from "react";
import { useNavigate } from "react-router-dom";

const PermissionDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="status-page">
      <div className="status-card">
        <div className="status-icon status-icon--warn">!</div>

        <p className="status-eyebrow status-eyebrow--warn">ERROR 403</p>

        <h1>Access denied</h1>

        <p className="status-description">
          You don't have permission to view this page, or your session has
          expired. Please sign in with the correct account.
        </p>

        <button
          type="button"
          className="status-btn"
          onClick={() => navigate("/")}
        >
          Back to login
        </button>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { margin: 0; min-height: 100%; }

        .status-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 20px;

          background-image:
            linear-gradient(rgba(245, 248, 252, 0.88), rgba(245, 248, 252, 0.88)),
            url("/images/login-bg.png");
          background-size: cover;
          background-position: center;

          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .status-card {
          width: 100%;
          max-width: 460px;

          background: rgba(255, 255, 255, 0.97);
          border-radius: 28px;
          padding: 48px 45px;
          text-align: center;

          box-shadow: 0 25px 70px rgba(20, 45, 80, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.9);
        }

        .status-icon {
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
          font-weight: 800;
        }

        .status-icon--warn {
          background: #fff1f1;
          color: #c53d3d;
        }

        .status-eyebrow {
          margin: 0 0 10px;
          color: #2c5ce0;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .status-eyebrow--warn { color: #c53d3d; }

        .status-card h1 {
          margin: 0;
          color: #10233f;
          font-size: 30px;
          font-weight: 800;
        }

        .status-description {
          margin: 14px auto 10px;
          max-width: 390px;
          color: #687b94;
          font-size: 14px;
          line-height: 1.6;
        }

        .status-btn {
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

        .status-btn:hover { opacity: 0.92; }

        @media (max-width: 550px) {
          .status-card { padding: 38px 24px; border-radius: 22px; }
          .status-card h1 { font-size: 26px; }
        }
      `}</style>
    </div>
  );
};

export default PermissionDenied;
