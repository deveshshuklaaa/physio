
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../apiClient";

const ConsentScreen = () => {
  const [language, setLanguage] = useState(
    localStorage.getItem("preferredLanguage") || "en"
  );
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const translations = {
    en: {
      language: "Language",
      languageName: "English",
      label: "PRIVACY & CONSENT",
      title: "Consent & Privacy",
      intro:
        "Please review the information below before continuing with your clinical registration.",
      dataTitle: "Informed Data Collection",
      dataText:
        "Your personal and clinical information will be collected to support hemophilia screening and care guidance. Data will be stored securely and used only for your assessment and follow-up care.",
      aiTitle: "AI-Based Assessment Consent",
      aiText:
        "This application uses AI-based rules to provide screening guidance and risk stratification. It does not replace diagnosis by a qualified hematologist or medical professional.",
      videoTitle: "Camera / Video Exercise Monitoring",
      videoText:
        "With your permission, future versions may use camera or video to monitor recommended exercises. No recordings will be used without your explicit consent.",
      agreeTitle: "I understand and agree",
      agreeText:
        "I have read and understood the above information and agree to proceed.",
      saving: "Saving...",
      continue: "I Agree & Continue",
      notAgreed: "Please agree to continue.",
      sessionEnded: "Your session has ended. Please log in again.",
      saveFailed: "Failed to save consent. Please try again.",
      footer:
        "Your information is handled securely and is intended for authorized clinical use.",
    },
    hi: {
      language: "भाषा",
      languageName: "हिंदी",
      label: "गोपनीयता और सहमति",
      title: "सहमति और गोपनीयता",
      intro:
        "अपना क्लिनिकल पंजीकरण जारी रखने से पहले कृपया नीचे दी गई जानकारी पढ़ें।",
      dataTitle: "जानकारी एकत्र करने की सहमति",
      dataText:
        "हीमोफीलिया स्क्रीनिंग और देखभाल संबंधी मार्गदर्शन के लिए आपकी व्यक्तिगत और चिकित्सीय जानकारी एकत्र की जाएगी। डेटा सुरक्षित रूप से रखा जाएगा और केवल आपके मूल्यांकन तथा आगे की देखभाल के लिए उपयोग किया जाएगा।",
      aiTitle: "AI-आधारित मूल्यांकन की सहमति",
      aiText:
        "यह एप्लिकेशन स्क्रीनिंग मार्गदर्शन और जोखिम मूल्यांकन के लिए AI-आधारित नियमों का उपयोग करता है। यह किसी योग्य हेमेटोलॉजिस्ट या चिकित्सा विशेषज्ञ द्वारा किए गए निदान का विकल्प नहीं है।",
      videoTitle: "कैमरा / वीडियो व्यायाम निगरानी",
      videoText:
        "आपकी अनुमति से, भविष्य के संस्करण सुझाए गए व्यायामों की निगरानी के लिए कैमरा या वीडियो का उपयोग कर सकते हैं। आपकी स्पष्ट सहमति के बिना कोई रिकॉर्डिंग उपयोग नहीं की जाएगी।",
      agreeTitle: "मैं समझता/समझती हूँ और सहमत हूँ",
      agreeText:
        "मैंने ऊपर दी गई जानकारी पढ़ और समझ ली है और आगे बढ़ने के लिए सहमत हूँ।",
      saving: "सहेजा जा रहा है...",
      continue: "सहमत हूँ और आगे बढ़ें",
      notAgreed: "आगे बढ़ने के लिए कृपया सहमति दें।",
      sessionEnded: "आपका सत्र समाप्त हो गया है। कृपया फिर से लॉग इन करें।",
      saveFailed: "सहमति सहेजी नहीं जा सकी। कृपया पुनः प्रयास करें।",
      footer:
        "आपकी जानकारी सुरक्षित रूप से संभाली जाती है और केवल अधिकृत क्लिनिकल उपयोग के लिए है।",
    },
    mr: {
      language: "भाषा",
      languageName: "मराठी",
      label: "गोपनीयता आणि संमती",
      title: "संमती आणि गोपनीयता",
      intro:
        "तुमचे क्लिनिकल नोंदणीचे काम पुढे सुरू करण्यापूर्वी कृपया खालील माहिती वाचा.",
      dataTitle: "माहिती संकलनासाठी संमती",
      dataText:
        "हिमोफिलिया स्क्रीनिंग आणि आरोग्यसेवा मार्गदर्शनासाठी तुमची वैयक्तिक आणि वैद्यकीय माहिती संकलित केली जाईल. माहिती सुरक्षितपणे साठवली जाईल आणि केवळ तुमच्या मूल्यांकनासाठी व पुढील उपचाराच्या मार्गदर्शनासाठी वापरली जाईल.",
      aiTitle: "AI-आधारित मूल्यांकनासाठी संमती",
      aiText:
        "हे अॅप्लिकेशन स्क्रीनिंग मार्गदर्शन आणि जोखीम मूल्यांकनासाठी AI-आधारित नियमांचा वापर करते. हे पात्र हेमॅटोलॉजिस्ट किंवा वैद्यकीय तज्ज्ञांच्या निदानाचा पर्याय नाही.",
      videoTitle: "कॅमेरा / व्हिडिओ व्यायाम निरीक्षण",
      videoText:
        "तुमच्या परवानगीने, भविष्यातील आवृत्त्यांमध्ये सुचवलेल्या व्यायामांचे निरीक्षण करण्यासाठी कॅमेरा किंवा व्हिडिओचा वापर केला जाऊ शकतो. तुमच्या स्पष्ट संमतीशिवाय कोणतेही रेकॉर्डिंग वापरले जाणार नाही.",
      agreeTitle: "मी समजून घेतले आहे आणि सहमत आहे",
      agreeText:
        "मी वरील माहिती वाचली आणि समजून घेतली आहे आणि पुढे जाण्यास सहमत आहे.",
      saving: "साठवले जात आहे...",
      continue: "मी सहमत आहे आणि पुढे जा",
      notAgreed: "पुढे जाण्यासाठी कृपया संमती द्या.",
      sessionEnded: "तुमचे सत्र समाप्त झाले आहे. कृपया पुन्हा लॉग इन करा.",
      saveFailed: "संमती जतन करता आली नाही. कृपया पुन्हा प्रयत्न करा.",
      footer:
        "तुमची माहिती सुरक्षितपणे हाताळली जाते आणि केवळ अधिकृत क्लिनिकल वापरासाठी आहे.",
    },
  };

  const t = translations[language] || translations.en;

  const handleLanguageChange = (e) => {
    const nextLanguage = e.target.value;
    setLanguage(nextLanguage);
    localStorage.setItem("preferredLanguage", nextLanguage);
  };

  const handleContinue = async () => {
    setError("");

    if (!agree) {
      setError(t.notAgreed);
      return;
    }

    setLoading(true);

    try {
      await api.post("/profile/consent", {
        consentDataCollection: true,
        consentAI: true,
        consentVideoMonitoring: true,
        privacyAccepted: true,
        termsAccepted: true,
      });

      navigate("/register/profile");
    } catch (err) {
      if (err.response?.status === 401) {
        setError(t.sessionEnded);
        navigate("/", { replace: true });
      } else {
        setError(
          err.response?.data?.message || t.saveFailed
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="consent-page">
      <div className="consent-card">

        <div className="consent-language-bar">
          <div className="consent-language-label">
            <span></span>
            <span>{t.language}</span>
          </div>

          <select
            value={language}
            onChange={handleLanguageChange}
            aria-label={t.language}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="mr">मराठी</option>
          </select>
        </div>

        <div className="card-header">
          <div className="consent-label">
            <span className="label-line"></span>
            {t.label}
          </div>

          <h2>{t.title}</h2>

          <p>{t.intro}</p>
        </div>

        <div className="content-section">

          <div className="consent-section">
            <div className="section-number">01</div>
            <div className="section-content">
              <h3>{t.dataTitle}</h3>
              <p>{t.dataText}</p>
            </div>
          </div>

          <div className="consent-section">
            <div className="section-number">02</div>
            <div className="section-content">
              <h3>{t.aiTitle}</h3>
              <p>{t.aiText}</p>
            </div>
          </div>

          <div className="consent-section">
            <div className="section-number">03</div>
            <div className="section-content">
              <h3>{t.videoTitle}</h3>
              <p>{t.videoText}</p>
            </div>
          </div>

        </div>

        <label className={`checkbox-card ${agree ? "checked" : ""}`}>
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />

          <span className="custom-checkbox">
            {agree && "✓"}
          </span>

          <span className="agreement-text">
            <strong>{t.agreeTitle}</strong>
            <span>{t.agreeText}</span>
          </span>
        </label>

        {error && (
          <div className="error">
            <span>!</span>
            {error}
          </div>
        )}

        <button
          className="continue-btn"
          disabled={!agree || loading}
          onClick={handleContinue}
        >
          <span>
            {loading ? t.saving : t.continue}
          </span>

          {!loading && (
            <span className="continue-arrow">→</span>
          )}
        </button>

        <div className="consent-footer">
          <span className="footer-icon">🔒</span>
          <span>{t.footer}</span>
        </div>

      </div>

      <style>{`

        .consent-language-bar {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          margin-bottom: 18px;
        }

        .consent-language-label {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #5e7289;
          font-size: 11px;
          font-weight: 600;
        }

        .consent-language-bar select {
          min-height: 36px;
          padding: 6px 28px 6px 10px;
          border: 1px solid #d5e1ef;
          border-radius: 9px;
          background: #ffffff;
          color: #2f5075;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
        }

        .consent-language-bar select:hover,
        .consent-language-bar select:focus {
          border-color: #6d97df;
          background: #eef5ff;
        }

        @media (max-width: 650px) {
          .consent-language-bar {
            justify-content: flex-end;
            margin-bottom: 14px;
          }

          .consent-language-bar select {
            min-height: 34px;
            font-size: 11px;
          }

          .consent-language-label {
            font-size: 10px;
          }
        }



/* =====================================================
   GLOBAL
===================================================== */

html,
body {

  margin: 0;
  padding: 0;

  width: 100%;
  height: 100%;

  overflow-x: hidden;
}

*,
*::before,
*::after {

  box-sizing: border-box;
}


/* =====================================================
   PAGE
===================================================== */

.consent-page {

  width: 100%;

  min-height: 100vh;
  min-height: 100dvh;

  padding:
    24px
    20px;

  display: flex;

  align-items: center;
  justify-content: center;

  background:
    linear-gradient(
      135deg,
      #f5f9ff 0%,
      #edf5ff 45%,
      #f8fbff 100%
    );

  color: #102a43;
}


/* =====================================================
   CARD
===================================================== */

.consent-card {

  width: 100%;

  max-width: 900px;

  padding:
    30px
    34px;

  border:
    1px solid #d9e5f3;

  border-radius: 22px;

  background:
    rgba(255,255,255,0.94);

  box-shadow:
    0 18px 50px
    rgba(45,91,150,0.11);

  position: relative;
}


/* =====================================================
   HEADER
===================================================== */

.card-header {

  padding-bottom: 20px;

  border-bottom:
    1px solid #e2ebf5;
}


.consent-label {

  display: flex;

  align-items: center;

  gap: 9px;

  margin-bottom: 9px;

  color: #2864d7;

  font-size: 9px;

  font-weight: 800;

  letter-spacing: 1.6px;
}


.label-line {

  width: 35px;

  height: 2px;

  border-radius: 10px;

  background: #4b7bec;
}


.card-header h2 {

  margin: 0;

  color: #102a43;

  font-size: 30px;

  line-height: 1.15;

  font-weight: 750;

  letter-spacing: -0.7px;
}


.card-header p {

  margin:
    8px
    0
    0;

  max-width: 650px;

  color: #667c94;

  font-size: 13px;

  line-height: 1.5;
}


/* =====================================================
   CONTENT
===================================================== */

.content-section {

  margin-top: 20px;

  display: flex;

  flex-direction: column;

  gap: 10px;
}


/* =====================================================
   CONSENT SECTION
===================================================== */

.consent-section {

  display: flex;

  gap: 13px;

  padding:
    13px
    14px;

  border:
    1px solid #dce7f5;

  border-radius: 12px;

  background:
    #fafdff;

  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}


.consent-section:hover {

  border-color:
    #b9cef0;

  background:
    #ffffff;

  box-shadow:
    0 5px 16px
    rgba(45,91,150,0.06);
}


/* =====================================================
   SECTION NUMBER
===================================================== */

.section-number {

  width: 31px;
  height: 31px;

  flex-shrink: 0;

  display: flex;

  align-items: center;
  justify-content: center;

  border-radius: 9px;

  background:
    #edf4ff;

  color:
    #3167ce;

  font-size: 9px;

  font-weight: 800;
}


/* =====================================================
   SECTION CONTENT
===================================================== */

.section-content {

  flex: 1;

  min-width: 0;
}


.section-content h3 {

  margin: 0;

  color:
    #173b68;

  font-size: 13px;

  font-weight: 750;

  line-height: 1.3;
}


.section-content p {

  margin:
    4px
    0
    0;

  color:
    #657b92;

  font-size: 11px;

  line-height: 1.5;
}


/* =====================================================
   AGREEMENT CARD
===================================================== */

.checkbox-card {

  margin-top: 17px;

  width: 100%;

  min-height: 58px;

  padding:
    10px
    12px;

  display: flex;

  align-items: center;

  gap: 11px;

  border:
    1px solid #d4e1f0;

  border-radius: 12px;

  background:
    #f8fbff;

  cursor: pointer;

  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}


.checkbox-card:hover {

  border-color:
    #9bb9e9;

  background:
    #ffffff;
}


.checkbox-card.checked {

  border-color:
    #79a2e8;

  background:
    #f1f6ff;

  box-shadow:
    0 5px 15px
    rgba(61,115,220,0.08);
}


/* Hide native checkbox */

.checkbox-card input {

  position: absolute;

  opacity: 0;

  pointer-events: none;
}


/* =====================================================
   CUSTOM CHECKBOX
===================================================== */

.custom-checkbox {

  width: 27px;
  height: 27px;

  flex-shrink: 0;

  display: flex;

  align-items: center;
  justify-content: center;

  border:
    1.5px solid #b8cbe2;

  border-radius: 7px;

  background:
    white;

  color:
    white;

  font-size: 15px;

  font-weight: 800;

  transition:
    all 0.18s ease;
}


.checkbox-card.checked .custom-checkbox {

  border-color:
    #3e73dc;

  background:
    linear-gradient(
      135deg,
      #3e73dc,
      #6596ed
    );
}


/* =====================================================
   AGREEMENT TEXT
===================================================== */

.agreement-text {

  display: flex;

  flex-direction: column;

  gap: 2px;

  min-width: 0;
}


.agreement-text strong {

  color:
    #25496f;

  font-size: 11.5px;

  font-weight: 750;
}


.agreement-text span {

  color:
    #71859b;

  font-size: 10px;

  line-height: 1.4;
}


/* =====================================================
   ERROR
===================================================== */

.error {

  margin-top: 9px;

  padding:
    8px
    10px;

  display: flex;

  align-items: center;

  gap: 7px;

  border:
    1px solid #f2b8b8;

  border-radius: 8px;

  background:
    #fff5f5;

  color:
    #b42318;

  font-size: 10.5px;
}


.error span {

  width: 17px;
  height: 17px;

  display: flex;

  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  border-radius: 50%;

  background:
    #f8d1d1;

  font-weight: 800;
}


/* =====================================================
   CONTINUE BUTTON
===================================================== */

.continue-btn {

  width: 100%;

  min-height: 48px;

  margin-top: 13px;

  padding:
    10px
    16px;

  display: flex;

  align-items: center;
  justify-content: center;

  gap: 10px;

  border:
    1px solid #3e73dc;

  border-radius: 11px;

  background:
    linear-gradient(
      135deg,
      #3d73dc,
      #5489ed
    );

  color: white;

  font-size: 13px;

  font-weight: 700;

  cursor: pointer;

  box-shadow:
    0 8px 20px
    rgba(61,115,220,0.18);

  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}


.continue-btn:hover:not(:disabled) {

  transform:
    translateY(-1px);

  background:
    linear-gradient(
      135deg,
      #376bd0,
      #4d82e4
    );

  box-shadow:
    0 11px 25px
    rgba(61,115,220,0.25);
}


.continue-btn:active:not(:disabled) {

  transform:
    translateY(0);
}


.continue-btn:disabled {

  opacity: 0.48;

  cursor:
    not-allowed;

  box-shadow:
    none;
}


.continue-arrow {

  font-size: 17px;

  line-height: 1;
}


/* =====================================================
   FOOTER
===================================================== */

.consent-footer {

  margin-top: 11px;

  display: flex;

  align-items: center;
  justify-content: center;

  gap: 5px;

  color:
    #8294a8;

  font-size: 8.5px;

  text-align: center;

  line-height: 1.4;
}


.footer-icon {

  font-size: 9px;
}


/* =====================================================
   TABLET
===================================================== */

@media (max-width: 900px) {

  .consent-page {

    padding:
      20px
      16px;
  }


  .consent-card {

    max-width: 760px;

    padding:
      27px
      28px;
  }


  .card-header h2 {

    font-size: 27px;
  }

}


/* =====================================================
   MOBILE
===================================================== */

@media (max-width: 650px) {

  html,
  body {

    overflow-y: auto;
  }


  .consent-page {

    min-height: 100dvh;

    padding:
      18px
      12px;

    align-items:
      flex-start;
  }


  .consent-card {

    width: 100%;

    max-width: none;

    padding:
      22px
      17px;

    border-radius: 17px;

    box-shadow:
      0 12px 30px
      rgba(45,91,150,0.09);
  }


  .card-header {

    padding-bottom: 16px;

    text-align: left;
  }


  .consent-label {

    font-size: 8px;

    margin-bottom: 8px;
  }


  .label-line {

    width: 27px;
  }


  .card-header h2 {

    font-size: 24px;

    letter-spacing: -0.5px;
  }


  .card-header p {

    margin-top: 7px;

    font-size: 11px;

    line-height: 1.5;
  }


  .content-section {

    margin-top: 15px;

    gap: 8px;
  }


  .consent-section {

    gap: 9px;

    padding:
      10px;

    border-radius: 10px;
  }


  .section-number {

    width: 27px;
    height: 27px;

    border-radius: 8px;

    font-size: 8px;
  }


  .section-content h3 {

    font-size: 11.5px;
  }


  .section-content p {

    margin-top: 3px;

    font-size: 9.5px;

    line-height: 1.45;
  }


  .checkbox-card {

    margin-top: 13px;

    min-height: 52px;

    padding:
      8px
      9px;

    gap: 9px;

    border-radius: 10px;
  }


  .custom-checkbox {

    width: 24px;
    height: 24px;

    border-radius: 6px;

    font-size: 13px;
  }


  .agreement-text strong {

    font-size: 10.5px;
  }


  .agreement-text span {

    font-size: 8.8px;

    line-height: 1.35;
  }


  .continue-btn {

    min-height: 46px;

    margin-top: 10px;

    font-size: 12px;

    border-radius: 10px;
  }


  .consent-footer {

    font-size: 8px;

    margin-top: 9px;
  }

}


/* =====================================================
   SMALL PHONES
===================================================== */

@media (max-width: 420px) {

  .consent-page {

    padding:
      12px
      9px;
  }


  .consent-card {

    padding:
      19px
      14px;

    border-radius: 15px;
  }


  .card-header h2 {

    font-size: 22px;
  }


  .card-header p {

    font-size: 10px;
  }


  .consent-section {

    padding:
      9px;
  }


  .section-number {

    width: 25px;
    height: 25px;
  }


  .section-content h3 {

    font-size: 11px;
  }


  .section-content p {

    font-size: 9px;
  }


  .agreement-text span {

    font-size: 8.5px;
  }


  .continue-btn {

    min-height: 44px;
  }

}


/* =====================================================
   SHORT DESKTOP SCREENS
===================================================== */

@media (
  min-width: 651px
) and (
  max-height: 720px
) {

  .consent-page {

    padding:
      12px
      20px;
  }


  .consent-card {

    padding:
      22px
      28px;
  }


  .card-header {

    padding-bottom: 13px;
  }


  .card-header h2 {

    font-size: 25px;
  }


  .card-header p {

    margin-top: 5px;

    font-size: 11px;
  }


  .content-section {

    margin-top: 13px;

    gap: 7px;
  }


  .consent-section {

    padding:
      9px
      11px;
  }


  .section-content p {

    font-size: 9.5px;
  }


  .checkbox-card {

    margin-top: 11px;

    min-height: 48px;
  }


  .continue-btn {

    min-height: 43px;

    margin-top: 9px;
  }


  .consent-footer {

    margin-top: 7px;
  }

}


/* =====================================================
   REDUCED MOTION
===================================================== */

@media (prefers-reduced-motion: reduce) {

  .consent-section,
  .checkbox-card,
  .continue-btn {

    transition: none;
  }

}

      
      `}</style>
    </div>
  );
};

export default ConsentScreen;
