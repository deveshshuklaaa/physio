import React, { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import api from "../apiClient";
import LanguageSelector from "./LanguageSelector";

const Layout = () => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState({});

  // =====================================================
  // CLOSE MOBILE MENU WHEN CLICKING OUTSIDE
  // =====================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuOpen) return;

      const clickedInsideMenu =
        event.target.closest(".mobile-menu");

      const clickedMenuButton =
        event.target.closest(".mobile-menu-icon");

      // Keep the menu open when clicking inside it
      // or when clicking the hamburger button.
      if (!clickedInsideMenu && !clickedMenuButton) {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [menuOpen]);

  // =====================================================
  // FETCH PATIENT PROFILE
  // =====================================================

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile/patient-profile");

        setProfile(res.data);

        localStorage.setItem(
          "profile",
          JSON.stringify(res.data)
        );
      } catch (err) {
        console.log("Profile fetch error:", err);
      }
    };

    fetchProfile();
  }, []);

  // =====================================================
  // NAVIGATION
  // =====================================================

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleHome = () => {
    navigate("/awareness");
    closeMenu();
  };

  const handleUpdate = () => {
    navigate("/register/profile");
    closeMenu();
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("profile");

    navigate("/");

    closeMenu();
  };

  // =====================================================
  // DISPLAY NAME
  // =====================================================

  const displayName = profile?.fullName || "";

  const displayPatientId =
    profile?.patientId || "";

  return (
    <div className="app-root">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="app-header">

        {/* LEFT */}
        <div
          className="nav-left"
          onClick={handleHome}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleHome();
            }
          }}
        >

          <div className="nav-logo">
            
          </div>

          <div className="nav-title-block">

            <div className="nav-title">
              Somaiya Hemophysio App
            </div>

            <div className="nav-subtitle">
              Patient Portal
            </div>

          </div>

        </div>


        {/* =====================================================
            DESKTOP RIGHT
        ===================================================== */}

        <div className="nav-right">

          {/* PATIENT INFO */}
          <LanguageSelector />

          {displayName && (
            <div className="patient-info">

              <div className="patient-avatar">
                {displayName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="patient-details">

                <div className="patient-name">
                  {displayName}
                </div>

                {displayPatientId && (
                  <div className="patient-id">
                    ID: {displayPatientId}
                  </div>
                )}

              </div>

            </div>
          )}


          {/* HOME */}

          <button
            className="nav-btn"
            onClick={handleHome}
          >
            <span className="nav-btn-icon">
              ⌂
            </span>

            Home
          </button>


          {/* UPDATE PROFILE */}

          <button
            className="nav-btn"
            onClick={handleUpdate}
          >
            <span className="nav-btn-icon">
              ✎
            </span>

            Update Profile
          </button>


          {/* LOGOUT */}

          <button
            className="nav-btn nav-btn-logout"
            onClick={handleLogout}
          >
            <span className="nav-btn-icon">
              ↪
            </span>

            Logout
          </button>

        </div>


        {/* =====================================================
            MOBILE MENU BUTTON
        ===================================================== */}

        <button
          className={`mobile-menu-icon ${
            menuOpen ? "active" : ""
          }`}
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

      </header>


      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      {menuOpen && (
        <div className="mobile-menu">

          {/* USER */}

          {displayName && (
            <div className="mobile-user-card">

              <div className="mobile-avatar">
                {displayName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="mobile-user-details">

                <div className="mobile-user-name">
                  {displayName}
                </div>

                {displayPatientId && (
                  <div className="mobile-user-id">
                    Patient ID: {displayPatientId}
                  </div>
                )}

              </div>

            </div>
          )}
          <div className="mobile-language-selector">
      <LanguageSelector />
    </div>


          {/* HOME */}

          <button
            className="mobile-menu-btn"
            onClick={handleHome}
          >
            <span className="mobile-menu-icon-box">
              ⌂
            </span>

            <span>
              Home
            </span>

            <span className="mobile-arrow">
              →
            </span>
          </button>


          {/* UPDATE */}

          <button
            className="mobile-menu-btn"
            onClick={handleUpdate}
          >
            <span className="mobile-menu-icon-box">
              ✎
            </span>

            <span>
              Update Profile
            </span>

            <span className="mobile-arrow">
              →
            </span>
          </button>


          {/* LOGOUT */}

          <button
            className="mobile-menu-btn mobile-logout"
            onClick={handleLogout}
          >
            <span className="mobile-menu-icon-box">
              ↪
            </span>

            <span>
              Logout
            </span>

            <span className="mobile-arrow">
              →
            </span>
          </button>

        </div>
      )}


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="app-main">
        <Outlet />
      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="app-footer">

        <div className="footer-inner">

          <span className="footer-icon">
            ⓘ
          </span>

          <span>
            This platform provides screening guidance only
            and does not replace medical diagnosis or care
            from a qualified professional.
          </span>

        </div>

      </footer>


      {/* =====================================================
          GLOBAL LAYOUT STYLING
      ===================================================== */}

      <style>{`

        /* =====================================================
           GLOBAL RESET
        ===================================================== */

        html,
        body,
        #root {
          width: 100%;
          min-width: 100%;
          min-height: 100%;
          margin: 0;
          padding: 0;
        }
          /* =====================================================
   LANGUAGE SELECTOR
===================================================== */

.language-selector {
  min-height: 38px;

  display: flex;
  align-items: center;

  gap: 5px;

  padding: 5px 8px;

  border: 1px solid #d5e1ef;

  border-radius: 9px;

  background: #ffffff;

  color: #5e7289;

  transition: all 0.18s ease;
}

.language-selector:hover {
  border-color: #6d97df;

  background: #eef5ff;

  color: #2f67ca;
}

.language-icon {
  font-size: 14px;

  line-height: 1;
}

.language-selector select {
  border: none;

  outline: none;

  background: transparent;

  color: #5e7289;

  font-size: 11.5px;

  font-weight: 600;

  cursor: pointer;
}

.language-selector select:focus {
  outline: none;
}


/* =====================================================
   MOBILE LANGUAGE SELECTOR
===================================================== */

.mobile-language-selector {
  width: 100%;

  padding: 2px 0;
}

.mobile-language-selector .language-selector {
  width: 100%;

  min-height: 48px;

  padding: 8px 12px;

  border-radius: 10px;
}

.mobile-language-selector .language-selector select {
  flex: 1;

  font-size: 13px;

  cursor: pointer;
}

        html {
          overflow-x: hidden;
        }

        body {
          min-height: 100vh;
          background: #f4f8fd;
          color: #15385f;
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          overflow-x: hidden;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        button,
        input,
        textarea,
        select {
          font: inherit;
        }


        /* =====================================================
           ROOT
        ===================================================== */

        .app-root {
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;

          display: flex;
          flex-direction: column;

          background:
            linear-gradient(
              135deg,
              #f5f9ff 0%,
              #edf5ff 50%,
              #f8fbff 100%
            );
        }


        /* =====================================================
           HEADER
        ===================================================== */

        .app-header {
          position: relative;
          z-index: 100;

          width: 100%;

          min-height: 68px;

          padding:
            10px
            clamp(18px, 4vw, 60px);

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 20px;

          background:
            rgba(255, 255, 255, 0.96);

          border-bottom:
            1px solid #d8e4f2;

          box-shadow:
            0 3px 15px rgba(42, 83, 130, 0.06);

          backdrop-filter:
            blur(12px);
        }


        /* =====================================================
           LEFT NAV
        ===================================================== */

        .nav-left {
          display: flex;
          align-items: center;

          gap: 11px;

          cursor: pointer;

          min-width: 0;
        }


        .nav-logo {
          width: 34px;
          height: 34px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid #4b7fe0;

          border-radius: 9px;

          background:
            linear-gradient(
              135deg,
              #376fd5,
              #5d8de7
            );

          color: white;

          font-size: 25px;
          font-weight: 300;

          line-height: 1;

          box-shadow:
            0 5px 14px rgba(55, 111, 213, 0.20);
        }


        .nav-title-block {
          display: flex;
          flex-direction: column;

          min-width: 0;
        }


        .nav-title {
          color: #163b65;

          font-size: 15px;
          font-weight: 700;

          line-height: 1.2;

          white-space: nowrap;
        }


        .nav-subtitle {
          margin-top: 2px;

          color: #8295aa;

          font-size: 9px;
          font-weight: 600;

          letter-spacing: 0.8px;
          text-transform: uppercase;
        }


        /* =====================================================
           RIGHT NAV
        ===================================================== */

        .nav-right {
          display: flex;
          align-items: center;

          gap: 8px;

          min-width: 0;
        }


        /* =====================================================
           PATIENT INFO
        ===================================================== */

        .patient-info {
          min-height: 40px;

          padding:
            5px
            11px
            5px
            6px;

          display: flex;
          align-items: center;

          gap: 8px;

          border:
            1px solid #dbe6f3;

          border-radius: 10px;

          background: #f8fbff;
        }


        .patient-avatar {
          width: 29px;
          height: 29px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid #c8dafa;

          border-radius: 50%;

          background: #e9f1ff;

          color: #3269ca;

          font-size: 12px;
          font-weight: 700;
        }


        .patient-details {
          min-width: 0;
        }


        .patient-name {
          max-width: 150px;

          overflow: hidden;

          color: #294c72;

          font-size: 11.5px;
          font-weight: 700;

          white-space: nowrap;
          text-overflow: ellipsis;
        }


        .patient-id {
          margin-top: 1px;

          color: #8496aa;

          font-size: 9.5px;

          white-space: nowrap;
        }


        /* =====================================================
           NAV BUTTONS
        ===================================================== */

        .nav-btn {
          min-height: 38px;

          display: flex;
          align-items: center;

          gap: 6px;

          padding:
            8px
            12px;

          border:
            1px solid #d5e1ef;

          border-radius: 9px;

          background: #ffffff;

          color: #5e7289;

          font-size: 11.5px;
          font-weight: 600;

          cursor: pointer;

          transition:
            all 0.18s ease;
        }


        .nav-btn:hover {
          border-color: #6d97df;

          background: #eef5ff;

          color: #2f67ca;

          transform: translateY(-1px);

          box-shadow:
            0 5px 14px rgba(47, 103, 202, 0.08);
        }


        .nav-btn:focus-visible {
          outline: 2px solid #5c89df;
          outline-offset: 2px;
        }


        .nav-btn-icon {
          font-size: 14px;
          line-height: 1;
        }


        /* =====================================================
           LOGOUT
        ===================================================== */

        .nav-btn-logout {
          border-color: #d5e1ef;

          background: #f8fbff;

          color: #5d7188;
        }


        .nav-btn-logout:hover {
          border-color: #e0a0a0;

          background: #fff5f5;

          color: #c34e4e;

          box-shadow:
            0 5px 14px rgba(195, 78, 78, 0.08);
        }


        /* =====================================================
           MOBILE HAMBURGER
        ===================================================== */

        .mobile-menu-icon {
          display: none;

          width: 40px;
          height: 40px;

          flex-shrink: 0;

          padding: 9px;

          border:
            1px solid #d5e1ef;

          border-radius: 10px;

          background: #ffffff;

          cursor: pointer;

          align-items: center;
          justify-content: center;

          flex-direction: column;

          gap: 4px;

          transition:
            all 0.18s ease;
        }


        .mobile-menu-icon span {
          width: 18px;
          height: 2px;

          border-radius: 10px;

          background: #396ecb;

          transition:
            all 0.2s ease;
        }


        .mobile-menu-icon:hover,
        .mobile-menu-icon.active {
          border-color: #6c96dc;

          background: #eef5ff;
        }


        /* =====================================================
           MOBILE MENU
        ===================================================== */

        .mobile-menu {
          position: absolute;
          z-index: 90;

          top: 68px;
          right: 16px;
          left: 16px;

          padding: 10px;

          display: flex;
          flex-direction: column;

          gap: 7px;

          border:
            1px solid #d6e2f0;

          border-radius: 14px;

          background:
            rgba(255,255,255,0.98);

          box-shadow:
            0 15px 35px rgba(38, 76, 118, 0.15);

          backdrop-filter:
            blur(15px);
        }


        /* =====================================================
           MOBILE USER
        ===================================================== */

        .mobile-user-card {
          padding: 12px;

          display: flex;
          align-items: center;

          gap: 10px;

          border:
            1px solid #dce7f4;

          border-radius: 11px;

          background: #f7faff;

          margin-bottom: 3px;
        }


        .mobile-avatar {
          width: 38px;
          height: 38px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid #c8dafa;

          border-radius: 50%;

          background: #e9f1ff;

          color: #3269ca;

          font-size: 14px;
          font-weight: 700;
        }


        .mobile-user-details {
          min-width: 0;
        }


        .mobile-user-name {
          color: #26496f;

          font-size: 13px;
          font-weight: 700;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }


        .mobile-user-id {
          margin-top: 2px;

          color: #8194a9;

          font-size: 10px;
        }


        /* =====================================================
           MOBILE MENU BUTTON
        ===================================================== */

        .mobile-menu-btn {
          width: 100%;

          min-height: 50px;

          padding:
            8px
            10px;

          display: flex;
          align-items: center;

          gap: 10px;

          border:
            1px solid #dce6f2;

          border-radius: 10px;

          background: #ffffff;

          color: #48627e;

          font-size: 13px;
          font-weight: 600;

          text-align: left;

          cursor: pointer;

          transition:
            all 0.18s ease;
        }


        .mobile-menu-btn:hover {
          border-color: #82a6df;

          background: #eef5ff;

          color: #2e64c8;
        }


        .mobile-menu-icon-box {
          width: 31px;
          height: 31px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid #d7e4f4;

          border-radius: 8px;

          background: #f1f6ff;

          color: #3b70d0;

          font-size: 14px;
        }


        .mobile-arrow {
          margin-left: auto;

          color: #8ca0b5;

          font-size: 16px;
        }


        .mobile-logout:hover {
          border-color: #e2aaaa;

          background: #fff6f6;

          color: #c14e4e;
        }


        .mobile-logout .mobile-menu-icon-box {
          color: #c15c5c;

          background: #fff2f2;

          border-color: #f0d5d5;
        }


        /* =====================================================
           MAIN
        ===================================================== */

        .app-main {
          flex: 1;

          width: 100%;

          min-width: 0;

          display: block;

          background: transparent;
        }


        /* =====================================================
           FOOTER
        ===================================================== */

        .app-footer {
          width: 100%;

          padding:
            12px
            clamp(18px, 4vw, 50px);

          border-top:
            1px solid #dce6f2;

          background:
            rgba(255,255,255,0.75);

          color: #7a8da3;

          font-size: 10px;

          line-height: 1.5;

          text-align: center;
        }


        .footer-inner {
          max-width: 1100px;

          margin: 0 auto;

          min-height: 28px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 7px;

          padding:
            6px
            10px;

          border:
            1px solid #e0e8f2;

          border-radius: 8px;

          background:
            rgba(248,251,255,0.8);
        }


        .footer-icon {
          color: #5280d0;

          font-size: 12px;
        }


        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 1050px) {

          .app-header {
            padding:
              10px
              25px;
          }


          .nav-right {
            gap: 6px;
          }


          .patient-info {
            display: none;
          }


          .nav-btn {
            padding:
              8px
              10px;

            font-size: 11px;
          }

        }


        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 768px) {

          .app-header {
            min-height: 62px;

            padding:
              9px
              16px;
          }


          .nav-logo {
            width: 33px;
            height: 33px;
          }


          .nav-title {
            font-size: 14px;
          }


          .nav-subtitle {
            font-size: 8px;
          }


          .nav-right {
            display: none;
          }


          .mobile-menu-icon {
            display: flex;
          }


          .mobile-menu {
            top: 62px;
          }


          .app-footer {
            padding:
              10px
              12px;
          }


          .footer-inner {
            align-items: flex-start;

            text-align: left;

            font-size: 9px;
          }

        }


        /* =====================================================
           SMALL MOBILE
        ===================================================== */

        @media (max-width: 420px) {

          .app-header {
            padding:
              8px
              12px;
          }


          .nav-title {
            font-size: 13px;
          }


          .nav-subtitle {
            display: none;
          }


          .nav-logo {
            width: 31px;
            height: 31px;

            font-size: 22px;
          }


          .mobile-menu {
            right: 10px;
            left: 10px;

            border-radius: 12px;
          }


          .mobile-menu-btn {
            min-height: 48px;
          }

        }


        /* =====================================================
           REDUCED MOTION
        ===================================================== */

        @media (prefers-reduced-motion: reduce) {

          .nav-btn,
          .mobile-menu-btn,
          .mobile-menu-icon,
          .nav-logo {
            transition: none;
          }

        }

      `}</style>

    </div>
  );
};

export default Layout;