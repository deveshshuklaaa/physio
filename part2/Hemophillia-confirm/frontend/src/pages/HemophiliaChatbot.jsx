







import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useTranslation,
} from "react-i18next";

import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";

import api from "../apiClient";

import "./chatbot-style.css";


// ============================================================
// VERSION
//
// Changing this automatically clears the old chatbot state.
// This prevents your previous English emergency question from
// remaining in localStorage.
// ============================================================

const CHATBOT_VERSION =
  "ml-chatbot-v3-profile-confirm";


// ============================================================
// TRANSLATIONS
// ============================================================

const TEXT = {

  en: {

    header:
      "Hemophilia AI Assistant",

    guided:
      "Guided screening",

    aiAssistant:
      "AI assistant",

    active:
      "Active",

    available:
      "Available",

    chooseAnswer:
      "Choose an answer",

    yourResponse:
      "Your response",

    askAI:
      "Ask the AI Assistant",

    typeAnswer:
      "Type your answer...",

    askAnything:
      "Ask anything about your assessment...",

    aiChatEnabled:
      "AI chat enabled",

    continueQuestions:
      "You can continue asking questions about your screening results.",

    assessmentCompleted:
      "Assessment completed",

    assessmentSaved:
      "Your screening assessment has been saved.",

    viewReport:
      "View Report",

    clearAssessment:
      "Clear Assessment",

    screeningGuidance:
      "Screening guidance only",

    disclaimer:
      "This assessment provides screening guidance only and does not replace diagnosis or treatment from a qualified medical professional.",

    yes:
      "Yes",

    no:
      "No",

    never:
      "Never",

    sometimes:
      "Sometimes",

    often:
      "Often",

    ageQuestion:
      "What is your age in years?",

    sexQuestion:
      "What is your sex?",

    male:
      "Male",

    female:
      "Female",

    minorCuts:
      "Do you bleed longer than others after minor cuts?",

    surgery:
      "Have you experienced excessive bleeding after surgery or stitches?",

    dental:
      "Have you experienced excessive bleeding after dental procedures?",

    bruising:
      "Do you develop large or unusual bruises easily?",

    muscle:
      "Have you experienced deep muscle swelling, tenderness, or pain without a major injury?",

    joint:
      "Have you experienced repeated joint swelling or bleeding episodes without significant trauma?",

    warmth:
      "During joint episodes, have you experienced warmth in the affected joint?",

    tightness:
      "During joint episodes, have you experienced tightness in the affected joint?",

    reducedMovement:
      "During joint episodes, have you experienced reduced movement of the affected joint?",

    urine:
      "Have you ever noticed blood in your urine?",

    stool:
      "Have you ever noticed blood in your stool?",

    family:
      "Does your family have a history of a bleeding disorder or hemophilia?",

    maleRelative:
      "Do you have a male relative diagnosed with hemophilia?",

    factorTest:
      "Have you previously had a clotting factor test?",

    redFlagQuestion:
      `Are you currently experiencing any of the following red-flag symptoms?

1. **Joint bleed:** Joint swelling, warmth, or reduced movement, especially in the knees, elbows, or ankles.

2. **Muscle bleed:** Large muscle swelling, tenderness, or pain.

3. **Easy bruising:** Unusual or extensive bruises on the body.

4. **Mucosal bleeding:** Nosebleeds, bleeding gums, prolonged bleeding after dental work, minor cuts, injuries, vaccinations, or injection pricks.

5. **Systemic bleeding:** Blood in the urine and/or stools.

**If you are currently experiencing any one of these symptoms, please answer YES.**`,

    urgentTitle:
  "🚨 URGENT MEDICAL ATTENTION REQUIRED",

urgentMessage:
  "You reported a current red-flag bleeding symptom. This may require prompt medical assessment.\n\n" +
  "Please contact your hemophilia treatment centre, hematologist, doctor, or seek urgent medical care.\n\n" +
  "For physiotherapy support:\n" +
  "📞 +91 22 2409 1796\n" +
  "✉ somaiya_physiotherapy@somaiya.edu\n" +
  "📍 K. J. Somaiya College of Physiotherapy, Ayurvihar Complex, Eastern Express Highway, Sion, Mumbai – 400022.",
  
    continuing:
      "No current red-flag symptom reported. Let's continue with the screening.",

    profileConfirmTitle: "Confirm your profile details",
    profileConfirmMessage: "Before we continue, please confirm that the following profile information is correct:",
    profileAge: "Age",
    profileGender: "Gender",
    profileConfirmQuestion: "Are these details correct?",
    profileConfirmYes: "Yes, continue",
    profileConfirmNo: "No, update profile",
    profileMissing: "Your age and gender could not be loaded from your patient profile. Please complete your profile first.",

    predictionTitle:
      " ML Screening Prediction",

    predictionMessage:
      "Based on the information provided, the Random Forest screening model predicts:",

    predictionConfidence:
      "Prediction Confidence",

    screeningOnly:
      "This is a screening prediction only. It does not confirm a diagnosis.",

    lowConfidence:
      "The model's prediction should be interpreted cautiously and discussed with a qualified healthcare professional.",

    predictionError:
      "Unable to generate the ML screening prediction. Please try again.",

    invalidAge:
      "Please enter a valid age between 0 and 120.",

    invalidAnswer:
      "Please choose one of the available answers.",

    cleared:
      "Assessment cleared.",

    aiUnavailable:
      "Sorry, AI is currently unavailable.",

  },


  hi: {

    header:
      "हीमोफीलिया AI सहायक",

    guided:
      "मार्गदर्शित स्क्रीनिंग",

    aiAssistant:
      "AI सहायक",

    active:
      "सक्रिय",

    available:
      "उपलब्ध",

    chooseAnswer:
      "उत्तर चुनें",

    yourResponse:
      "आपका उत्तर",

    askAI:
      "AI सहायक से पूछें",

    typeAnswer:
      "अपना उत्तर लिखें...",

    askAnything:
      "अपने मूल्यांकन के बारे में कुछ भी पूछें...",

    aiChatEnabled:
      "AI चैट सक्षम है",

    continueQuestions:
      "आप अपने स्क्रीनिंग परिणामों के बारे में प्रश्न पूछना जारी रख सकते हैं।",

    assessmentCompleted:
      "मूल्यांकन पूरा हुआ",

    assessmentSaved:
      "आपका स्क्रीनिंग मूल्यांकन सुरक्षित कर लिया गया है।",

    viewReport:
      "रिपोर्ट देखें",

    clearAssessment:
      "मूल्यांकन साफ़ करें",

    screeningGuidance:
      "केवल स्क्रीनिंग मार्गदर्शन",

    disclaimer:
      "यह मूल्यांकन केवल स्क्रीनिंग मार्गदर्शन प्रदान करता है और योग्य चिकित्सा पेशेवर द्वारा निदान या उपचार का स्थान नहीं लेता।",

    yes:
      "हाँ",

    no:
      "नहीं",

    never:
      "कभी नहीं",

    sometimes:
      "कभी-कभी",

    often:
      "अक्सर",

    ageQuestion:
      "आपकी उम्र कितनी है?",

    sexQuestion:
      "आपका लिंग क्या है?",

    male:
      "पुरुष",

    female:
      "महिला",

    minorCuts:
      "क्या मामूली कट लगने के बाद आपका रक्तस्राव दूसरों की तुलना में अधिक समय तक रहता है?",

    surgery:
      "क्या सर्जरी या टांके लगाने के बाद आपको अत्यधिक रक्तस्राव हुआ है?",

    dental:
      "क्या दंत प्रक्रिया के बाद आपको अत्यधिक रक्तस्राव हुआ है?",

    bruising:
      "क्या आपके शरीर पर बड़े या असामान्य नीले निशान आसानी से पड़ जाते हैं?",

    muscle:
      "क्या आपको बिना किसी बड़ी चोट के मांसपेशियों में गहरी सूजन, दर्द या संवेदनशीलता हुई है?",

    joint:
      "क्या आपको बिना किसी बड़ी चोट के बार-बार जोड़ों में सूजन या रक्तस्राव हुआ है?",

    warmth:
      "जोड़ों की समस्या के दौरान क्या प्रभावित जोड़ में गर्माहट महसूस होती है?",

    tightness:
      "जोड़ों की समस्या के दौरान क्या प्रभावित जोड़ में खिंचाव या जकड़न महसूस होती है?",

    reducedMovement:
      "जोड़ों की समस्या के दौरान क्या प्रभावित जोड़ की गति कम हो जाती है?",

    urine:
      "क्या आपने कभी अपने मूत्र में रक्त देखा है?",

    stool:
      "क्या आपने कभी अपने मल में रक्त देखा है?",

    family:
      "क्या आपके परिवार में रक्तस्राव संबंधी विकार या हीमोफीलिया का इतिहास है?",

    maleRelative:
      "क्या आपके परिवार में कोई पुरुष रिश्तेदार हीमोफीलिया से पीड़ित है?",

    factorTest:
      "क्या आपने पहले कभी क्लॉटिंग फैक्टर की जाँच करवाई है?",

    redFlagQuestion:
      `क्या आपको वर्तमान में निम्नलिखित में से कोई रेड-फ्लैग लक्षण हो रहा है?

1. **जोड़ों में रक्तस्राव:** जोड़ों में सूजन, गर्माहट या गति कम होना, विशेष रूप से घुटनों, कोहनियों या टखनों में।

2. **मांसपेशियों में रक्तस्राव:** मांसपेशियों में बड़ी सूजन, दर्द या संवेदनशीलता।

3. **आसानी से चोट के निशान:** शरीर पर असामान्य या बड़े नीले निशान।

4. **म्यूकोसल रक्तस्राव:** नाक से खून आना, मसूड़ों से खून आना, दाँतों की प्रक्रिया के बाद लंबे समय तक रक्तस्राव, मामूली कट, चोट, टीकाकरण या इंजेक्शन के बाद लंबे समय तक रक्तस्राव।

5. **सिस्टमिक रक्तस्राव:** मूत्र और/या मल में रक्त।

**यदि आपको इनमें से कोई भी लक्षण अभी हो रहा है, तो कृपया हाँ में उत्तर दें।**`,

    urgentTitle:
      "🚨 तत्काल चिकित्सा सहायता आवश्यक है",

    urgentMessage:
      "आपने वर्तमान में एक रेड-फ्लैग रक्तस्राव संबंधी लक्षण बताया है। इसके लिए तुरंत चिकित्सा मूल्यांकन आवश्यक हो सकता है। कृपया अपने हीमोफीलिया उपचार केंद्र, हेमेटोलॉजिस्ट या डॉक्टर से संपर्क करें या तत्काल चिकित्सा सहायता लें।",

    continuing:
      "वर्तमान में कोई रेड-फ्लैग लक्षण नहीं बताया गया है। आइए स्क्रीनिंग जारी रखते हैं।",

    profileConfirmTitle: "अपनी प्रोफ़ाइल जानकारी की पुष्टि करें",
    profileConfirmMessage: "आगे बढ़ने से पहले कृपया पुष्टि करें कि नीचे दी गई प्रोफ़ाइल जानकारी सही है:",
    profileAge: "उम्र",
    profileGender: "लिंग",
    profileConfirmQuestion: "क्या ये जानकारी सही है?",
    profileConfirmYes: "हाँ, आगे बढ़ें",
    profileConfirmNo: "नहीं, प्रोफ़ाइल अपडेट करें",
    profileMissing: "आपकी उम्र और लिंग रोगी प्रोफ़ाइल से लोड नहीं हो सके। कृपया पहले अपनी प्रोफ़ाइल पूरी करें।",

    predictionTitle:
      "ML स्क्रीनिंग परिणाम",

    predictionMessage:
      "आपके द्वारा दी गई जानकारी के आधार पर Random Forest स्क्रीनिंग मॉडल का अनुमान है:",

    predictionConfidence:
      "पूर्वानुमान विश्वास स्तर",

    screeningOnly:
      "यह केवल स्क्रीनिंग अनुमान है। यह निदान की पुष्टि नहीं करता।",

    lowConfidence:
      "मॉडल के अनुमान की सावधानीपूर्वक व्याख्या की जानी चाहिए और योग्य स्वास्थ्य पेशेवर से चर्चा करनी चाहिए।",

    predictionError:
      "ML स्क्रीनिंग अनुमान तैयार नहीं किया जा सका। कृपया पुनः प्रयास करें।",

    invalidAge:
      "कृपया 0 से 120 के बीच सही उम्र दर्ज करें।",

    invalidAnswer:
      "कृपया उपलब्ध विकल्पों में से एक उत्तर चुनें।",

    cleared:
      "मूल्यांकन साफ़ कर दिया गया है।",

    aiUnavailable:
      "क्षमा करें, AI अभी उपलब्ध नहीं है।",

  },


  mr: {

    header:
      "हिमोफिलिया AI सहाय्यक",

    guided:
      "मार्गदर्शित स्क्रीनिंग",

    aiAssistant:
      "AI सहाय्यक",

    active:
      "सक्रिय",

    available:
      "उपलब्ध",

    chooseAnswer:
      "उत्तर निवडा",

    yourResponse:
      "तुमचे उत्तर",

    askAI:
      "AI सहाय्यकाला विचारा",

    typeAnswer:
      "तुमचे उत्तर लिहा...",

    askAnything:
      "तुमच्या मूल्यांकनाबद्दल काहीही विचारा...",

    aiChatEnabled:
      "AI चॅट सक्षम आहे",

    continueQuestions:
      "तुम्ही तुमच्या स्क्रीनिंग निकालांबद्दल प्रश्न विचारणे सुरू ठेवू शकता.",

    assessmentCompleted:
      "मूल्यांकन पूर्ण झाले",

    assessmentSaved:
      "तुमचे स्क्रीनिंग मूल्यांकन जतन केले गेले आहे.",

    viewReport:
      "अहवाल पहा",

    clearAssessment:
      "मूल्यांकन साफ करा",

    screeningGuidance:
      "फक्त स्क्रीनिंग मार्गदर्शन",

    disclaimer:
      "हे मूल्यांकन फक्त स्क्रीनिंग मार्गदर्शन देते आणि पात्र वैद्यकीय व्यावसायिकाच्या निदान किंवा उपचाराची जागा घेत नाही.",

    yes:
      "होय",

    no:
      "नाही",

    never:
      "कधीच नाही",

    sometimes:
      "कधीकधी",

    often:
      "अनेकदा",

    ageQuestion:
      "तुमचे वय किती आहे?",

    sexQuestion:
      "तुमचे लिंग काय आहे?",

    male:
      "पुरुष",

    female:
      "महिला",

    minorCuts:
      "किरकोळ कापल्यानंतर इतरांच्या तुलनेत तुमचा रक्तस्राव जास्त वेळ चालतो का?",

    surgery:
      "शस्त्रक्रिया किंवा टाके घातल्यानंतर तुम्हाला जास्त रक्तस्राव झाला आहे का?",

    dental:
      "दातांच्या उपचारानंतर तुम्हाला जास्त रक्तस्राव झाला आहे का?",

    bruising:
      "तुमच्या शरीरावर मोठे किंवा असामान्य निळे डाग सहज पडतात का?",

    muscle:
      "मोठी दुखापत नसताना तुम्हाला स्नायूंमध्ये खोल सूज, वेदना किंवा संवेदनशीलता जाणवली आहे का?",

    joint:
      "मोठी दुखापत नसताना तुम्हाला वारंवार सांध्यांमध्ये सूज किंवा रक्तस्राव झाला आहे का?",

    warmth:
      "सांध्याच्या समस्येदरम्यान प्रभावित सांध्यामध्ये उष्णता जाणवते का?",

    tightness:
      "सांध्याच्या समस्येदरम्यान प्रभावित सांध्यामध्ये ताण किंवा जकडणूक जाणवते का?",

    reducedMovement:
      "सांध्याच्या समस्येदरम्यान प्रभावित सांध्याची हालचाल कमी होते का?",

    urine:
      "तुम्हाला कधी लघवीमध्ये रक्त दिसले आहे का?",

    stool:
      "तुम्हाला कधी शौचामध्ये रक्त दिसले आहे का?",

    family:
      "तुमच्या कुटुंबात रक्तस्रावाचा विकार किंवा हिमोफिलियाचा इतिहास आहे का?",

    maleRelative:
      "तुमच्या कुटुंबातील कोणत्या पुरुष नातेवाईकाला हिमोफिलियाचे निदान झाले आहे का?",

    factorTest:
      "तुमची यापूर्वी क्लॉटिंग फॅक्टरची तपासणी झाली आहे का?",

    redFlagQuestion:
      `तुम्हाला सध्या खालीलपैकी कोणतेही रेड-फ्लॅग लक्षण आहे का?

1. **सांध्यातील रक्तस्राव:** सांध्यामध्ये सूज, उष्णता किंवा हालचाल कमी होणे, विशेषतः गुडघे, कोपर किंवा घोट्यामध्ये.

2. **स्नायूंमधील रक्तस्राव:** स्नायूमध्ये मोठी सूज, वेदना किंवा संवेदनशीलता.

3. **सहज निळे डाग पडणे:** शरीरावर असामान्य किंवा मोठे निळे डाग.

4. **म्यूकोसल रक्तस्राव:** नाकातून रक्त येणे, हिरड्यांतून रक्त येणे, दातांच्या उपचारानंतर दीर्घकाळ रक्तस्राव, किरकोळ काप, दुखापत, लसीकरण किंवा इंजेक्शननंतर दीर्घकाळ रक्तस्राव.

5. **सिस्टमिक रक्तस्राव:** लघवी आणि/किंवा शौचामध्ये रक्त.

**यापैकी कोणतेही लक्षण सध्या असल्यास कृपया होय असे उत्तर द्या.**`,

    urgentTitle:
      " तातडीने वैद्यकीय मदत आवश्यक आहे",

    urgentMessage:
      "तुम्ही सध्या रेड-फ्लॅग रक्तस्रावाचे लक्षण असल्याचे सांगितले आहे. यासाठी त्वरित वैद्यकीय तपासणी आवश्यक असू शकते. कृपया तुमच्या हिमोफिलिया उपचार केंद्राशी, हेमॅटोलॉजिस्टशी किंवा डॉक्टरांशी संपर्क साधा किंवा तातडीची वैद्यकीय मदत घ्या.",

    continuing:
      "सध्या कोणतेही रेड-फ्लॅग लक्षण नोंदवलेले नाही. चला स्क्रीनिंग पुढे सुरू करूया.",

    profileConfirmTitle: "तुमच्या प्रोफाइलची माहिती तपासा",
    profileConfirmMessage: "पुढे जाण्यापूर्वी खालील प्रोफाइल माहिती योग्य आहे याची कृपया पुष्टी करा:",
    profileAge: "वय",
    profileGender: "लिंग",
    profileConfirmQuestion: "ही माहिती योग्य आहे का?",
    profileConfirmYes: "होय, पुढे जा",
    profileConfirmNo: "नाही, प्रोफाइल अपडेट करा",
    profileMissing: "तुमचे वय आणि लिंग रुग्णाच्या प्रोफाइलमधून लोड करता आले नाही. कृपया प्रथम तुमचे प्रोफाइल पूर्ण करा.",

    predictionTitle:
      "ML स्क्रीनिंग निकाल",

    predictionMessage:
      "तुम्ही दिलेल्या माहितीनुसार Random Forest स्क्रीनिंग मॉडेलचा अंदाज:",

    predictionConfidence:
      "पूर्वानुमान विश्वास पातळी",

    screeningOnly:
      "हा केवळ स्क्रीनिंग अंदाज आहे. यामुळे निदान निश्चित होत नाही.",

    lowConfidence:
      "मॉडेलच्या अंदाजाचा काळजीपूर्वक अर्थ लावावा आणि पात्र आरोग्य व्यावसायिकाशी चर्चा करावी.",

    predictionError:
      "ML स्क्रीनिंग अंदाज तयार करता आला नाही. कृपया पुन्हा प्रयत्न करा.",

    invalidAge:
      "कृपया 0 ते 120 दरम्यान योग्य वय लिहा.",

    invalidAnswer:
      "कृपया उपलब्ध पर्यायांपैकी एक उत्तर निवडा.",

    cleared:
      "मूल्यांकन साफ केले आहे.",

    aiUnavailable:
      "क्षमस्व, AI सध्या उपलब्ध नाही.",

  }

};


