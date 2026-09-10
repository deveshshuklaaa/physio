import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const savedLanguage =
  localStorage.getItem("preferredLanguage") || "en";

const resources = {
  en: {
    translation: {
      awareness: {
        label: "PATIENT ONBOARDING",

        title: "Have you been diagnosed with",
        titleHighlight: " hemophilia?",

        description:
          "This helps us understand what information you already have and guide you to the appropriate next step in your care journey.",

        yesTitle:
          "Yes, I have been diagnosed",

        yesDescription:
          "Continue with your clinical information",

        noTitle:
          "No, I have not been diagnosed / I'm not sure",

        noDescription:
          "Start a guided screening assessment",

        cardLabel: "HEMOPHILIA CARE",

        cardTitle1: "A better understanding",
        cardTitle2: "starts here.",

        cardDescription:
          "Whether you already have a diagnosis or are experiencing symptoms, we'll guide you through the appropriate information step by step.",

        clinicalInformation:
          "Clinical information",

        securelyRecorded:
          "Securely recorded",

        guidedAssessment:
          "Guided assessment",

        simpleStructured:
          "Simple & structured",
      },
    },
  },

  hi: {
    translation: {
      awareness: {
        label: "रोगी जानकारी",

        title: "क्या आपको",
        titleHighlight: " हीमोफीलिया का निदान हुआ है?",

        description:
          "इससे हमें यह समझने में मदद मिलती है कि आपको पहले से कौन-सी जानकारी है और आपकी देखभाल के लिए अगले उचित कदम तक मार्गदर्शन करने में सहायता मिलती है।",

        yesTitle:
          "हाँ, मुझे हीमोफीलिया का निदान हुआ है",

        yesDescription:
          "अपनी चिकित्सीय जानकारी के साथ आगे बढ़ें",

        noTitle:
          "नहीं, मेरा निदान नहीं हुआ है / मुझे निश्चित नहीं है",

        noDescription:
          "निर्देशित स्क्रीनिंग मूल्यांकन शुरू करें",

        cardLabel: "हीमोफीलिया केयर",

        cardTitle1: "बेहतर समझ",
        cardTitle2: "यहीं से शुरू होती है।",

        cardDescription:
          "चाहे आपका पहले से निदान हो या आप किसी लक्षण का अनुभव कर रहे हों, हम आपको उचित जानकारी के माध्यम से चरण-दर-चरण मार्गदर्शन करेंगे।",

        clinicalInformation:
          "चिकित्सीय जानकारी",

        securelyRecorded:
          "सुरक्षित रूप से दर्ज की गई",

        guidedAssessment:
          "निर्देशित मूल्यांकन",

        simpleStructured:
          "सरल और व्यवस्थित",
      },
    },
  },

  mr: {
    translation: {
      awareness: {
        label: "रुग्ण माहिती",

        title: "तुम्हाला",
        titleHighlight: " हिमोफिलियाचे निदान झाले आहे का?",

        description:
          "यामुळे तुम्हाला आधीपासून कोणती माहिती आहे हे समजण्यास आणि तुमच्या आरोग्यसेवेतील पुढील योग्य टप्प्यासाठी मार्गदर्शन करण्यास आम्हाला मदत होते.",

        yesTitle:
          "होय, मला हिमोफिलियाचे निदान झाले आहे",

        yesDescription:
          "तुमच्या वैद्यकीय माहितीसह पुढे जा",

        noTitle:
          "नाही, माझे निदान झालेले नाही / मला खात्री नाही",

        noDescription:
          "मार्गदर्शित स्क्रीनिंग मूल्यांकन सुरू करा",

        cardLabel: "हिमोफिलिया केअर",

        cardTitle1: "अधिक चांगली समज",
        cardTitle2: "इथून सुरू होते.",

        cardDescription:
          "तुमचे आधीच निदान झालेले असो किंवा तुम्हाला काही लक्षणे जाणवत असोत, आम्ही तुम्हाला आवश्यक माहितीद्वारे टप्प्याटप्प्याने मार्गदर्शन करू.",

        clinicalInformation:
          "वैद्यकीय माहिती",

        securelyRecorded:
          "सुरक्षितपणे नोंदवलेली",

        guidedAssessment:
          "मार्गदर्शित मूल्यांकन",

        simpleStructured:
          "सोपे आणि व्यवस्थित",
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,

    lng: savedLanguage,

    fallbackLng: "en",

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;