// ============================================================
// COMPONENT
// ============================================================

export default function Chatbot() {

  const navigate =
    useNavigate();

  const chatEndRef =
    useRef(null);

  const {
    i18n
  } = useTranslation();


  // ==========================================================
  // LANGUAGE
  // ==========================================================

  const storedPreferredLanguage =
    localStorage.getItem(
      "preferredLanguage"
    );

  const currentLanguage =
    ["en", "hi", "mr"].includes(
      storedPreferredLanguage
    )
      ? storedPreferredLanguage
      : (
          ["en", "hi", "mr"].includes(
            i18n.language
          )
            ? i18n.language
            : "en"
        );


  const t =
    TEXT[currentLanguage] ||
    TEXT.en;


  // ==========================================================
  // RESET OLD VERSION
  //
  // This fixes the old localStorage issue.
  // ==========================================================

  const storedVersion =
    localStorage.getItem(
      "chatbotVersion"
    );


  if (
    storedVersion !== CHATBOT_VERSION
  ) {

    localStorage.removeItem(
      "chatHistory"
    );

    localStorage.removeItem(
      "chatbotPhase"
    );

    localStorage.removeItem(
      "chatbotAnswers"
    );

    localStorage.removeItem(
      "chatbotPrediction"
    );

    localStorage.removeItem(
      "chatbotEmergency"
    );

    localStorage.removeItem(
      "chatbotCompleted"
    );

    localStorage.setItem(
      "chatbotVersion",
      CHATBOT_VERSION
    );
  }


  // ==========================================================
  // PHASE
  //
  // redFlag
  // questions
  // completed
  // emergency
  // ==========================================================

  const [
    phase,
    setPhase
  ] = useState(
    () =>
      localStorage.getItem(
        "chatbotPhase"
      ) || "redFlag"
  );


  // ==========================================================
  // QUESTION INDEX
  // ==========================================================

  const [
    questionIndex,
    setQuestionIndex
  ] = useState(
    () =>
      Number(
        localStorage.getItem(
          "chatbotQuestionIndex"
        )
      ) || 0
  );


  // ==========================================================
  // ANSWERS
  // ==========================================================

  const [
    mlAnswers,
    setMlAnswers
  ] = useState(
    () => {

      const saved =
        localStorage.getItem(
          "chatbotAnswers"
        );

      return saved
        ? JSON.parse(saved)
        : {};
    }
  );


  // ==========================================================
  // CHAT HISTORY
  // ==========================================================

  const [
    chat,
    setChat
  ] = useState(
    () => {

      const saved =
        localStorage.getItem(
          "chatHistory"
        );

      if (saved) {

        try {

          return JSON.parse(
            saved
          );

        } catch {

          // Ignore corrupted history
        }
      }


      return [
        {
          from: "bot",
          messageKey: "redFlagQuestion",
          text: t.redFlagQuestion,
        }
      ];
    }
  );


  // ==========================================================
  // EMERGENCY
  // ==========================================================

  const [
    emergency,
    setEmergency
  ] = useState(
    () =>
      localStorage.getItem(
        "chatbotEmergency"
      ) === "true"
  );


  // ==========================================================
  // COMPLETED
  // ==========================================================

  const [
    completed,
    setCompleted
  ] = useState(
    () =>
      localStorage.getItem(
        "chatbotCompleted"
      ) === "true"
  );


  // ==========================================================
  // PREDICTION
  // ==========================================================

  const [
    prediction,
    setPrediction
  ] = useState(
    () => {

      const saved =
        localStorage.getItem(
          "chatbotPrediction"
        );

      return saved
        ? JSON.parse(saved)
        : null;
    }
  );


  // ==========================================================
  // PATIENT PROFILE
  // ==========================================================

  const [
    patientProfile,
    setPatientProfile
  ] = useState(null);

  const [
    profileLoading,
    setProfileLoading
  ] = useState(true);

  useEffect(() => {
    const loadPatientProfile = async () => {
      try {
        const response = await api.get("/profile/patient-profile");
        setPatientProfile(response.data || null);
      } catch (error) {
        console.error(
          "❌ Patient profile loading error:",
          error.response?.data || error.message
        );
        setPatientProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };
    loadPatientProfile();
  }, []);


  // INPUT
  // ==========================================================

  const [
    inputValue,
    setInputValue
  ] = useState("");


  // ==========================================================
  // TYPING
  // ==========================================================

  const [
    isTyping,
    setIsTyping
  ] = useState(false);

  // Prevent Enter + Send click (or rapid double click) from
  // submitting the same message twice before React re-renders.
  const sendLockRef = useRef(false);


  // ==========================================================
  // SAVE STATE
  // ==========================================================

  useEffect(() => {

    localStorage.setItem(
      "chatHistory",
      JSON.stringify(chat)
    );

    localStorage.setItem(
      "chatbotPhase",
      phase
    );

    localStorage.setItem(
      "chatbotQuestionIndex",
      questionIndex.toString()
    );

    localStorage.setItem(
      "chatbotAnswers",
      JSON.stringify(
        mlAnswers
      )
    );

    localStorage.setItem(
      "chatbotEmergency",
      emergency.toString()
    );

    localStorage.setItem(
      "chatbotCompleted",
      completed.toString()
    );


    if (prediction) {

      localStorage.setItem(
        "chatbotPrediction",
        JSON.stringify(
          prediction
        )
      );

    }

  }, [
    chat,
    phase,
    questionIndex,
    mlAnswers,
    emergency,
    completed,
    prediction
  ]);


  // ==========================================================
  // CLEAR CHATBOT STATE WHEN LEAVING THIS PAGE
  //
  // Chat history and in-progress assessment state are intentionally
  // NOT retained between visits/logins. The assessment itself is
  // already saved to the backend when completed.
  // ==========================================================

  useEffect(() => {
    return () => {
      localStorage.removeItem("chatHistory");
      localStorage.removeItem("chatbotPhase");
      localStorage.removeItem("chatbotQuestionIndex");
      localStorage.removeItem("chatbotAnswers");
      localStorage.removeItem("chatbotEmergency");
      localStorage.removeItem("chatbotCompleted");
      localStorage.removeItem("chatbotPrediction");
      // IMPORTANT:
      // Do NOT delete "report" here.
      // The completed assessment report must survive route/tab changes.
      // "Clear Chat" below remains the explicit action that clears the report.
      localStorage.removeItem("chatbotVersion");
    };
  }, []);


  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  useEffect(() => {

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [
    chat,
    isTyping
  ]);


  // ==========================================================
  // QUESTIONS
  // AGE + GENDER COME FROM THE PATIENT PROFILE.
  // The chatbot asks the remaining 14 ML features.
  // ==========================================================

  const questions = [
    { feature: "prolonged_bleeding_minor_cut", text: t.minorCuts, type: "ordinal" },
    { feature: "excessive_post_surgery_bleeding", text: t.surgery, type: "binary" },
    { feature: "excessive_dental_bleeding", text: t.dental, type: "binary" },
    { feature: "easy_bruising", text: t.bruising, type: "ordinal" },
    { feature: "muscle_hematoma", text: t.muscle, type: "binary" },
    { feature: "recurrent_joint_bleeding", text: t.joint, type: "binary" },
    { feature: "joint_warmth", text: t.warmth, type: "binary" },
    { feature: "joint_tightness", text: t.tightness, type: "binary" },
    { feature: "reduced_joint_mobility", text: t.reducedMovement, type: "binary" },
    { feature: "hematuria", text: t.urine, type: "binary" },
    { feature: "hematochezia", text: t.stool, type: "binary" },
    { feature: "family_history_bleeding_disorder", text: t.family, type: "binary" },
    { feature: "male_relative_with_hemophilia", text: t.maleRelative, type: "binary" },
    { feature: "previous_factor_test", text: t.factorTest, type: "binary" },
  ];


  // DETECT NORMAL ANSWER
  // ==========================================================

  const detectAnswer = (
    input,
    type
  ) => {

    const value =
      input
        .toLowerCase()
        .trim();


    // --------------------------------------------------------
    // BINARY
    // --------------------------------------------------------

    if (
      type === "binary"
    ) {

      if (
        /\b(yes|y)\b/.test(
          value
        )
      ) {

        return "yes";
      }


      if (
        /\b(no|n)\b/.test(
          value
        )
      ) {

        return "no";
      }


      if (
        value === "हाँ" ||
        value === "होय" ||
        value === "हो"
      ) {

        return "yes";
      }


      if (
        value === "नहीं" ||
        value === "नाही"
      ) {

        return "no";
      }

      return "other";
    }


    // --------------------------------------------------------
    // ORDINAL
    // --------------------------------------------------------

    if (
      type === "ordinal"
    ) {

      if (
        value.includes("never") ||
        value.includes("कभी नहीं") ||
        value.includes("कधीच नाही")
      ) {

        return "never";
      }


      if (
        value.includes("sometimes") ||
        value.includes("कभी-कभी") ||
        value.includes("कधीकधी")
      ) {

        return "sometimes";
      }


      if (
        value.includes("often") ||
        value.includes("अक्सर") ||
        value.includes("अनेकदा")
      ) {

        return "often";
      }

      return "other";
    }


    // --------------------------------------------------------
    // SEX
    // --------------------------------------------------------

    if (
      type === "sex"
    ) {

      if (
        value === "male" ||
        value === "m" ||
        value === "पुरुष"
      ) {

        return "male";
      }


      if (
        value === "female" ||
        value === "f" ||
        value === "महिला"
      ) {

        return "female";
      }


      return "other";
    }


    return "other";
  };


  // ==========================================================
  // BOT MESSAGE
  // ==========================================================

  const botReply = (
    text,
    meta = {}
  ) => {

    setIsTyping(true);


    setTimeout(
      () => {

        setIsTyping(false);

        setChat(
          (current) => [
            ...current,
            {
              from: "bot",
              text,
              ...meta,
            }
          ]
        );

      },
      500
    );
  };


  // ==========================================================
  // AI CALL
  // ==========================================================

  const callAI = async (
    message
  ) => {

    try {

      const response =
        await api.post(
          "/chatbot/message",
          {
            message,

            language:
              currentLanguage,

            languageName:
              currentLanguage === "hi"
                ? "Hindi"
                : currentLanguage === "mr"
                ? "Marathi"
                : "English",
          }
        );


      return (
        response.data.reply ||
        t.aiUnavailable
      );

    } catch (error) {

      console.error(
        "AI ERROR:",
        error
      );

      return t.aiUnavailable;
    }
  };


  // ==========================================================
  // ADD USER MESSAGE
  // ==========================================================

  const addUserMessage = (
    message
  ) => {

    setChat(
      (current) => [
        ...current,
        {
          from: "user",
          text: message,
        }
      ]
    );
  };


  // ==========================================================
  // RED FLAG ANSWER
  // ==========================================================

  const handleRedFlagAnswer = async (
    answer,
    displayAnswer = answer
  ) => {

    addUserMessage(
      displayAnswer
    );


    const normalized =
      answer
        .toLowerCase()
        .trim();


    const isYes =
      normalized === "yes" ||
      normalized === "y" ||
      normalized === "हाँ" ||
      normalized === "होय" ||
      normalized === "हो";


    const isNo =
      normalized === "no" ||
      normalized === "n" ||
      normalized === "नहीं" ||
      normalized === "नाही";


    // ========================================================
    // YES → URGENT
    // ========================================================

    if (isYes) {

      setEmergency(true);

      setPhase(
        "emergency"
      );


      botReply(
        `## ${t.urgentTitle}

${t.urgentMessage}`,
        { messageKey: "urgent" }
      );


      // ------------------------------------------------------
      // Save emergency assessment
      // ------------------------------------------------------

      try {

        await api.post(
          "/assessment/save",
          {

            score: 0,

            totalScore: 0,

            riskLevel:
              "Emergency",

            emergencyFlag:
              true,

            strongSuspicionFlag:
              false,

            answers: [
              {
                question:
                  t.redFlagQuestion,

                answer:
                  "yes",
              }
            ],

            explanation: [
              "Current red-flag symptom reported."
            ],

            q1EmergencySymptoms: [
              "Current red-flag symptom reported"
            ],

          }
        );

      } catch (error) {

        console.error(
          "Emergency save error:",
          error
        );
      }


      return;
    }


    // ========================================================
    // NO → CONTINUE
    // ========================================================

    if (isNo) {

      if (profileLoading || !patientProfile?.age || !patientProfile?.gender) {
        botReply(t.profileMissing);
        setTimeout(() => navigate("/register/profile"), 700);
        return;
      }

      setPhase("profileConfirm");

      botReply(
        `${t.continuing}

## ${t.profileConfirmTitle}

${t.profileConfirmMessage}

**${t.profileAge}:** ${patientProfile.age}

**${t.profileGender}:** ${patientProfile.gender}

${t.profileConfirmQuestion}`,
        { messageKey: "profileConfirm" }
      );

      return;
    }


    // ========================================================
    // GENERAL QUESTION DURING RED-FLAG ASSESSMENT
    //
    // Example:
    // "What should I eat in hemophilia?"
    //
    // Answer the question first, then return to the red-flag
    // assessment question. Do not treat the question as yes/no.
    // ========================================================

    addUserMessage(
      displayAnswer
    );

    setIsTyping(
      true
    );

    const reply =
      await callAI(
        displayAnswer
      );

    setIsTyping(
      false
    );

    setChat(
      (current) => [
        ...current,
        {
          from: "bot",
          text: reply,
        },
        {
          from: "bot",
          text: t.continuing,
          messageKey: "continuing",
        },
        {
          from: "bot",
          text: t.redFlagQuestion,
          messageKey: "redFlagQuestion",
        },
      ]
    );
  };


  // ==========================================================
  // PROFILE CONFIRMATION
  // ==========================================================

  const handleProfileConfirm = async (answer, displayAnswer = answer) => {
    addUserMessage(displayAnswer);

    const normalized = String(answer).toLowerCase().trim();
    const isYes = ["yes", "y", "हाँ", "होय", "हो"].includes(normalized);
    const isNo = ["no", "n", "नहीं", "नाही"].includes(normalized);

    if (isYes) {
      const age = Number(patientProfile?.age);
      const gender = String(patientProfile?.gender || "").trim().toLowerCase();

      if (!Number.isFinite(age) || age < 0 || age > 120 || !["male", "female"].includes(gender)) {
        botReply(t.profileMissing);
        return;
      }

      setPhase("questions");
      setQuestionIndex(0);
      botReply(questions[0].text, {
        messageKey: "question",
        questionFeature: questions[0].feature,
      });
      return;
    }

    if (isNo) {
      botReply(t.profileMissing);
      setTimeout(() => navigate("/register/profile"), 700);
      return;
    }

    botReply(t.profileConfirmQuestion);
  };


  // NORMAL QUESTION ANSWER
  // ==========================================================

  const handleQuestionAnswer = async (
    input,
    displayAnswer = input
  ) => {

    const question =
      questions[
        questionIndex
      ];


    if (!question) {
      return;
    }


    // ========================================================
    // DETECT NORMAL ASSESSMENT ANSWER
    // ========================================================

    const answer =
      detectAnswer(
        input,
        question.type
      );


    // ========================================================
    // GENERAL QUESTION DURING ASSESSMENT
    //
    // Example:
    // "What should I eat after hemophilia diagnosis?"
    //
    // It is NOT treated as an invalid assessment answer.
    // The AI answers it, then the SAME assessment question
    // appears again so the assessment continues normally.
    // ========================================================

    if (
      answer === "other"
    ) {

      addUserMessage(
        displayAnswer
      );


      setIsTyping(
        true
      );


      const reply =
        await callAI(
          input.trim()
        );


      setIsTyping(
        false
      );


      setChat(
        (current) => [
          ...current,
          {
            from: "bot",
            text: reply,
          },
          {
            from: "bot",
            text:
              `${t.continuing}\n\n${question.text}`,
            messageKey: "question",
            questionFeature:
              question.feature,
          }
        ]
      );


      return;
    }


    // ========================================================
    // CANONICAL ANSWER
    //
    // These values are always English.
    // They are what goes to the ML model/database.
    // ========================================================

    const updatedAnswers = {

      ...mlAnswers,

      [question.feature]:
        answer,

    };


    setMlAnswers(
      updatedAnswers
    );


    // ========================================================
    // ADD USER MESSAGE
    // ========================================================

    addUserMessage(
      displayAnswer
    );


    // ========================================================
    // NEXT
    // ========================================================

    const nextIndex =
      questionIndex + 1;


    // ========================================================
    // MORE QUESTIONS
    // ========================================================

    if (
      nextIndex <
      questions.length
    ) {

      setQuestionIndex(
        nextIndex
      );


      botReply(
        questions[nextIndex].text,
        {
          messageKey: "question",
          questionFeature:
            questions[nextIndex].feature,
        }
      );


      return;
    }


    // ========================================================
    // COMPLETE
    // ========================================================

    finishAssessment(
      updatedAnswers
    );
  };


  // ==========================================================
  // RUN ML MODEL
  // ==========================================================

  // ==========================================================
// RUN ML MODEL
// ==========================================================

const finishAssessment = async (
  finalAnswers
) => {

  setIsTyping(true);

  try {

    // ======================================================
    // SEND FEATURES TO CALIBRATED ML MODEL
    // ======================================================

    const profileAge = Number(patientProfile?.age);
    const profileGender = String(patientProfile?.gender || "").trim().toLowerCase();

    if (!Number.isFinite(profileAge) || profileAge < 0 || profileAge > 120 || !["male", "female"].includes(profileGender)) {
      throw new Error("Valid age and gender are required from the patient profile.");
    }

    const modelAnswers = {
      age: profileAge,
      sex: profileGender,
      ...finalAnswers,
    };

    const predictionResponse =
      await api.post(
        "/chatbot/predict",
        {
          ...modelAnswers,
          language: currentLanguage,
        }
      );


    const result =
      predictionResponse.data;


    // ======================================================
    // VALIDATE RESPONSE
    // ======================================================

    if (
      !result.success
    ) {

      throw new Error(
        "ML prediction failed."
      );

    }


    // ======================================================
    // GET PREDICTION CONFIDENCE
    // ======================================================

    const predictionConfidence =
      Number(
        result.predictionConfidence
      );


    // ======================================================
    // VALIDATE CONFIDENCE
    // ======================================================

    if (
      !Number.isFinite(
        predictionConfidence
      )
    ) {

      console.error(
        "❌ Invalid prediction confidence:",
        result.predictionConfidence
      );

      throw new Error(
        "Invalid prediction confidence received from server."
      );

    }


    // ======================================================
    // CONVERT TO PERCENTAGE
    // ======================================================

    const confidence =
      Math.round(
        predictionConfidence * 100
      );


    // ======================================================
    // SAVE PREDICTION
    // ======================================================

    setPrediction({

      ...result,

      predictionConfidence:
        predictionConfidence,

    });


    // ======================================================
    // COMPLETE ASSESSMENT
    // ======================================================

    setCompleted(
      true
    );

    setPhase(
      "completed"
    );

    setIsTyping(
      false
    );


    // ======================================================
    // PREDICTION MESSAGE
    // ======================================================

    const predictionMessage =
      `## ${t.predictionTitle}

${t.predictionMessage}

### ${result.displayLabel}

${t.predictionConfidence}: **${confidence}%**

> ${t.screeningOnly}`;


    // ======================================================
    // DISPLAY RESULT
    // ======================================================

    setChat(
      (current) => [

        ...current,

        {

          from:
            "bot",

          text:
            predictionMessage,

          messageKey:
            "prediction",

          predictionData: {

            prediction:
              result.prediction,

            predictionLabel:
              result.predictionLabel,

            displayLabel:
              result.displayLabel,

            predictionConfidence:
              predictionConfidence,

          },

        },

      ]
    );


    // ======================================================
    // SAVE TO DATABASE
    // ======================================================

    try {

      await api.post(
        "/assessment/save",
        {

          // ------------------------------------------------
          // SCORE
          // ------------------------------------------------

          score:
            result.prediction,

          totalScore:
            result.prediction,

          riskLevel:
            result.predictionLabel,


          // ------------------------------------------------
          // ML PREDICTION
          // ------------------------------------------------

          mlPrediction:
            result.prediction,

          mlPredictionLabel:
            result.predictionLabel,


          // ------------------------------------------------
          // ML CONFIDENCE
          //
          // Existing MongoDB field name is kept for
          // compatibility.
          // ------------------------------------------------

          mlPredictionProbability:
            predictionConfidence,


          // ------------------------------------------------
          // ALL CLASS PROBABILITIES
          // ------------------------------------------------

          mlProbabilities:
            result.probabilities,


          // ------------------------------------------------
          // FLAGS
          // ------------------------------------------------

          emergencyFlag:
            false,

          strongSuspicionFlag:
            result.prediction >= 2,


          // ------------------------------------------------
          // ANSWERS
          // ------------------------------------------------

          answers:
            Object.entries(
              modelAnswers
            ).map(
              ([feature, answer]) => ({

                question:
                  feature,

                answer:
                  String(answer),

              })
            ),


          // ------------------------------------------------
          // EXPLANATION
          // ------------------------------------------------

          explanation: [

            `ML screening prediction: ${result.predictionLabel}`,

            `Prediction confidence: ${confidence}%`,

          ],


          // ------------------------------------------------
          // EXISTING STRUCTURED FIELDS
          // ------------------------------------------------

          q1EmergencySymptoms:
            [],

          q2BleedMinorCuts:
            finalAnswers
              .prolonged_bleeding_minor_cut,

          q3DentalSurgeryBleeding:
            finalAnswers
              .excessive_dental_bleeding,

          q4Bruises:
            finalAnswers
              .easy_bruising,

          q5MuscleSwelling:
            finalAnswers
              .muscle_hematoma,

          q6JointSwelling:
            finalAnswers
              .recurrent_joint_bleeding,

          q8JointWarmth:
            finalAnswers
              .joint_warmth,

          q9BloodUrineStool:

            finalAnswers.hematuria === "yes" ||
            finalAnswers.hematochezia === "yes"

              ? "yes"

              : "no",

          q10FamilyHistory:
            finalAnswers
              .family_history_bleeding_disorder,

          q12PreviousTesting:
            finalAnswers
              .previous_factor_test,


          // ------------------------------------------------
          // ML FEATURES
          // ------------------------------------------------

          mlFeatures:
            modelAnswers,

        }
      );


      // ====================================================
      // CONSOLE
      // ====================================================

      console.log(
        "================================="
      );

      console.log(
        "✅ ASSESSMENT SAVED"
      );

      console.log(
        "ML Prediction:",
        result.prediction
      );

      console.log(
        "ML Label:",
        result.predictionLabel
      );

      console.log(
        "Prediction Confidence:",
        predictionConfidence
      );

      console.log(
        "Prediction Confidence %:",
        `${confidence}%`
      );

      console.log(
        "Probabilities:",
        result.probabilities
      );

      console.log(
        "================================="
      );


    } catch (saveError) {

      console.error(
        "❌ Assessment save error:",
        saveError.response?.data ||
        saveError.message
      );

    }


    // ======================================================
    // SAVE REPORT DATA
    // ======================================================

    localStorage.setItem(
      "report",

      JSON.stringify({

        score:
          result.prediction,

        risk:
          result.predictionLabel,

        prediction:
          result.prediction,

        predictionLabel:
          result.predictionLabel,

        displayLabel:
          result.displayLabel,


        // ------------------------------------------------
        // NEW FIELD
        // ------------------------------------------------

        predictionConfidence:
          predictionConfidence,


        // ------------------------------------------------
        // OLD DATABASE COMPATIBILITY FIELD
        // ------------------------------------------------

        mlPredictionProbability:
          predictionConfidence,


        // ------------------------------------------------
        // ALL PROBABILITIES
        // ------------------------------------------------

        probabilities:
          result.probabilities,

        mlProbabilities:
          result.probabilities,


        // ------------------------------------------------
        // ANSWERS
        // ------------------------------------------------

        answers:
          modelAnswers,


        // ------------------------------------------------
        // FEATURES
        // ------------------------------------------------

        mlFeatures:
          modelAnswers,


        // ------------------------------------------------
        // EXPLANATION
        // ------------------------------------------------

        explanation: [

          `ML screening prediction: ${result.predictionLabel}`,

          `Prediction confidence: ${confidence}%`,

        ],

      })
    );


  } catch (error) {

    console.error(
      "❌ ML PREDICTION ERROR:",
      error
    );


    setIsTyping(
      false
    );


    botReply(
      t.predictionError
    );

  }

};


  // ==========================================================
  // HANDLE USER ANSWER
  // ==========================================================

const handleAnswer = async (
  input,
  displayText = input
) => {

    if (
      isTyping ||
      !input ||
      !input.trim()
    ) {
      return;
    }


    const cleanInput =
      input.trim();


    setInputValue(
      ""
    );


    // ========================================================
    // PROFILE CONFIRMATION
    // ========================================================

    if (phase === "profileConfirm") {
      await handleProfileConfirm(cleanInput, displayText);
      return;
    }


    // EMERGENCY PHASE
    // ========================================================

    if (
      phase === "redFlag"
    ) {

      await handleRedFlagAnswer(
        cleanInput,
        displayText
      );

      return;
    }


    // ========================================================
    // EMERGENCY COMPLETE
    // ========================================================

    if (
      phase === "emergency"
    ) {

      return;
    }


    // ========================================================
    // COMPLETED → AI CHAT
    // ========================================================

    if (
      phase === "completed" ||
      completed
    ) {

      addUserMessage(
        cleanInput
      );


      setIsTyping(
        true
      );


      const reply =
        await callAI(
          cleanInput
        );


      setIsTyping(
        false
      );


      setChat(
        (current) => [
          ...current,
          {
            from: "bot",
            text: reply,
          }
        ]
      );


      return;
    }


    // ========================================================
    // NORMAL QUESTIONS
    // ========================================================

    if (
      phase === "questions"
    ) {

      handleQuestionAnswer(
        cleanInput,
        displayText
      );

    }

  };


  // ==========================================================
  // OPTIONS
  // ==========================================================

  const getOptions = () => {

    if (
      phase === "redFlag"
    ) {

      return [
        {
          value: "yes",
          label: t.yes,
        },
        {
          value: "no",
          label: t.no,
        }
      ];
    }


    if (phase === "profileConfirm") {
      return [
        { value: "yes", label: t.profileConfirmYes },
        { value: "no", label: t.profileConfirmNo },
      ];
    }


    if (
      phase === "emergency"
    ) {

      return [];
    }


    if (
      phase === "completed"
    ) {

      return [];
    }


    const question =
      questions[
        questionIndex
      ];


    if (!question) {
      return [];
    }


    if (
      question.type === "sex"
    ) {

      return [
        {
          value: "male",
          label: t.male,
        },
        {
          value: "female",
          label: t.female,
        }
      ];
    }


    if (
      question.type === "ordinal"
    ) {

      return [
        {
          value: "never",
          label: t.never,
        },
        {
          value: "sometimes",
          label: t.sometimes,
        },
        {
          value: "often",
          label: t.often,
        }
      ];
    }


    if (
      question.type === "binary"
    ) {

      return [
        {
          value: "yes",
          label: t.yes,
        },
        {
          value: "no",
          label: t.no,
        }
      ];
    }


    return [];
  };


  // ==========================================================
  // SEND
  // ==========================================================

  const handleSend = () => {

    // Strong synchronous lock: prevents Enter + button click,
    // rapid clicks, and duplicate browser events from sending
    // the same query more than once.
    if (
      isTyping ||
      sendLockRef.current
    ) {
      return;
    }

    const value =
      inputValue.trim();

    if (!value) {
      return;
    }

    // Lock BEFORE starting handleAnswer.
    sendLockRef.current = true;

    // Clear input immediately so the same query cannot be
    // accidentally submitted again from the current UI state.
    setInputValue("");

    Promise.resolve(
      handleAnswer(value)
    ).finally(() => {
      sendLockRef.current = false;
    });
  };


  // ==========================================================
  // ENTER
  // ==========================================================

  const handleInputKeyDown = (
    event
  ) => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      handleSend();
    }
  };


  // ==========================================================
  // CLEAR
  // ==========================================================

  const clearChat = () => {

    localStorage.removeItem(
      "chatHistory"
    );

    localStorage.removeItem(
      "chatbotPhase"
    );

    localStorage.removeItem(
      "chatbotQuestionIndex"
    );

    localStorage.removeItem(
      "chatbotAnswers"
    );

    localStorage.removeItem(
      "chatbotEmergency"
    );

    localStorage.removeItem(
      "chatbotCompleted"
    );

    localStorage.removeItem(
      "chatbotPrediction"
    );

    localStorage.removeItem(
      "report"
    );

    localStorage.removeItem(
      "chatbotVersion"
    );

    window.location.reload();
  };


  // ==========================================================
  // LANGUAGE-AWARE MESSAGE RENDERING
  // ==========================================================
  // Questionnaire messages are stored by key, not by translated
  // text. This keeps the chat history language-independent.
  // ==========================================================

  const getPredictionLabel = (value) => {
    const labels = {
      en: {
        0: "Healthy",
        1: "Mild",
        2: "Moderate",
        3: "Severe",
      },
      hi: {
        0: "स्वस्थ",
        1: "हल्का",
        2: "मध्यम",
        3: "गंभीर",
      },
      mr: {
        0: "निरोगी",
        1: "सौम्य",
        2: "मध्यम",
        3: "गंभीर",
      },
    };

    return labels[currentLanguage]?.[value] || labels.en[value] || "Unknown";
  };


  const getMessageText = (message) => {
    if (message.messageKey === "redFlagQuestion") {
      return t.redFlagQuestion;
    }

    if (message.messageKey === "redFlagRetry") {
      return `${t.invalidAnswer}

${t.redFlagQuestion}`;
    }

    if (message.messageKey === "urgent") {
      return `## ${t.urgentTitle}

${t.urgentMessage}`;
    }

    if (message.messageKey === "invalidAnswer") {
      return t.invalidAnswer;
    }

    if (
      message.messageKey === "question" &&
      message.questionFeature
    ) {
      const question = questions.find(
        (item) => item.feature === message.questionFeature
      );

      return question?.text || message.text;
    }

    if (
      message.messageKey === "continuingQuestion" &&
      message.questionFeature
    ) {
      const question = questions.find(
        (item) => item.feature === message.questionFeature
      );

      return `${t.continuing}

${question?.text || message.text}`;
    }

    if (message.messageKey === "profileConfirm") {
      return `${t.continuing}

## ${t.profileConfirmTitle}

${t.profileConfirmMessage}

**${t.profileAge}:** ${patientProfile?.age ?? "-"}

**${t.profileGender}:** ${patientProfile?.gender ?? "-"}

${t.profileConfirmQuestion}`;
    }

    if (
      message.messageKey === "prediction" &&
      message.predictionData
    ) {
      const data = message.predictionData;

      return `## ${t.predictionTitle}

${t.predictionMessage}

### ${getPredictionLabel(data.prediction)}

${t.predictionConfidence}: **${Math.round(Number(data.predictionConfidence) * 100)}%**

> ${t.screeningOnly}`;
    }

    return message.text;
  };


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="chat-page">

      <div className="chat-container">


        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="chat-header">

          <div className="chat-header-left">

            <div className="chat-avatar">
              +
            </div>

            <div>

              <h2>
                {t.header}
              </h2>

              <p>
                {completed
                  ? t.aiAssistant
                  : t.guided}
              </p>

            </div>

          </div>


          <div className="chat-status">

            <span className="status-dot"></span>

            {completed
              ? t.available
              : t.active}

          </div>

        </div>


        {/* ====================================================
            CHAT
        ==================================================== */}

        <div className="chat-box">

          {chat.map(
            (message, index) => (

              <div
                key={index}
                className={
                  message.from
                }
              >

                <ReactMarkdown
                  remarkPlugins={[
                    remarkGfm
                  ]}
                >
                  {getMessageText(message)}
                </ReactMarkdown>

              </div>

            )
          )}


          {isTyping && (

            <div className="bot typing-bubble">

              <span></span>
              <span></span>
              <span></span>

            </div>

          )}


          <div
            ref={chatEndRef}
          />

        </div>


        {/* ====================================================
            QUICK OPTIONS
        ==================================================== */}

        {!completed &&
          !isTyping &&
          phase !== "emergency" && (

            <div className="options-area">

              <div className="options-label">

                {t.chooseAnswer}

              </div>


              <div className="options">

                {getOptions().map(
                  (option) => (

                    <button
                      key={
                        option.value
                      }

                      onClick={() =>
                        handleAnswer(
                          option.value,
                          option.label
                        )
                      }
                    >

                      {option.label}

                    </button>

                  )
                )}

              </div>

            </div>

          )}


        {/* ====================================================
            INPUT
        ==================================================== */}

        


        {/* ====================================================
            COMPLETED
        ==================================================== */}

        {completed && (

          <div className="completed-area">

            <div className="completed-check">
              ✓
            </div>


            <div className="completed-content">

              <strong>
                {t.assessmentCompleted}
              </strong>

              <span>
                {t.assessmentSaved}
              </span>

            </div>


            <button
              className="view-report-button"

              onClick={() =>
                navigate(
                  "/report"
                )
              }
            >

              📄 {t.viewReport}

            </button>

          </div>

        )}


        {/* ====================================================
            CLEAR
        ==================================================== */}

        <div className="chat-footer">

          <button
            className="clear-button"

            onClick={
              clearChat
            }
          >

            🗑 {t.clearAssessment}

          </button>


          <span>
            {t.screeningGuidance}
          </span>

        </div>

      </div>


      {/* ======================================================
          DISCLAIMER
      ====================================================== */}

      <div className="chat-disclaimer">

        <span className="info-icon">
          i
        </span>

        {t.disclaimer}

      </div>

    </div>
  );
}