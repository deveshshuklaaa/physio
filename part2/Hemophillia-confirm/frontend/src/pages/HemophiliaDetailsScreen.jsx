


// // import React, { useEffect, useState } from "react";
// // import api from "../apiClient";
// // import { useNavigate } from "react-router-dom";
// // import { useTranslation } from "react-i18next";


// // // =====================================================
// // // DOCTOR NAME TRANSLATIONS
// // // =====================================================
// // // Doctor names are normally proper names, but the current
// // // registered doctors are translated here because the UI
// // // requirement is to display their names in Hindi/Marathi.
// // //
// // // The professional ID is used as the stable key so that
// // // changing the doctor's name in the database does not
// // // accidentally translate the wrong doctor.
// // const DOCTOR_NAME_TRANSLATIONS = {
// // //   hi: {
// // //     DOC001: "डॉ. सुहानी सूर्यवंशी",
// // //     DOC002: "डॉ. टेस्ट डॉक्टर",
// // //     DOC003: "आयुष सोनी",
// // //   },
// // //   mr: {
// // //     DOC001: "डॉ. सुहानी सूर्यवंशी",
// // //     DOC002: "डॉ. टेस्ट डॉक्टर",
// // //     DOC003: "आयुष सोनी",
// // //   },
// // };

// // const getDoctorDisplayName = (doctor, language) => {
// //   if (!doctor) return "";

// //   if (language === "en") {
// //     return doctor.fullName || "";
// //   }

// //   return (
// //     DOCTOR_NAME_TRANSLATIONS[language]?.[doctor.professionalId] ||
// //     doctor.fullName ||
// //     ""
// //   );
// // };

// // // =====================================================
// // // MULTI-SELECT MEDICATION DROPDOWN
// // // =====================================================

// // const MedicationDropdown = ({ value, onChange, txt }) => {
// //   const [open, setOpen] = useState(false);

// //   const selectedValues = Array.isArray(value) ? value : [];

// //   const options = [
// //     {
// //       value: "Tranexamic acid",
// //       label: txt.medicationOptions.tranexamicAcid,
// //     },
// //     {
// //       value: "Paracetamol / Acetaminophen",
// //       label: txt.medicationOptions.paracetamol,
// //     },
// //     {
// //       value: "Iron supplement",
// //       label: txt.medicationOptions.iron,
// //     },
// //     {
// //       value: "Pain medication",
// //       label: txt.medicationOptions.painMedication,
// //     },
// //     {
// //       value: "Other",
// //       label: txt.medicationOptions.other,
// //     },
// //     {
// //       value: "None",
// //       label: txt.medicationOptions.none,
// //     },
// //   ];

// //   const toggleOption = (optionValue) => {
// //     let updated = [...selectedValues];

// //     // "None" is mutually exclusive with every medication.
// //     if (optionValue === "None") {
// //       onChange(["None"]);
// //       setOpen(false);
// //       return;
// //     }

// //     // Remove None if a real medication is selected.
// //     updated = updated.filter((item) => item !== "None");

// //     if (updated.includes(optionValue)) {
// //       updated = updated.filter((item) => item !== optionValue);
// //     } else {
// //       updated.push(optionValue);
// //     }

// //     onChange(updated);
// //   };

// //   const selectedLabels = options
// //     .filter((option) => selectedValues.includes(option.value))
// //     .map((option) => option.label);

// //   return (
// //     <div className="medication-dropdown">
// //       <button
// //         type="button"
// //         className="medication-dropdown-button"
// //         onClick={() => setOpen((prev) => !prev)}
// //       >
// //         <span className="medication-dropdown-value">
// //           {selectedLabels.length > 0
// //             ? selectedLabels.join(", ")
// //             : txt.medicationOptions.placeholder}
// //         </span>

// //         <span className="medication-dropdown-arrow">
// //           {open ? "⌃" : "⌄"}
// //         </span>
// //       </button>

// //       {open && (
// //         <>
// //           <button
// //             type="button"
// //             className="medication-dropdown-overlay"
// //             aria-label="Close medication dropdown"
// //             onClick={() => setOpen(false)}
// //           />

// //           <div className="medication-dropdown-menu">
// //             {options.map((option) => (
// //               <label
// //                 key={option.value}
// //                 className="medication-option"
// //               >
// //                 <input
// //                   type="checkbox"
// //                   checked={selectedValues.includes(option.value)}
// //                   onChange={() => toggleOption(option.value)}
// //                 />

// //                 <span>{option.label}</span>
// //               </label>
// //             ))}
// //           </div>
// //         </>
// //       )}
// //     </div>
// //   );
// // };

// // const HemophiliaDetailsScreen = () => {
// //   const navigate = useNavigate();
// //   const { i18n } = useTranslation();

// //   // =====================================================
// //   // LANGUAGE
// //   // =====================================================

// //   const currentLanguage =
// //     (i18n.language || "en").split("-")[0];

// //   const language = ["en", "hi", "mr"].includes(
// //     currentLanguage
// //   )
// //     ? currentLanguage
// //     : "en";

// //   // =====================================================
// //   // TRANSLATIONS
// //   // =====================================================

// //   const TEXT = {
// //     en: {

// //       treatmentOptions: {
// //     title: "Current Hemophilia Treatment",
// //     label: "Current treatment",
// //     placeholder: "Select current treatment",
// //     none: "No current treatment",
// //     factorVIII: "Factor VIII",
// //     factorIX: "Factor IX",
// //     extendedVIII: "Extended half-life Factor VIII",
// //     extendedIX: "Extended half-life Factor IX",
// //     emicizumab: "Emicizumab",
// //     bypassingAgent: "Bypassing agent",
// //     other: "Other",
// //     otherPlaceholder: "Please specify other treatment",
// //   },

// //   medicationOptions: {
// //     title: "Other Medications",
// //     label: "Medications you are currently taking",
// //     placeholder: "Select medications",
// //     none: "None",
// //     tranexamicAcid: "Tranexamic acid",
// //     paracetamol: "Paracetamol / Acetaminophen",
// //     iron: "Iron supplement",
// //     painMedication: "Pain medication",
// //     other: "Other",
// //     otherPlaceholder: "Please specify other medication",
// //   },
// //       eyebrow: "PATIENT CLINICAL PROFILE",

// //       title: "Hemophilia Clinical Details",

// //       subtitle:
// //         "Provide your existing clinical information to help personalize your care guidance.",

// //       accurateTitle:
// //         "Keep your information accurate",

// //       accurateText:
// //         "These details help the application understand your current hemophilia profile, bleeding pattern, physiotherapy, and care needs.",

// //       classification:
// //         "Clinical Classification",

// //       classificationDesc:
// //         "Basic information about your diagnosis",

// //       type:
// //         "Type of Hemophilia",

// //       selectType:
// //         "Select type",

// //       typeA:
// //         "Hemophilia A",

// //       typeB:
// //         "Hemophilia B",

// //       typeC:
// //         "Hemophilia C",

// //       severity:
// //         "Severity",

// //       selectSeverity:
// //         "Select severity",

// //       mild:
// //         "Mild",

// //       moderate:
// //         "Moderate",

// //       severe:
// //         "Severe",

// //       ageDiagnosis:
// //         "Age at Diagnosis",

// //       enterAge:
// //         "Enter age",

// //       treatment:
// //         "Treatment Profile",

// //       treatmentDesc:
// //         "Your current treatment and medications",

// //       factorTherapy:
// //         "Current Hemophilia Treatment",

// //       factorPlaceholder:
// //         "e.g. Factor VIII replacement",

// //       medications:
// //         "Medications You Are Currently Taking",

// //       medicationsPlaceholder:
// //         "Enter medications if any",

// //       bleeding:
// //         "Bleeding Pattern",

// //       bleedingDesc:
// //         "Information about your bleeding history and affected joints",

// //       bleedingPattern:
// //         "Bleeding Pattern",

// //       selectPattern:
// //         "Select bleeding pattern",

// //       spontaneous:
// //         "Spontaneous bleeding",

// //       trauma:
// //         "Bleeding after injury / trauma",

// //       procedure:
// //         "Bleeding after medical or dental procedure",

// //       mixed:
// //         "Mixed / more than one pattern",

// //       other:
// //         "Other",

// //       affectedJoints:
// //         "Affected Joints",

// //       affectedJointsHelp:
// //         "Select all joints that are currently affected or have experienced bleeding.",

// //       selectedJoints:
// //         "Selected joints",

// //       noJointsSelected:
// //         "No joints selected",

// //       targetJoint:
// //         "Target Joint",

// //       selectTargetJoint:
// //         "Select target joint",

// //       none:
// //         "None",

// //       knee:
// //         "Knee",

// //       ankle:
// //         "Ankle",

// //       elbow:
// //         "Elbow",

// //       shoulder:
// //         "Shoulder",

// //       hip:
// //         "Hip",

// //       wrist:
// //         "Wrist",

// //       bleedFrequency:
// //         "Bleed Frequency",

// //       selectFrequency:
// //         "Select frequency",

// //       daily:
// //         "Daily",

// //       weekly:
// //         "Weekly",

// //       monthly:
// //         "Monthly",

// //       quarterly:
// //         "Every few months",

// //       rare:
// //         "Rare",

// //       lastBleed:
// //         "Last Bleed Date",

// //       otherDetails:
// //         "Any Other Detail",

// //       otherDetailsPlaceholder:
// //         "Enter any other information you would like your care team to know",

// //       physiotherapy:
// //         "Physiotherapy & Exercise",

// //       physiotherapyDesc:
// //         "Tell us about your current or previous physiotherapy experience",

// //       currentlyPhysio:
// //         "Are you currently undergoing physiotherapy?",

// //       selectOption:
// //         "Select option",

// //       yes:
// //         "Yes",

// //       no:
// //         "No",

// //       wherePhysio:
// //         "Where are you taking physiotherapy?",

// //       hospital:
// //         "Hospital",

// //       clinic:
// //         "Clinic",

// //       hemophiliaCentre:
// //         "Hemophilia Centre",

// //       home:
// //         "At home",

// //       sessions:
// //         "How many sessions a week?",

// //       onceWeek:
// //         "Once a week",

// //       twoThree:
// //         "2–3 times a week",

// //       moreThree:
// //         "More than 3 sessions a week",

// //       sessionDuration:
// //         "How many minutes does each session last?",

// //       lessTen:
// //         "Less than 10 minutes",

// //       tenTwenty:
// //         "10–20 minutes",

// //       twentyThirty:
// //         "20–30 minutes",

// //       moreThirty:
// //         "More than 30 minutes",

// //       affectedBodyPart:
// //         "Which body part is most affected and currently being treated?",

// //       treatmentReceived:
// //         "What kind of treatment are you receiving?",

// //       stretching:
// //         "Stretching",

// //       strengthening:
// //         "Strengthening",

// //       balance:
// //         "Balance exercises",

// //       generalFitness:
// //         "General fitness",

// //       jointMovement:
// //         "Joint movement exercises",

// //       painRelief:
// //         "Exercises for pain relief",

// //       equipment:
// //         "Are you using any equipment for exercise?",

// //       noEquipment:
// //         "No equipment",

// //       dumbbells:
// //         "Dumbbells",

// //       weightsCuffs:
// //         "Weight cuffs",

// //       theraband:
// //         "Theraband",

// //       yogaMat:
// //         "Yoga mat",

// //       otherEquipment:
// //         "Other equipment",

// //       helping:
// //         "Is physiotherapy helping you?",

// //       problems:
// //         "Do you have any problem while exercising or after the session?",

// //       noProblems:
// //         "No problem",

// //       pain:
// //         "Pain",

// //       newBleeding:
// //         "New bleeding",

// //       stiffness:
// //         "Stiffness",

// //       increasedSwelling:
// //         "Increased swelling",

// //       tired:
// //         "Feeling tired",

// //       previousPhysio:
// //         "Have you used physiotherapy previously?",

// //       stoppedWhen:
// //         "When did you stop physiotherapy?",

// //       stoppedWhy:
// //         "Why did you stop physiotherapy?",

// //       stoppedWhyPlaceholder:
// //         "Select the main reason",

// //       noNeed:
// //         "No longer needed",

// //       improved:
// //         "Symptoms improved",

// //       access:
// //         "Difficulty accessing physiotherapy",

// //       cost:
// //         "Cost / financial reasons",

// //       time:
// //         "Time constraints",

// //       doctor:
// //         "Consulting Doctor",

// //       doctorDesc:
// //         "Select the doctor who is currently managing your hemophilia care.",

// //       requestDoctorChange:
// //         "Request Doctor Change",

// //       requestDoctorChangeTitle:
// //         "Request a Doctor Change",

// //       requestDoctorChangeText:
// //         "Your current doctor must release you before you can select another doctor.",

// //       changeReason:
// //         "Reason for changing doctor",

// //       changeReasonPlaceholder:
// //         "Please tell us why you would like to change your doctor",

// //       cancel:
// //         "Cancel",

// //       sendRequest:
// //         "Send Request",

// //       sendingRequest:
// //         "Sending...",

// //       requestPending:
// //         "Doctor change request is pending. Your current doctor needs to release you.",

// //       selectDoctor:
// //         "Select doctor",

// //       noDoctors:
// //         "No approved doctors available",

// //       doctorLoading:
// //         "Loading doctors...",

// //       doctorId:
// //         "Professional ID",

// //       required:
// //         "*",

// //       mobility:
// //         "Mobility Limitation",

// //       selectMobility:
// //         "Select mobility limitation",

// //       noLimitation:
// //         "None",

// //       assistive:
// //         "Assistive Devices",

// //       assistivePlaceholder:
// //         "Select an assistive device",

// //       assistiveOptions: {
// //         none: "None",
// //         kneeBrace: "Knee Brace",
// //         ankleBrace: "Ankle / Foot Brace",
// //         elbowBrace: "Elbow Brace",
// //         wristSupport: "Wrist Support",
// //         cane: "Cane / Walking Stick",
// //         crutches: "Crutches",
// //         walker: "Walker",
// //         wheelchair: "Wheelchair",
// //         other: "Other",
// //       },

// //       errorRequired:
// //         "Please complete all required fields.",

// //       errorDoctor:
// //         "Unable to load doctors. Please try again.",

// //       errorSave:
// //         "Failed to save details. Please try again.",

// //       save:
// //         "Save & Continue",

// //       saving:
// //         "Saving...",

// //       back:
// //         "Back",

// //       secure:
// //         "Your clinical information is stored securely and used to personalize your care guidance.",

// //       previousPhysioSection:
// //         "Previous Physiotherapy",

// //       currentPhysioSection:
// //         "Current Physiotherapy Details",
// //     },

// //     // ===================================================
// //     // HINDI
// //     // ===================================================

// //     hi: {

// //       treatmentOptions: {
// //         title: "वर्तमान हीमोफीलिया उपचार",
// //         label: "वर्तमान उपचार",
// //         placeholder: "वर्तमान उपचार चुनें",
// //         none: "कोई वर्तमान उपचार नहीं",
// //         factorVIII: "फैक्टर VIII",
// //         factorIX: "फैक्टर IX",
// //         extendedVIII: "एक्सटेंडेड हाफ-लाइफ फैक्टर VIII",
// //         extendedIX: "एक्सटेंडेड हाफ-लाइफ फैक्टर IX",
// //         emicizumab: "एमिसिज़ुमैब",
// //         bypassingAgent: "बायपासिंग एजेंट",
// //         other: "अन्य",
// //         otherPlaceholder: "अन्य उपचार लिखें",
// //       },

// //       medicationOptions: {
// //         title: "अन्य दवाएँ",
// //         label: "वर्तमान में ली जा रही दवाएँ",
// //         placeholder: "दवाएँ चुनें",
// //         none: "कोई नहीं",
// //         tranexamicAcid: "ट्रानेक्सामिक एसिड",
// //         paracetamol: "पैरासिटामोल / एसीटामिनोफेन",
// //         iron: "आयरन सप्लीमेंट",
// //         painMedication: "दर्द की दवा",
// //         other: "अन्य",
// //         otherPlaceholder: "अन्य दवा का नाम लिखें",
// //       },

// //       eyebrow: "रोगी की चिकित्सीय जानकारी",

// //       title: "हीमोफीलिया चिकित्सीय विवरण",

// //       subtitle:
// //         "अपनी मौजूदा चिकित्सीय जानकारी दें ताकि आपकी देखभाल संबंधी मार्गदर्शन को बेहतर बनाया जा सके।",

// //       accurateTitle:
// //         "अपनी जानकारी सही रखें",

// //       accurateText:
// //         "ये विवरण आपके हीमोफीलिया प्रोफाइल, रक्तस्राव, फिजियोथेरेपी और देखभाल की जरूरतों को समझने में मदद करते हैं।",

// //       classification:
// //         "हीमोफीलिया जानकारी",

// //       classificationDesc:
// //         "आपके निदान की मूल जानकारी",

// //       type:
// //         "हीमोफीलिया का प्रकार",

// //       selectType:
// //         "प्रकार चुनें",

// //       typeA:
// //         "हीमोफीलिया A",

// //       typeB:
// //         "हीमोफीलिया B",

// //       typeC:
// //         "हीमोफीलिया C",

// //       severity:
// //         "गंभीरता",

// //       selectSeverity:
// //         "गंभीरता चुनें",

// //       mild:
// //         "हल्का",

// //       moderate:
// //         "मध्यम",

// //       severe:
// //         "गंभीर",

// //       ageDiagnosis:
// //         "निदान के समय उम्र",

// //       enterAge:
// //         "उम्र दर्ज करें",

// //       treatment:
// //         "उपचार जानकारी",

// //       treatmentDesc:
// //         "आपका वर्तमान उपचार और दवाएँ",

// //       factorTherapy:
// //         "वर्तमान हीमोफीलिया उपचार",

// //       factorPlaceholder:
// //         "जैसे Factor VIII replacement",

// //       medications:
// //         "वर्तमान में ली जा रही दवाएँ",

// //       medicationsPlaceholder:
// //         "यदि कोई दवा है तो दर्ज करें",

// //       bleeding:
// //         "रक्तस्राव का पैटर्न",

// //       bleedingDesc:
// //         "आपके रक्तस्राव के इतिहास और प्रभावित जोड़ों की जानकारी",

// //       bleedingPattern:
// //         "रक्तस्राव का पैटर्न",

// //       selectPattern:
// //         "पैटर्न चुनें",

// //       spontaneous:
// //         "बिना स्पष्ट कारण रक्तस्राव",

// //       trauma:
// //         "चोट के बाद रक्तस्राव",

// //       procedure:
// //         "चिकित्सीय या दंत प्रक्रिया के बाद रक्तस्राव",

// //       mixed:
// //         "मिश्रित / एक से अधिक पैटर्न",

// //       other:
// //         "अन्य",

// //       affectedJoints:
// //         "प्रभावित जोड़",

// //       affectedJointsHelp:
// //         "वर्तमान में प्रभावित या पहले रक्तस्राव वाले सभी जोड़ों को चुनें।",

// //       selectedJoints:
// //         "चयनित जोड़",

// //       noJointsSelected:
// //         "कोई जोड़ चयनित नहीं है",

// //       targetJoint:
// //         "टारगेट जोड़",

// //       selectTargetJoint:
// //         "टारगेट जोड़ चुनें",

// //       none:
// //         "कोई नहीं",

// //       knee:
// //         "घुटना",

// //       ankle:
// //         "टखना",

// //       elbow:
// //         "कोहनी",

// //       shoulder:
// //         "कंधा",

// //       hip:
// //         "कूल्हा",

// //       wrist:
// //         "कलाई",

// //       bleedFrequency:
// //         "रक्तस्राव की आवृत्ति",

// //       selectFrequency:
// //         "आवृत्ति चुनें",

// //       daily:
// //         "प्रतिदिन",

// //       weekly:
// //         "साप्ताहिक",

// //       monthly:
// //         "मासिक",

// //       quarterly:
// //         "हर कुछ महीनों में",

// //       rare:
// //         "बहुत कम",

// //       lastBleed:
// //         "अंतिम रक्तस्राव की तारीख",

// //       otherDetails:
// //         "अन्य जानकारी",

// //       otherDetailsPlaceholder:
// //         "कोई अन्य जानकारी दर्ज करें जो आपकी देखभाल टीम को पता होनी चाहिए",

// //       physiotherapy:
// //         "फिजियोथेरेपी और व्यायाम",

// //       physiotherapyDesc:
// //         "अपनी वर्तमान या पिछली फिजियोथेरेपी के बारे में बताएं",

// //       currentlyPhysio:
// //         "क्या आप वर्तमान में फिजियोथेरेपी करवा रहे हैं?",

// //       selectOption:
// //         "विकल्प चुनें",

// //       yes:
// //         "हाँ",

// //       no:
// //         "नहीं",

// //       wherePhysio:
// //         "आप फिजियोथेरेपी कहाँ करवा रहे हैं?",

// //       hospital:
// //         "अस्पताल",

// //       clinic:
// //         "क्लिनिक",

// //       hemophiliaCentre:
// //         "हीमोफीलिया केंद्र",

// //       home:
// //         "घर पर",

// //       sessions:
// //         "सप्ताह में कितने सत्र?",

// //       onceWeek:
// //         "सप्ताह में एक बार",

// //       twoThree:
// //         "सप्ताह में 2–3 बार",

// //       moreThree:
// //         "सप्ताह में 3 से अधिक बार",

// //       sessionDuration:
// //         "प्रत्येक सत्र कितने मिनट का होता है?",

// //       lessTen:
// //         "10 मिनट से कम",

// //       tenTwenty:
// //         "10–20 मिनट",

// //       twentyThirty:
// //         "20–30 मिनट",

// //       moreThirty:
// //         "30 मिनट से अधिक",

// //       affectedBodyPart:
// //         "सबसे अधिक प्रभावित और वर्तमान में उपचारित शरीर का भाग कौन सा है?",

// //       treatmentReceived:
// //         "आप किस प्रकार का उपचार प्राप्त कर रहे हैं?",

// //       stretching:
// //         "स्ट्रेचिंग",

// //       strengthening:
// //         "मांसपेशियों को मजबूत करने के व्यायाम",

// //       balance:
// //         "संतुलन व्यायाम",

// //       generalFitness:
// //         "सामान्य फिटनेस",

// //       jointMovement:
// //         "जोड़ों की गति के व्यायाम",

// //       painRelief:
// //         "दर्द से राहत के व्यायाम",

// //       equipment:
// //         "क्या आप व्यायाम के लिए किसी उपकरण का उपयोग करते हैं?",

// //       noEquipment:
// //         "कोई उपकरण नहीं",

// //       dumbbells:
// //         "डम्बल",

// //       weightsCuffs:
// //         "वेट कफ",

// //       theraband:
// //         "थेराबैंड",

// //       yogaMat:
// //         "योगा मैट",

// //       otherEquipment:
// //         "अन्य उपकरण",

// //       helping:
// //         "क्या फिजियोथेरेपी से आपको लाभ हो रहा है?",

// //       problems:
// //         "व्यायाम करते समय या सत्र के बाद कोई समस्या होती है?",

// //       noProblems:
// //         "कोई समस्या नहीं",

// //       pain:
// //         "दर्द",

// //       newBleeding:
// //         "नया रक्तस्राव",

// //       stiffness:
// //         "जकड़न",

// //       increasedSwelling:
// //         "सूजन बढ़ना",

// //       tired:
// //         "थकान महसूस होना",

// //       previousPhysio:
// //         "क्या आपने पहले फिजियोथेरेपी का उपयोग किया है?",

// //       stoppedWhen:
// //         "आपने फिजियोथेरेपी कब बंद की?",

// //       stoppedWhy:
// //         "आपने फिजियोथेरेपी क्यों बंद की?",

// //       stoppedWhyPlaceholder:
// //         "मुख्य कारण चुनें",

// //       noNeed:
// //         "अब आवश्यकता नहीं थी",

// //       improved:
// //         "लक्षणों में सुधार हुआ",

// //       access:
// //         "फिजियोथेरेपी तक पहुँचने में कठिनाई",

// //       cost:
// //         "खर्च / आर्थिक कारण",

// //       time:
// //         "समय की समस्या",

// //       doctor:
// //         "परामर्श देने वाले डॉक्टर",

// //       doctorDesc:
// //         "उस डॉक्टर को चुनें जो वर्तमान में आपकी हीमोफीलिया देखभाल कर रहे हैं।",

// //       requestDoctorChange:
// //         "डॉक्टर बदलने का अनुरोध करें",

// //       requestDoctorChangeTitle:
// //         "डॉक्टर बदलने का अनुरोध",

// //       requestDoctorChangeText:
// //         "दूसरे डॉक्टर को चुनने से पहले आपके वर्तमान डॉक्टर को आपको रिलीज़ करना होगा।",

// //       changeReason:
// //         "डॉक्टर बदलने का कारण",

// //       changeReasonPlaceholder:
// //         "कृपया बताएं कि आप डॉक्टर क्यों बदलना चाहते हैं",

// //       cancel:
// //         "रद्द करें",

// //       sendRequest:
// //         "अनुरोध भेजें",

// //       sendingRequest:
// //         "भेजा जा रहा है...",

// //       requestPending:
// //         "डॉक्टर बदलने का अनुरोध लंबित है। आपके वर्तमान डॉक्टर को आपको रिलीज़ करना होगा।",

// //       selectDoctor:
// //         "डॉक्टर चुनें",

// //       noDoctors:
// //         "कोई स्वीकृत डॉक्टर उपलब्ध नहीं है",

// //       doctorLoading:
// //         "डॉक्टर लोड हो रहे हैं...",

// //       doctorId:
// //         "प्रोफेशनल आईडी",

// //       required:
// //         "*",

// //       mobility:
// //         "चलने-फिरने में कठिनाई",

// //       selectMobility:
// //         "चलने-फिरने की कठिनाई चुनें",

// //       noLimitation:
// //         "कोई कठिनाई नहीं",

// //       assistive:
// //         "सहायक उपकरण",

// //       assistivePlaceholder:
// //         "सहायक उपकरण चुनें",

// //       assistiveOptions: {
// //         none: "कोई उपकरण नहीं",
// //         kneeBrace: "घुटने का ब्रेस",
// //         ankleBrace: "टखने / पैर का ब्रेस",
// //         elbowBrace: "कोहनी का ब्रेस",
// //         wristSupport: "कलाई का सहारा",
// //         cane: "छड़ी / चलने की छड़ी",
// //         crutches: "बैसाखी",
// //         walker: "वॉकर",
// //         wheelchair: "व्हीलचेयर",
// //         other: "अन्य",
// //       },

// //       errorRequired:
// //         "कृपया सभी आवश्यक जानकारी पूरी करें।",

// //       errorDoctor:
// //         "डॉक्टरों की सूची लोड नहीं हो सकी। कृपया फिर प्रयास करें।",

// //       errorSave:
// //         "जानकारी सेव नहीं हो सकी। कृपया फिर प्रयास करें।",

// //       save:
// //         "सेव करें और आगे बढ़ें",

// //       saving:
// //         "सेव हो रहा है...",

// //       back:
// //         "वापस",

// //       secure:
// //         "आपकी चिकित्सीय जानकारी सुरक्षित रूप से संग्रहीत की जाती है और आपकी देखभाल संबंधी मार्गदर्शन को व्यक्तिगत बनाने के लिए उपयोग की जाती है।",

// //       previousPhysioSection:
// //         "पिछली फिजियोथेरेपी",

// //       currentPhysioSection:
// //         "वर्तमान फिजियोथेरेपी विवरण",
// //     },

// //     // ===================================================
// //     // MARATHI
// //     // ===================================================

// //     mr: {

// //       treatmentOptions: {
// //         title: "सध्याचा हिमोफिलिया उपचार",
// //         label: "सध्याचा उपचार",
// //         placeholder: "सध्याचा उपचार निवडा",
// //         none: "सध्या कोणताही उपचार नाही",
// //         factorVIII: "फॅक्टर VIII",
// //         factorIX: "फॅक्टर IX",
// //         extendedVIII: "एक्स्टेंडेड हाफ-लाइफ फॅक्टर VIII",
// //         extendedIX: "एक्स्टेंडेड हाफ-लाइफ फॅक्टर IX",
// //         emicizumab: "एमिसिझुमॅब",
// //         bypassingAgent: "बायपासिंग एजंट",
// //         other: "इतर",
// //         otherPlaceholder: "इतर उपचार लिहा",
// //       },

// //       medicationOptions: {
// //         title: "इतर औषधे",
// //         label: "सध्या घेत असलेली औषधे",
// //         placeholder: "औषधे निवडा",
// //         none: "एकही नाही",
// //         tranexamicAcid: "ट्रॅनेक्सॅमिक अॅसिड",
// //         paracetamol: "पॅरासिटामॉल / अॅसिटामिनोफेन",
// //         iron: "आयर्न सप्लिमेंट",
// //         painMedication: "वेदनेवरील औषध",
// //         other: "इतर",
// //         otherPlaceholder: "इतर औषधाचे नाव लिहा",
// //       },

// //       eyebrow: "रुग्णाची वैद्यकीय माहिती",

// //       title: "हिमोफिलिया वैद्यकीय तपशील",

// //       subtitle:
// //         "तुमच्या काळजीचे मार्गदर्शन वैयक्तिक करण्यासाठी तुमची सध्याची वैद्यकीय माहिती द्या.",

// //       accurateTitle:
// //         "तुमची माहिती अचूक ठेवा",

// //       accurateText:
// //         "ही माहिती तुमची हिमोफिलिया स्थिती, रक्तस्त्रावाचा नमुना, फिजिओथेरपी आणि काळजीच्या गरजा समजून घेण्यास मदत करते.",

// //       classification:
// //         "हिमोफिलिया माहिती",

// //       classificationDesc:
// //         "तुमच्या निदानाची मूलभूत माहिती",

// //       type:
// //         "हिमोफिलियाचा प्रकार",

// //       selectType:
// //         "प्रकार निवडा",

// //       typeA:
// //         "हिमोफिलिया A",

// //       typeB:
// //         "हिमोफिलिया B",

// //       typeC:
// //         "हिमोफिलिया C",

// //       severity:
// //         "तीव्रता",

// //       selectSeverity:
// //         "तीव्रता निवडा",

// //       mild:
// //         "सौम्य",

// //       moderate:
// //         "मध्यम",

// //       severe:
// //         "गंभीर",

// //       ageDiagnosis:
// //         "निदानाच्या वेळी वय",

// //       enterAge:
// //         "वय प्रविष्ट करा",

// //       treatment:
// //         "उपचाराची माहिती",

// //       treatmentDesc:
// //         "तुमचे सध्याचे उपचार आणि औषधे",

// //       factorTherapy:
// //         "सध्याचा हिमोफिलिया उपचार",

// //       factorPlaceholder:
// //         "उदा. Factor VIII replacement",

// //       medications:
// //         "सध्या घेत असलेली औषधे",

// //       medicationsPlaceholder:
// //         "औषधे असल्यास प्रविष्ट करा",

// //       bleeding:
// //         "रक्तस्त्रावाचा नमुना",

// //       bleedingDesc:
// //         "तुमच्या रक्तस्त्रावाचा इतिहास आणि प्रभावित सांध्यांची माहिती",

// //       bleedingPattern:
// //         "रक्तस्त्रावाचा नमुना",

// //       selectPattern:
// //         "नमुना निवडा",

// //       spontaneous:
// //         "स्वतःहून होणारा रक्तस्त्राव",

// //       trauma:
// //         "इजा / दुखापतीनंतर रक्तस्त्राव",

// //       procedure:
// //         "वैद्यकीय किंवा दंत प्रक्रियेनंतर रक्तस्त्राव",

// //       mixed:
// //         "मिश्र / एकापेक्षा जास्त नमुने",

// //       other:
// //         "इतर",

// //       affectedJoints:
// //         "प्रभावित सांधे",

// //       affectedJointsHelp:
// //         "सध्या प्रभावित असलेले किंवा पूर्वी रक्तस्त्राव झालेले सर्व सांधे निवडा.",

// //       selectedJoints:
// //         "निवडलेले सांधे",

// //       noJointsSelected:
// //         "कोणताही सांधा निवडलेला नाही",

// //       targetJoint:
// //         "टार्गेट सांधा",

// //       selectTargetJoint:
// //         "टार्गेट सांधा निवडा",

// //       none:
// //         "कोणताही नाही",

// //       knee:
// //         "गुडघा",

// //       ankle:
// //         "घोटा",

// //       elbow:
// //         "कोपर",

// //       shoulder:
// //         "खांदा",

// //       hip:
// //         "नितंब",

// //       wrist:
// //         "मनगट",

// //       bleedFrequency:
// //         "रक्तस्त्रावाची वारंवारता",

// //       selectFrequency:
// //         "वारंवारता निवडा",

// //       daily:
// //         "दररोज",

// //       weekly:
// //         "आठवड्यातून",

// //       monthly:
// //         "मासिक",

// //       quarterly:
// //         "दर काही महिन्यांनी",

// //       rare:
// //         "क्वचित",

// //       lastBleed:
// //         "शेवटच्या रक्तस्त्रावाची तारीख",

// //       otherDetails:
// //         "इतर माहिती",

// //       otherDetailsPlaceholder:
// //         "तुमच्या काळजीच्या टीमला माहीत असावी अशी इतर माहिती प्रविष्ट करा",

// //       physiotherapy:
// //         "फिजिओथेरपी आणि व्यायाम",

// //       physiotherapyDesc:
// //         "तुमच्या सध्याच्या किंवा पूर्वीच्या फिजिओथेरपीबद्दल माहिती द्या",

// //       currentlyPhysio:
// //         "तुम्ही सध्या फिजिओथेरपी घेत आहात का?",

// //       selectOption:
// //         "पर्याय निवडा",

// //       yes:
// //         "होय",

// //       no:
// //         "नाही",

// //       wherePhysio:
// //         "तुम्ही फिजिओथेरपी कुठे घेत आहात?",

// //       hospital:
// //         "रुग्णालय",

// //       clinic:
// //         "क्लिनिक",

// //       hemophiliaCentre:
// //         "हिमोफिलिया केंद्र",

// //       home:
// //         "घरी",

// //       sessions:
// //         "आठवड्यात किती सत्रे?",

// //       onceWeek:
// //         "आठवड्यातून एकदा",

// //       twoThree:
// //         "आठवड्यातून 2–3 वेळा",

// //       moreThree:
// //         "आठवड्यातून 3 पेक्षा जास्त वेळा",

// //       sessionDuration:
// //         "प्रत्येक सत्र किती मिनिटांचे असते?",

// //       lessTen:
// //         "10 मिनिटांपेक्षा कमी",

// //       tenTwenty:
// //         "10–20 मिनिटे",

// //       twentyThirty:
// //         "20–30 मिनिटे",

// //       moreThirty:
// //         "30 मिनिटांपेक्षा जास्त",

// //       affectedBodyPart:
// //         "सध्या उपचार घेत असलेला सर्वाधिक प्रभावित शरीराचा भाग कोणता?",

// //       treatmentReceived:
// //         "तुम्ही कोणत्या प्रकारचे उपचार घेत आहात?",

// //       stretching:
// //         "स्ट्रेचिंग",

// //       strengthening:
// //         "स्नायू मजबूत करण्याचे व्यायाम",

// //       balance:
// //         "संतुलन व्यायाम",

// //       generalFitness:
// //         "सामान्य फिटनेस",

// //       jointMovement:
// //         "सांध्यांच्या हालचालीचे व्यायाम",

// //       painRelief:
// //         "वेदना कमी करण्यासाठी व्यायाम",

// //       equipment:
// //         "तुम्ही व्यायामासाठी कोणतेही उपकरण वापरता का?",

// //       noEquipment:
// //         "कोणतेही उपकरण नाही",

// //       dumbbells:
// //         "डम्बेल्स",

// //       weightsCuffs:
// //         "वेट कफ",

// //       theraband:
// //         "थेराबँड",

// //       yogaMat:
// //         "योगा मॅट",

// //       otherEquipment:
// //         "इतर उपकरण",

// //       helping:
// //         "फिजिओथेरपीमुळे तुम्हाला फायदा होत आहे का?",

// //       problems:
// //         "व्यायाम करताना किंवा सत्रानंतर काही समस्या होतात का?",

// //       noProblems:
// //         "कोणतीही समस्या नाही",

// //       pain:
// //         "वेदना",

// //       newBleeding:
// //         "नवीन रक्तस्त्राव",

// //       stiffness:
// //         "ताठरपणा",

// //       increasedSwelling:
// //         "सूज वाढणे",

// //       tired:
// //         "थकवा जाणवणे",

// //       previousPhysio:
// //         "तुम्ही यापूर्वी फिजिओथेरपी घेतली आहे का?",

// //       stoppedWhen:
// //         "तुम्ही फिजिओथेरपी कधी थांबवली?",

// //       stoppedWhy:
// //         "तुम्ही फिजिओथेरपी का थांबवली?",

// //       stoppedWhyPlaceholder:
// //         "मुख्य कारण निवडा",

// //       noNeed:
// //         "आता गरज नव्हती",

// //       improved:
// //         "लक्षणांमध्ये सुधारणा झाली",

// //       access:
// //         "फिजिओथेरपी मिळवण्यात अडचण",

// //       cost:
// //         "खर्च / आर्थिक कारणे",

// //       time:
// //         "वेळेची समस्या",

// //       doctor:
// //         "सल्ला देणारे डॉक्टर",

// //       doctorDesc:
// //         "सध्या तुमच्या हिमोफिलिया उपचाराचे व्यवस्थापन करणारे डॉक्टर निवडा.",

// //       requestDoctorChange:
// //         "डॉक्टर बदलण्याची विनंती करा",

// //       requestDoctorChangeTitle:
// //         "डॉक्टर बदलण्याची विनंती",

// //       requestDoctorChangeText:
// //         "दुसरा डॉक्टर निवडण्यापूर्वी तुमच्या सध्याच्या डॉक्टरांनी तुम्हाला रिलीज करणे आवश्यक आहे.",

// //       changeReason:
// //         "डॉक्टर बदलण्याचे कारण",

// //       changeReasonPlaceholder:
// //         "तुम्हाला डॉक्टर का बदलायचे आहेत ते कृपया सांगा",

// //       cancel:
// //         "रद्द करा",

// //       sendRequest:
// //         "विनंती पाठवा",

// //       sendingRequest:
// //         "पाठवत आहे...",

// //       requestPending:
// //         "डॉक्टर बदलण्याची विनंती प्रलंबित आहे. तुमच्या सध्याच्या डॉक्टरांनी तुम्हाला रिलीज करणे आवश्यक आहे.",

// //       selectDoctor:
// //         "डॉक्टर निवडा",

// //       noDoctors:
// //         "कोणतेही मंजूर डॉक्टर उपलब्ध नाहीत",

// //       doctorLoading:
// //         "डॉक्टर लोड होत आहेत...",

// //       doctorId:
// //         "प्रोफेशनल आयडी",

// //       required:
// //         "*",

// //       mobility:
// //         "हालचालींमध्ये मर्यादा",

// //       selectMobility:
// //         "हालचालींची मर्यादा निवडा",

// //       noLimitation:
// //         "कोणतीही मर्यादा नाही",

// //       assistive:
// //         "सहाय्यक उपकरणे",

// //       assistivePlaceholder:
// //         "सहाय्यक उपकरण निवडा",

// //       assistiveOptions: {
// //         none: "कोणतेही उपकरण नाही",
// //         kneeBrace: "गुडघ्याचा ब्रेस",
// //         ankleBrace: "घोटा / पायाचा ब्रेस",
// //         elbowBrace: "कोपराचा ब्रेस",
// //         wristSupport: "मनगटाचा आधार",
// //         cane: "काठी / चालण्याची काठी",
// //         crutches: "कुबड्या",
// //         walker: "वॉकर",
// //         wheelchair: "व्हीलचेअर",
// //         other: "इतर",
// //       },

// //       errorRequired:
// //         "कृपया सर्व आवश्यक माहिती पूर्ण करा.",

// //       errorDoctor:
// //         "डॉक्टरांची यादी लोड करता आली नाही. कृपया पुन्हा प्रयत्न करा.",

// //       errorSave:
// //         "माहिती सेव्ह करता आली नाही. कृपया पुन्हा प्रयत्न करा.",

// //       save:
// //         "सेव्ह करा आणि पुढे जा",

// //       saving:
// //         "सेव्ह होत आहे...",

// //       back:
// //         "मागे",

// //       secure:
// //         "तुमची वैद्यकीय माहिती सुरक्षितपणे साठवली जाते आणि तुमचे काळजी मार्गदर्शन वैयक्तिक करण्यासाठी वापरली जाते.",

// //       previousPhysioSection:
// //         "पूर्वीची फिजिओथेरपी",

// //       currentPhysioSection:
// //         "सध्याचे फिजिओथेरपी तपशील",
// //     }
  
// //   };

// //   const txt =
// //     TEXT[language] || TEXT.en;

// //   // =====================================================
// //   // FORM
// //   // =====================================================

// //   const [form, setForm] = useState({
// //   type: "",
// //   severity: "",
// //   ageAtDiagnosis: "",

// //   familyHistory: "",
// //   geneticTestingDone: "",

// //   currentFactorTherapy: "",
// //   otherCurrentTreatment: "",

// //   otherMedications: [],
// //   otherMedicationDetails: "",

// //   bleedingPattern: "",
// //   jointsAffected: [],
// //   targetJoint: "",
// //   bleedFrequency: "",
// //   lastBleedDate: "",
// //   otherBleedingDetails: "",

// //   underPhysiotherapy: "",
// //   physiotherapyLocation: "",
// //   physiotherapySessions: "",
// //   physiotherapyDuration: "",
// //   physiotherapyBodyPart: "",
// //   physiotherapyTreatment: "",
// //   physiotherapyEquipment: "",
// //   physiotherapyHelping: "",
// //   physiotherapyProblems: [],

// //   previousPhysiotherapy: "",
// //   physiotherapyStoppedDate: "",
// //   physiotherapyStoppedReason: "",

// //   mobilityLimitation: "",
// //   assistiveDevices: "",

// //   consultingDoctorId: "",
// // });

// //   // =====================================================
// //   // DOCTORS
// //   // =====================================================

// //   const [doctors, setDoctors] =
// //     useState([]);

// //   const [doctorsLoading, setDoctorsLoading] =
// //     useState(true);

// //   // =====================================================
// //   // UI STATE
// //   // =====================================================

// //   const [loading, setLoading] =
// //     useState(false);

// //   const [error, setError] =
// //     useState("");

// //     // =====================================================
// // // DOCTOR ASSIGNMENT / CHANGE REQUEST STATE
// // // =====================================================

// // const [doctorStatusLoading, setDoctorStatusLoading] =
// //   useState(true);

// // // IMPORTANT:
// // // This becomes true only when a doctor assignment already exists
// // // in the saved patient record, or after Save & Continue succeeds.
// // // Merely selecting a doctor in the dropdown must NOT lock it.
// // const [doctorAssignmentSaved, setDoctorAssignmentSaved] =
// //   useState(false);

// // const [pendingDoctorChangeRequest, setPendingDoctorChangeRequest] =
// //   useState(null);

// // const [changeRequestModalOpen, setChangeRequestModalOpen] =
// //   useState(false);

// // const [changeRequestReason, setChangeRequestReason] =
// //   useState("");

// // const [changeRequestLoading, setChangeRequestLoading] =
// //   useState(false);

// //   // =====================================================
// //   // LOAD APPROVED DOCTORS
// //   // =====================================================

// //   useEffect(() => {
// //     const loadDoctors = async () => {
// //       try {
// //         setDoctorsLoading(true);

        
// //           const response =
// //             await api.get(
// //               `/hemophilia-details/doctors?language=${language}`
// //             );

// //         const list =
// //           response.data?.doctors || [];

// //         setDoctors(
// //           Array.isArray(list)
// //             ? list
// //             : []
// //         );
// //       } catch (err) {
// //         console.error(
// //           "Failed to load doctors:",
// //           err
// //         );

// //         setError(
// //           txt.errorDoctor
// //         );
// //       } finally {
// //         setDoctorsLoading(false);
// //       }
// //     };

// //     loadDoctors();
// //   }, [language]);

// //   // =====================================================
// // // LOAD CURRENT DOCTOR ASSIGNMENT
// // // =====================================================

// // useEffect(() => {
// //   const loadDoctorStatus = async () => {
// //     try {
// //       setDoctorStatusLoading(true);

// //       const response =
// //         await api.get(
// //           "/hemophilia-details/doctor-change-status"
// //         );

// //       const assignedDoctor =
// //         response.data?.assignedDoctor || null;

// //       const pendingRequest =
// //         response.data?.pendingRequest || null;

// //       // -----------------------------------------------
// //       // RESTORE CURRENT DOCTOR
// //       // -----------------------------------------------

// //       setForm((prev) => ({
// //         ...prev,

// //         consultingDoctorId:
// //           assignedDoctor?._id || "",
// //       }));

// //       // Only a doctor that already exists in the saved record
// //       // should make the field read-only.
// //       setDoctorAssignmentSaved(
// //         Boolean(assignedDoctor?._id)
// //       );

// //       // -----------------------------------------------
// //       // RESTORE PENDING REQUEST
// //       // -----------------------------------------------

// //       setPendingDoctorChangeRequest(
// //         pendingRequest
// //       );
// //     } catch (err) {
// //       console.error(
// //         "Failed to load doctor assignment status:",
// //         err
// //       );

// //       setError(
// //         err.response?.data?.message ||
// //           "Unable to load your doctor assignment."
// //       );
// //     } finally {
// //       setDoctorStatusLoading(false);
// //     }
// //   };

// //   loadDoctorStatus();
// // }, []);

// // // =====================================================
// // // DOCTOR ASSIGNMENT HELPERS
// // // =====================================================

// // // Selecting a doctor in the dropdown changes form.consultingDoctorId
// // // immediately, but that does NOT mean the assignment is saved.
// // const doctorAssigned =
// //   doctorAssignmentSaved;

// // const doctorChangePending =
// //   Boolean(pendingDoctorChangeRequest);

// // // Before the first Save & Continue:
// // //   doctorStatusLoading -> false
// // //   doctorsLoading -> false
// // //   doctorAssignmentSaved -> false
// // // therefore the dropdown stays editable.
// // //
// // // After the first successful Save & Continue, or when an already-saved
// // // assignment is loaded from the backend, the field becomes locked.
// // const doctorFieldLocked =
// //   doctorStatusLoading ||
// //   doctorsLoading ||
// //   (
// //     doctorAssignmentSaved &&
// //     pendingDoctorChangeRequest?.status !== "RELEASED"
// //   );


// //   // =====================================================
// // // REQUEST DOCTOR CHANGE
// // // =====================================================

// // const handleDoctorChangeRequest =
// //   async () => {
// //     setError("");

// //     try {
// //       setChangeRequestLoading(true);

// //       const response =
// //         await api.post(
// //           "/hemophilia-details/doctor-change-request",
// //           {
// //             reason:
// //               changeRequestReason.trim(),
// //           }
// //         );

// //       setPendingDoctorChangeRequest(
// //         response.data?.request || {
// //           status: "PENDING",
// //         }
// //       );

// //       setChangeRequestReason("");

// //       setChangeRequestModalOpen(false);
// //     } catch (err) {
// //       console.error(
// //         "Doctor change request failed:",
// //         err
// //       );

// //       setError(
// //         err.response?.data?.message ||
// //           "Failed to submit doctor change request."
// //       );
// //     } finally {
// //       setChangeRequestLoading(false);
// //     }
// //   };
// //   // =====================================================
// //   // UPDATE FIELD
// //   // =====================================================

// //   const updateField = (
// //     field,
// //     value
// //   ) => {
// //     setForm((prev) => ({
// //       ...prev,
// //       [field]: value,
// //     }));
// //   };

// //   // =====================================================
// //   // TOGGLE JOINT
// //   // =====================================================

// //   const toggleJoint = (
// //     joint
// //   ) => {
// //     setForm((prev) => {
// //       const exists =
// //         prev.jointsAffected.includes(
// //           joint
// //         );

// //       return {
// //         ...prev,

// //         jointsAffected: exists
// //           ? prev.jointsAffected.filter(
// //               (j) => j !== joint
// //             )
// //           : [
// //               ...prev.jointsAffected,
// //               joint,
// //             ],
// //       };
// //     });
// //   };

// //   // =====================================================
// //   // TOGGLE PHYSIO PROBLEM
// //   // =====================================================

// //   const togglePhysioProblem =
// //     (problem) => {
// //       setForm((prev) => {
// //         const exists =
// //           prev.physiotherapyProblems.includes(
// //             problem
// //           );

// //         return {
// //           ...prev,

// //           physiotherapyProblems:
// //             exists
// //               ? prev.physiotherapyProblems.filter(
// //                   (p) => p !== problem
// //                 )
// //               : [
// //                   ...prev.physiotherapyProblems,
// //                   problem,
// //                 ],
// //         };
// //       });
// //     };

// //   // =====================================================
// //   // REQUIRED VALIDATION
// //   // =====================================================

// //   const handleSubmit = async () => {
// //     setError("");

// //     if (
// //       !form.type ||
// //       !form.severity ||
// //       !form.bleedingPattern ||
// //       !form.bleedFrequency ||
// //       !form.consultingDoctorId ||
// //       form.underPhysiotherapy === ""
// //     ) {
// //       setError(
// //         txt.errorRequired
// //       );

// //       window.scrollTo({
// //         top: 0,
// //         behavior: "smooth",
// //       });

// //       return;
// //     }

// //     // -----------------------------------------------
// //     // IF CURRENTLY IN PHYSIOTHERAPY
// //     // -----------------------------------------------

// //     if (
// //       form.underPhysiotherapy === true
// //     ) {
// //       if (
// //         !form.physiotherapyLocation ||
// //         !form.physiotherapySessions ||
// //         !form.physiotherapyDuration ||
// //         !form.physiotherapyBodyPart ||
// //         !form.physiotherapyTreatment ||
// //         !form.physiotherapyEquipment ||
// //         !form.physiotherapyHelping
// //       ) {
// //         setError(
// //           txt.errorRequired
// //         );

// //         window.scrollTo({
// //           top: 0,
// //           behavior: "smooth",
// //         });

// //         return;
// //       }
// //     }

// //     // -----------------------------------------------
// //     // IF NOT CURRENTLY IN PHYSIO
// //     // -----------------------------------------------

// //     if (
// //       form.underPhysiotherapy === false &&
// //       form.previousPhysiotherapy === ""
// //     ) {
// //       setError(
// //         txt.errorRequired
// //       );

// //       window.scrollTo({
// //         top: 0,
// //         behavior: "smooth",
// //       });

// //       return;
// //     }

// //     if (
// //       form.underPhysiotherapy === false &&
// //       form.previousPhysiotherapy === true &&
// //       (
// //         !form.physiotherapyStoppedDate ||
// //         !form.physiotherapyStoppedReason
// //       )
// //     ) {
// //       setError(
// //         txt.errorRequired
// //       );

// //       window.scrollTo({
// //         top: 0,
// //         behavior: "smooth",
// //       });

// //       return;
// //     }

// //     setLoading(true);

// //     try {
// //       await api.post(
// //         "/hemophilia-details",
// //         form
// //       );

// //       // The assignment is now actually persisted in the database.
// //       // Only NOW should the consulting-doctor field become locked.
// //       setDoctorAssignmentSaved(
// //         Boolean(form.consultingDoctorId)
// //       );

// //       // =============================================
// //       // NEXT STEP
// //       // =============================================

// //       navigate(
// //         "/care-guidance"
// //       );

// //     } catch (err) {
// //       console.error(
// //         "Failed to save hemophilia details:",
// //         err
// //       );

// //       setError(
// //         err.response?.data?.message ||
// //           txt.errorSave
// //       );
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // =====================================================
// //   // SECTION STATUS
// //   // =====================================================

// //   const classificationDone =
// //     form.type &&
// //     form.severity;

// //   const bleedingDone =
// //     form.bleedingPattern &&
// //     form.bleedFrequency;

// //   const physioDone =
// //     form.underPhysiotherapy !== "";

// //   // =====================================================
// //   // JOINTS
// //   // =====================================================

// //   const joints = [
// //     {
// //       value: "Knee",
// //       label: txt.knee,
// //     },
// //     {
// //       value: "Ankle",
// //       label: txt.ankle,
// //     },
// //     {
// //       value: "Elbow",
// //       label: txt.elbow,
// //     },
// //     {
// //       value: "Shoulder",
// //       label: txt.shoulder,
// //     },
// //     {
// //       value: "Hip",
// //       label: txt.hip,
// //     },
// //     {
// //       value: "Wrist",
// //       label: txt.wrist,
// //     },
// //   ];

// //   return (
// //     <div className="clinical-page">

// //       <div className="clinical-container">

// //         {/* =================================================
// //             HEADER
// //         ================================================= */}

// //         <div className="clinical-header">

// //           <div className="header-icon">
// //             +
// //           </div>

// //           <div className="header-text">

// //             <span className="header-eyebrow">
// //               {txt.eyebrow}
// //             </span>

// //             <h1>
// //               {txt.title}
// //             </h1>

// //             <p>
// //               {txt.subtitle}
// //             </p>

// //           </div>

// //         </div>


// //         {/* =================================================
// //             INFO
// //         ================================================= */}

// //         <div className="info-banner">

// //           <div className="info-banner-icon">
// //             i
// //           </div>

// //           <div>

// //             <strong>
// //               {txt.accurateTitle}
// //             </strong>

// //             <p>
// //               {txt.accurateText}
// //             </p>

// //           </div>

// //         </div>


// //         {/* =================================================
// //             SECTION 01
// //         ================================================= */}

// //         <div
// //           className={`clinical-section ${
// //             classificationDone
// //               ? "section-complete"
// //               : ""
// //           }`}
// //         >

// //           <div className="section-header">

// //             <div className="section-number">
// //               01
// //             </div>

// //             <div>

// //               <h2>
// //                 {txt.classification}
// //               </h2>

// //               <p>
// //                 {txt.classificationDesc}
// //               </p>

// //             </div>

// //             {classificationDone && (
// //               <div className="completion-mark">
// //                 ✓
// //               </div>
// //             )}

// //           </div>


// //           <div className="form-grid">

// //             {/* TYPE */}

// //             <div className="field">

// //               <label>
// //                 {txt.type}
// //                 <span className="required">
// //                   {txt.required}
// //                 </span>
// //               </label>

// //               <select
// //                 value={form.type}
// //                 onChange={(e) =>
// //                   updateField(
// //                     "type",
// //                     e.target.value
// //                   )
// //                 }
// //               >

// //                 <option value="">
// //                   {txt.selectType}
// //                 </option>

// //                 <option value="A">
// //                   {txt.typeA}
// //                 </option>

// //                 <option value="B">
// //                   {txt.typeB}
// //                 </option>

// //                 <option value="C">
// //                   {txt.typeC}
// //                 </option>

// //               </select>

// //             </div>


// //             {/* SEVERITY */}

// //             <div className="field">

// //               <label>
// //                 {txt.severity}
// //                 <span className="required">
// //                   {txt.required}
// //                 </span>
// //               </label>

// //               <select
// //                 value={form.severity}
// //                 onChange={(e) =>
// //                   updateField(
// //                     "severity",
// //                     e.target.value
// //                   )
// //                 }
// //               >

// //                 <option value="">
// //                   {txt.selectSeverity}
// //                 </option>

// //                 <option value="Mild">
// //                   {txt.mild}
// //                 </option>

// //                 <option value="Moderate">
// //                   {txt.moderate}
// //                 </option>

// //                 <option value="Severe">
// //                   {txt.severe}
// //                 </option>

// //               </select>

// //             </div>


// //             {/* AGE */}

// //             <div className="field">

// //               <label>
// //                 {txt.ageDiagnosis}
// //               </label>

// //               <input
// //                 type="number"
// //                 min="0"
// //                 max="120"
// //                 placeholder={
// //                   txt.enterAge
// //                 }
// //                 value={
// //                   form.ageAtDiagnosis
// //                 }
// //                 onChange={(e) =>
// //                   updateField(
// //                     "ageAtDiagnosis",
// //                     e.target.value
// //                   )
// //                 }
// //               />

// //             </div>

// //           </div>

// //         </div>


// //         {/* =================================================
// //             SECTION 02 - TREATMENT
// //         ================================================= */}

// //         <div className="clinical-section">

// //           <div className="section-header">

// //             <div className="section-number">
// //               02
// //             </div>

// //             <div>

// //               <h2>
// //                 {txt.treatment}
// //               </h2>

// //               <p>
// //                 {txt.treatmentDesc}
// //               </p>

// //             </div>

// //           </div>


// //           <div className="form-grid two-columns">

// //             {/* CURRENT HEMOPHILIA TREATMENT */}

// //             <div className="field">

// //               <label>
// //                 {txt.factorTherapy}
// //               </label>

// //               <select
// //                 value={form.currentFactorTherapy}
// //                 onChange={(e) => {
// //                   updateField(
// //                     "currentFactorTherapy",
// //                     e.target.value
// //                   );

// //                   if (e.target.value !== "Other") {
// //                     updateField(
// //                       "otherCurrentTreatment",
// //                       ""
// //                     );
// //                   }
// //                 }}
// //               >

// //                 <option value="">
// //                   {txt.treatmentOptions.placeholder}
// //                 </option>

// //                 <option value="None">
// //                   {txt.treatmentOptions.none}
// //                 </option>

// //                 <option value="Factor VIII">
// //                   {txt.treatmentOptions.factorVIII}
// //                 </option>

// //                 <option value="Factor IX">
// //                   {txt.treatmentOptions.factorIX}
// //                 </option>

// //                 <option value="Extended half-life Factor VIII">
// //                   {txt.treatmentOptions.extendedVIII}
// //                 </option>

// //                 <option value="Extended half-life Factor IX">
// //                   {txt.treatmentOptions.extendedIX}
// //                 </option>

// //                 <option value="Emicizumab">
// //                   {txt.treatmentOptions.emicizumab}
// //                 </option>

// //                 <option value="Bypassing agent">
// //                   {txt.treatmentOptions.bypassingAgent}
// //                 </option>

// //                 <option value="Other">
// //                   {txt.treatmentOptions.other}
// //                 </option>

// //               </select>

// //             </div>


// //             {/* OTHER TREATMENT */}

// //             {form.currentFactorTherapy === "Other" && (
// //               <div className="field">

// //                 <label>
// //                   {txt.treatmentOptions.other}
// //                 </label>

// //                 <input
// //                   type="text"
// //                   placeholder={
// //                     txt.treatmentOptions.otherPlaceholder
// //                   }
// //                   value={
// //                     form.otherCurrentTreatment
// //                   }
// //                   onChange={(e) =>
// //                     updateField(
// //                       "otherCurrentTreatment",
// //                       e.target.value
// //                     )
// //                   }
// //                 />

// //               </div>
// //             )}


// //             {/* OTHER MEDICATIONS */}

// //             <div className="field">

// //               <label>
// //                 {txt.medications}
// //               </label>

// //               <MedicationDropdown
// //                 value={form.otherMedications}
// //                 onChange={(values) =>
// //                   updateField(
// //                     "otherMedications",
// //                     values
// //                   )
// //                 }
// //                 txt={txt}
// //               />

// //             </div>


// //             {/* OTHER MEDICATION DETAILS */}

// //             {form.otherMedications.includes("Other") && (
// //               <div className="field">

// //                 <label>
// //                   {txt.medicationOptions.other}
// //                 </label>

// //                 <input
// //                   type="text"
// //                   placeholder={
// //                     txt.medicationOptions.otherPlaceholder
// //                   }
// //                   value={
// //                     form.otherMedicationDetails
// //                   }
// //                   onChange={(e) =>
// //                     updateField(
// //                       "otherMedicationDetails",
// //                       e.target.value
// //                     )
// //                   }
// //                 />

// //               </div>
// //             )}

// //           </div>

// //         </div>


// //         {/* =================================================
// //             SECTION 03 - BLEEDING
// //         ================================================= */}

// //         <div
// //           className={`clinical-section ${
// //             bleedingDone
// //               ? "section-complete"
// //               : ""
// //           }`}
// //         >

// //           <div className="section-header">

// //             <div className="section-number">
// //               03
// //             </div>

// //             <div>

// //               <h2>
// //                 {txt.bleeding}
// //               </h2>

// //               <p>
// //                 {txt.bleedingDesc}
// //               </p>

// //             </div>

// //             {bleedingDone && (
// //               <div className="completion-mark">
// //                 ✓
// //               </div>
// //             )}

// //           </div>


// //           {/* BLEEDING PATTERN */}

// //           <div className="form-grid two-columns">

// //             <div className="field">

// //               <label>
// //                 {txt.bleedingPattern}
// //                 <span className="required">
// //                   {txt.required}
// //                 </span>
// //               </label>

// //               <select
// //                 value={
// //                   form.bleedingPattern
// //                 }
// //                 onChange={(e) =>
// //                   updateField(
// //                     "bleedingPattern",
// //                     e.target.value
// //                   )
// //                 }
// //               >

// //                 <option value="">
// //                   {txt.selectPattern}
// //                 </option>

// //                 <option value="Spontaneous">
// //                   {txt.spontaneous}
// //                 </option>

// //                 <option value="Trauma-related">
// //                   {txt.trauma}
// //                 </option>

// //                 <option value="Post-procedure">
// //                   {txt.procedure}
// //                 </option>

// //                 <option value="Mixed">
// //                   {txt.mixed}
// //                 </option>

// //                 <option value="Other">
// //                   {txt.other}
// //                 </option>

// //               </select>

// //             </div>


// //             {/* FREQUENCY */}

// //             <div className="field">

// //               <label>
// //                 {txt.bleedFrequency}
// //                 <span className="required">
// //                   {txt.required}
// //                 </span>
// //               </label>

// //               <select
// //                 value={
// //                   form.bleedFrequency
// //                 }
// //                 onChange={(e) =>
// //                   updateField(
// //                     "bleedFrequency",
// //                     e.target.value
// //                   )
// //                 }
// //               >

// //                 <option value="">
// //                   {txt.selectFrequency}
// //                 </option>

// //                 <option value="Daily">
// //                   {txt.daily}
// //                 </option>

// //                 <option value="Weekly">
// //                   {txt.weekly}
// //                 </option>

// //                 <option value="Monthly">
// //                   {txt.monthly}
// //                 </option>

// //                 <option value="Every few months">
// //                   {txt.quarterly}
// //                 </option>

// //                 <option value="Rare">
// //                   {txt.rare}
// //                 </option>

// //               </select>

// //             </div>

// //           </div>


// //           {/* AFFECTED JOINTS - MULTI SELECT */}

// //           <div className="field joint-field">

// //             <label>
// //               {txt.affectedJoints}
// //             </label>

// //             <p className="field-help">
// //               {txt.affectedJointsHelp}
// //             </p>

// //             <div className="joint-grid">
// //               {joints.map((joint) => {
// //                 const selected =
// //                   Array.isArray(form.jointsAffected) &&
// //                   form.jointsAffected.includes(joint.value);

// //                 return (
// //                   <button
// //                     key={joint.value}
// //                     type="button"
// //                     className={`joint-chip ${
// //                       selected ? "active" : ""
// //                     }`}
// //                     onClick={() => toggleJoint(joint.value)}
// //                     aria-pressed={selected}
// //                   >
// //                     <span className="joint-check">
// //                       {selected ? "✓" : ""}
// //                     </span>
// //                     {joint.label}
// //                   </button>
// //                 );
// //               })}
// //             </div>

// //             <p className="field-help selected-joints-help">
// //               {Array.isArray(form.jointsAffected) &&
// //               form.jointsAffected.length > 0
// //                 ? `${txt.selectedJoints}: ${form.jointsAffected
// //                     .map(
// //                       (value) =>
// //                         joints.find((joint) => joint.value === value)?.label ||
// //                         value
// //                     )
// //                     .join(", ")}`
// //                 : txt.noJointsSelected}
// //             </p>

// //           </div>


// //           {/* TARGET JOINT + LAST BLEED */}

// //           <div className="form-grid two-columns">

// //             <div className="field">

// //               <label>
// //                 {txt.targetJoint}
// //               </label>

// //               <select
// //                 value={
// //                   form.targetJoint
// //                 }
// //                 onChange={(e) =>
// //                   updateField(
// //                     "targetJoint",
// //                     e.target.value
// //                   )
// //                 }
// //               >

// //                 <option value="">
// //                   {txt.selectTargetJoint}
// //                 </option>

// //                 <option value="">
// //                   {txt.none}
// //                 </option>

// //                 {joints.map(
// //                   (joint) => (
// //                     <option
// //                       key={joint.value}
// //                       value={
// //                         joint.value
// //                       }
// //                     >
// //                       {joint.label}
// //                     </option>
// //                   )
// //                 )}

// //               </select>

// //             </div>


// //             <div className="field">

// //               <label>
// //                 {txt.lastBleed}
// //               </label>

// //               <input
// //                 type="date"
// //                 value={
// //                   form.lastBleedDate
// //                 }
// //                 onChange={(e) =>
// //                   updateField(
// //                     "lastBleedDate",
// //                     e.target.value
// //                   )
// //                 }
// //               />

// //             </div>

// //           </div>


// //           {/* OTHER DETAILS */}

// //           <div className="field full-width">

// //             <label>
// //               {txt.otherDetails}
// //             </label>

// //             <textarea
// //               rows="4"
// //               placeholder={
// //                 txt.otherDetailsPlaceholder
// //               }
// //               value={
// //                 form.otherBleedingDetails
// //               }
// //               onChange={(e) =>
// //                 updateField(
// //                   "otherBleedingDetails",
// //                   e.target.value
// //                 )
// //               }
// //             />

// //           </div>

// //         </div>


// //         {/* =================================================
// //             SECTION 04 - PHYSIOTHERAPY
// //         ================================================= */}

// //         <div
// //           className={`clinical-section ${
// //             physioDone
// //               ? "section-complete"
// //               : ""
// //           }`}
// //         >

// //           <div className="section-header">

// //             <div className="section-number">
// //               04
// //             </div>

// //             <div>

// //               <h2>
// //                 {txt.physiotherapy}
// //               </h2>

// //               <p>
// //                 {txt.physiotherapyDesc}
// //               </p>

// //             </div>

// //             {physioDone && (
// //               <div className="completion-mark">
// //                 ✓
// //               </div>
// //             )}

// //           </div>


// //           {/* CURRENT PHYSIO */}

// //           <div className="field">

// //             <label>
// //               {txt.currentlyPhysio}
// //               <span className="required">
// //                 {txt.required}
// //               </span>
// //             </label>

// //             <select
// //               value={
// //                 form.underPhysiotherapy === ""
// //                   ? ""
// //                   : form.underPhysiotherapy
// //                   ? "Yes"
// //                   : "No"
// //               }
// //               onChange={(e) => {

// //                 const value =
// //                   e.target.value;

// //                 updateField(
// //                   "underPhysiotherapy",
// //                   value === ""
// //                     ? ""
// //                     : value === "Yes"
// //                 );

// //                 if (
// //                   value === "Yes"
// //                 ) {
// //                   updateField(
// //                     "previousPhysiotherapy",
// //                     ""
// //                   );
// //                 }

// //               }}
// //             >

// //               <option value="">
// //                 {txt.selectOption}
// //               </option>

// //               <option value="Yes">
// //                 {txt.yes}
// //               </option>

// //               <option value="No">
// //                 {txt.no}
// //               </option>

// //             </select>

// //           </div>


// //           {/* =================================================
// //               YES → CURRENT PHYSIO DETAILS
// //           ================================================= */}

// //           {form.underPhysiotherapy ===
// //             true && (

// //             <div className="conditional-box">

// //               <h3>
// //                 {txt.currentPhysioSection}
// //               </h3>


// //               <div className="form-grid two-columns">

// //                 {/* LOCATION */}

// //                 <div className="field">

// //                   <label>
// //                     {txt.wherePhysio}
// //                   </label>

// //                   <select
// //                     value={
// //                       form.physiotherapyLocation
// //                     }
// //                     onChange={(e) =>
// //                       updateField(
// //                         "physiotherapyLocation",
// //                         e.target.value
// //                       )
// //                     }
// //                   >

// //                     <option value="">
// //                       {txt.selectOption}
// //                     </option>

// //                     <option value="Hospital">
// //                       {txt.hospital}
// //                     </option>

// //                     <option value="Clinic">
// //                       {txt.clinic}
// //                     </option>

// //                     <option value="Hemophilia Centre">
// //                       {txt.hemophiliaCentre}
// //                     </option>

// //                     <option value="Home">
// //                       {txt.home}
// //                     </option>

// //                   </select>

// //                 </div>


// //                 {/* SESSIONS */}

// //                 <div className="field">

// //                   <label>
// //                     {txt.sessions}
// //                   </label>

// //                   <select
// //                     value={
// //                       form.physiotherapySessions
// //                     }
// //                     onChange={(e) =>
// //                       updateField(
// //                         "physiotherapySessions",
// //                         e.target.value
// //                       )
// //                     }
// //                   >

// //                     <option value="">
// //                       {txt.selectOption}
// //                     </option>

// //                     <option value="Once a week">
// //                       {txt.onceWeek}
// //                     </option>

// //                     <option value="2-3 times a week">
// //                       {txt.twoThree}
// //                     </option>

// //                     <option value="More than 3 sessions a week">
// //                       {txt.moreThree}
// //                     </option>

// //                   </select>

// //                 </div>


// //                 {/* DURATION */}

// //                 <div className="field">

// //                   <label>
// //                     {txt.sessionDuration}
// //                   </label>

// //                   <select
// //                     value={
// //                       form.physiotherapyDuration
// //                     }
// //                     onChange={(e) =>
// //                       updateField(
// //                         "physiotherapyDuration",
// //                         e.target.value
// //                       )
// //                     }
// //                   >

// //                     <option value="">
// //                       {txt.selectOption}
// //                     </option>

// //                     <option value="Less than 10 minutes">
// //                       {txt.lessTen}
// //                     </option>

// //                     <option value="10-20 minutes">
// //                       {txt.tenTwenty}
// //                     </option>

// //                     <option value="20-30 minutes">
// //                       {txt.twentyThirty}
// //                     </option>

// //                     <option value="More than 30 minutes">
// //                       {txt.moreThirty}
// //                     </option>

// //                   </select>

// //                 </div>


// //                 {/* BODY PART */}

// //                 <div className="field">

// //                   <label>
// //                     {txt.affectedBodyPart}
// //                   </label>

// //                   <select
// //                     value={
// //                       form.physiotherapyBodyPart
// //                     }
// //                     onChange={(e) =>
// //                       updateField(
// //                         "physiotherapyBodyPart",
// //                         e.target.value
// //                       )
// //                     }
// //                   >

// //                     <option value="">
// //                       {txt.selectOption}
// //                     </option>

// //                     {joints.map(
// //                       (joint) => (
// //                         <option
// //                           key={joint.value}
// //                           value={
// //                             joint.value
// //                           }
// //                         >
// //                           {joint.label}
// //                         </option>
// //                       )
// //                     )}

// //                   </select>

// //                 </div>

// //               </div>


// //               {/* TREATMENT */}

// //               <div className="field">

// //                 <label>
// //                   {txt.treatmentReceived}
// //                 </label>

// //                 <select
// //                   value={
// //                     form.physiotherapyTreatment
// //                   }
// //                   onChange={(e) =>
// //                     updateField(
// //                       "physiotherapyTreatment",
// //                       e.target.value
// //                     )
// //                   }
// //                 >

// //                   <option value="">
// //                     {txt.selectOption}
// //                   </option>

// //                   <option value="Stretching">
// //                     {txt.stretching}
// //                   </option>

// //                   <option value="Strengthening">
// //                     {txt.strengthening}
// //                   </option>

// //                   <option value="Balance exercises">
// //                     {txt.balance}
// //                   </option>

// //                   <option value="General fitness">
// //                     {txt.generalFitness}
// //                   </option>

// //                   <option value="Joint movement exercises">
// //                     {txt.jointMovement}
// //                   </option>

// //                   <option value="Exercises for pain relief">
// //                     {txt.painRelief}
// //                   </option>

// //                 </select>

// //               </div>


// //               {/* EQUIPMENT */}

// //               <div className="field">

// //                 <label>
// //                   {txt.equipment}
// //                 </label>

// //                 <select
// //                   value={
// //                     form.physiotherapyEquipment
// //                   }
// //                   onChange={(e) =>
// //                     updateField(
// //                       "physiotherapyEquipment",
// //                       e.target.value
// //                     )
// //                   }
// //                 >

// //                   <option value="">
// //                     {txt.selectOption}
// //                   </option>

// //                   <option value="None">
// //                     {txt.noEquipment}
// //                   </option>

// //                   <option value="Dumbbells">
// //                     {txt.dumbbells}
// //                   </option>

// //                   <option value="Weight cuffs">
// //                     {txt.weightsCuffs}
// //                   </option>

// //                   <option value="Theraband">
// //                     {txt.theraband}
// //                   </option>

// //                   <option value="Yoga mat">
// //                     {txt.yogaMat}
// //                   </option>

// //                   <option value="Other">
// //                     {txt.otherEquipment}
// //                   </option>

// //                 </select>

// //               </div>


// //               {/* HELPING */}

// //               <div className="field">

// //                 <label>
// //                   {txt.helping}
// //                 </label>

// //                 <select
// //                   value={
// //                     form.physiotherapyHelping
// //                   }
// //                   onChange={(e) =>
// //                     updateField(
// //                       "physiotherapyHelping",
// //                       e.target.value
// //                     )
// //                   }
// //                 >

// //                   <option value="">
// //                     {txt.selectOption}
// //                   </option>

// //                   <option value="Yes">
// //                     {txt.yes}
// //                   </option>

// //                   <option value="No">
// //                     {txt.no}
// //                   </option>

// //                 </select>

// //               </div>


// //               {/* PROBLEMS */}

// //               <div className="field">

// //                 <label>
// //                   {txt.problems}
// //                 </label>

// //                 <div className="problem-grid">

// //                   {[
// //                     {
// //                       value: "None",
// //                       label: txt.noProblems,
// //                     },
// //                     {
// //                       value: "Pain",
// //                       label: txt.pain,
// //                     },
// //                     {
// //                       value: "New bleeding",
// //                       label: txt.newBleeding,
// //                     },
// //                     {
// //                       value: "Stiffness",
// //                       label: txt.stiffness,
// //                     },
// //                     {
// //                       value: "Increased swelling",
// //                       label: txt.increasedSwelling,
// //                     },
// //                     {
// //                       value: "Feeling tired",
// //                       label: txt.tired,
// //                     },
// //                   ].map(
// //                     (problem) => {

// //                       const active =
// //                         form.physiotherapyProblems.includes(
// //                           problem.value
// //                         );

// //                       return (
// //                         <button
// //                           key={
// //                             problem.value
// //                           }
// //                           type="button"
// //                           className={`problem-chip ${
// //                             active
// //                               ? "active"
// //                               : ""
// //                           }`}
// //                           onClick={() =>
// //                             togglePhysioProblem(
// //                               problem.value
// //                             )
// //                           }
// //                         >

// //                           <span>
// //                             {active
// //                               ? "✓"
// //                               : ""}
// //                           </span>

// //                           {problem.label}

// //                         </button>
// //                       );
// //                     }
// //                   )}

// //                 </div>

// //               </div>

// //             </div>
// //           )}


// //           {/* =================================================
// //               NO → PREVIOUS PHYSIO
// //           ================================================= */}

// //           {form.underPhysiotherapy ===
// //             false && (

// //             <div className="conditional-box">

// //               <h3>
// //                 {txt.previousPhysioSection}
// //               </h3>


// //               <div className="field">

// //                 <label>
// //                   {txt.previousPhysio}
// //                 </label>

// //                 <select
// //                   value={
// //                     form.previousPhysiotherapy === ""
// //                       ? ""
// //                       : form.previousPhysiotherapy
// //                       ? "Yes"
// //                       : "No"
// //                   }
// //                   onChange={(e) =>
// //                     updateField(
// //                       "previousPhysiotherapy",
// //                       e.target.value ===
// //                         "Yes"
// //                     )
// //                   }
// //                 >

// //                   <option value="">
// //                     {txt.selectOption}
// //                   </option>

// //                   <option value="Yes">
// //                     {txt.yes}
// //                   </option>

// //                   <option value="No">
// //                     {txt.no}
// //                   </option>

// //                 </select>

// //               </div>


// //               {form.previousPhysiotherapy ===
// //                 true && (

// //                 <div className="form-grid two-columns">

// //                   <div className="field">

// //                     <label>
// //                       {txt.stoppedWhen}
// //                     </label>

// //                     <input
// //                       type="date"
// //                       value={
// //                         form.physiotherapyStoppedDate
// //                       }
// //                       onChange={(e) =>
// //                         updateField(
// //                           "physiotherapyStoppedDate",
// //                           e.target.value
// //                         )
// //                       }
// //                     />

// //                   </div>


// //                   <div className="field">

// //                     <label>
// //                       {txt.stoppedWhy}
// //                     </label>

// //                     <select
// //                       value={
// //                         form.physiotherapyStoppedReason
// //                       }
// //                       onChange={(e) =>
// //                         updateField(
// //                           "physiotherapyStoppedReason",
// //                           e.target.value
// //                         )
// //                       }
// //                     >

// //                       <option value="">
// //                         {
// //                           txt.stoppedWhyPlaceholder
// //                         }
// //                       </option>

// //                       <option value="No longer needed">
// //                         {txt.noNeed}
// //                       </option>

// //                       <option value="Symptoms improved">
// //                         {txt.improved}
// //                       </option>

// //                       <option value="Difficulty accessing physiotherapy">
// //                         {txt.access}
// //                       </option>

// //                       <option value="Cost / financial reasons">
// //                         {txt.cost}
// //                       </option>

// //                       <option value="Time constraints">
// //                         {txt.time}
// //                       </option>

// //                       <option value="Other">
// //                         {txt.other}
// //                       </option>

// //                     </select>

// //                   </div>

// //                 </div>

// //               )}

// //             </div>

// //           )}

// //         </div>


// //         {/* =================================================
// //             SECTION 05 - MOBILITY
// //         ================================================= */}

// //         <div className="clinical-section">

// //           <div className="section-header">

// //             <div className="section-number">
// //               05
// //             </div>

// //             <div>

// //               <h2>
// //                 {txt.mobility}
// //               </h2>

// //             </div>

// //           </div>


// //           <div className="form-grid two-columns">

// //             <div className="field">

// //               <label>
// //                 {txt.mobility}
// //               </label>

// //               <select
// //                 value={
// //                   form.mobilityLimitation
// //                 }
// //                 onChange={(e) =>
// //                   updateField(
// //                     "mobilityLimitation",
// //                     e.target.value
// //                   )
// //                 }
// //               >

// //                 <option value="">
// //                   {txt.selectMobility}
// //                 </option>

// //                 <option value="None">
// //                   {txt.noLimitation}
// //                 </option>

// //                 <option value="Mild">
// //                   {txt.mild}
// //                 </option>

// //                 <option value="Moderate">
// //                   {txt.moderate}
// //                 </option>

// //                 <option value="Severe">
// //                   {txt.severe}
// //                 </option>

// //               </select>

// //             </div>


// //             <div className="field">

// //               <label>
// //                 {txt.assistive}
// //               </label>

// //               <select
// //                 value={
// //                   form.assistiveDevices
// //                 }
// //                 onChange={(e) =>
// //                   updateField(
// //                     "assistiveDevices",
// //                     e.target.value
// //                   )
// //                 }
// //               >
// //                 <option value="">
// //                   {txt.assistivePlaceholder}
// //                 </option>

// //                 <option value="None">
// //                   {txt.assistiveOptions.none}
// //                 </option>

// //                 <option value="Knee Brace">
// //                   {txt.assistiveOptions.kneeBrace}
// //                 </option>

// //                 <option value="Ankle / Foot Brace">
// //                   {txt.assistiveOptions.ankleBrace}
// //                 </option>

// //                 <option value="Elbow Brace">
// //                   {txt.assistiveOptions.elbowBrace}
// //                 </option>

// //                 <option value="Wrist Support">
// //                   {txt.assistiveOptions.wristSupport}
// //                 </option>

// //                 <option value="Cane / Walking Stick">
// //                   {txt.assistiveOptions.cane}
// //                 </option>

// //                 <option value="Crutches">
// //                   {txt.assistiveOptions.crutches}
// //                 </option>

// //                 <option value="Walker">
// //                   {txt.assistiveOptions.walker}
// //                 </option>

// //                 <option value="Wheelchair">
// //                   {txt.assistiveOptions.wheelchair}
// //                 </option>

// //                 <option value="Other">
// //                   {txt.assistiveOptions.other}
// //                 </option>
// //               </select>

// //             </div>

// //           </div>

// //         </div>


// //         {/* =================================================
// //             SECTION 06 - DOCTOR
// //         ================================================= */}

// //         <div className="clinical-section">

// //           <div className="section-header">

// //             <div className="section-number">
// //               06
// //             </div>

// //             <div>

// //               <h2>
// //                 {txt.doctor}
// //               </h2>

// //               <p>
// //                 {txt.doctorDesc}
// //               </p>

// //             </div>

// //           </div>


// //           <div className="field">

// //             <label>
// //               {txt.doctor}
// //               <span className="required">
// //                 {txt.required}
// //               </span>
// //             </label>

// //             <select
// //               value={
// //                 form.consultingDoctorId
// //               }
// //               onChange={(e) =>
// //                 updateField(
// //                   "consultingDoctorId",
// //                   e.target.value
// //                 )
// //               }
// //               disabled={
// //                 doctorFieldLocked
// //               }
// //             >

// //               <option value="">
// //                 {doctorsLoading
// //                   ? txt.doctorLoading
// //                   : txt.selectDoctor}
// //               </option>

// //               {!doctorsLoading &&
// //                 doctors.length ===
// //                   0 && (
// //                   <option value="">
// //                     {txt.noDoctors}
// //                   </option>
// //                 )}

// //               {doctors.map((doctor) => (
// //                 <option
// //                   key={doctor._id}
// //                   value={doctor._id}
// //                 >
// //                   {doctor.nameTranslations?.[language] ||
// //                     doctor.fullName}{" "}
// //                   — {doctor.professionalId}
// //                 </option>
// //               ))}

// //             </select>

// //             {doctorAssigned && !doctorChangePending && (
// //               <button
// //                 type="button"
// //                 className="doctor-change-button"
// //                 onClick={() => {
// //                   setChangeRequestReason("");
// //                   setChangeRequestModalOpen(true);
// //                 }}
// //                 disabled={doctorStatusLoading || changeRequestLoading}
// //               >
// //                 {txt.requestDoctorChange}
// //               </button>
// //             )}

// //             {doctorChangePending && (
// //               <div className="doctor-change-pending">
// //                 <span className="doctor-change-pending-icon">⏳</span>
// //                 <span>{txt.requestPending}</span>
// //               </div>
// //             )}

// //           </div>

// //         </div>


// //         {/* =================================================
// //             DOCTOR CHANGE REQUEST MODAL
// //         ================================================= */}

// //         {changeRequestModalOpen && (
// //           <div
// //             className="doctor-change-modal-overlay"
// //             onMouseDown={(e) => {
// //               if (e.target === e.currentTarget && !changeRequestLoading) {
// //                 setChangeRequestModalOpen(false);
// //               }
// //             }}
// //           >
// //             <div
// //               className="doctor-change-modal"
// //               role="dialog"
// //               aria-modal="true"
// //               aria-labelledby="doctor-change-title"
// //             >
// //               <div className="doctor-change-modal-header">
// //                 <div>
// //                   <h3 id="doctor-change-title">
// //                     {txt.requestDoctorChangeTitle}
// //                   </h3>
// //                   <p>{txt.requestDoctorChangeText}</p>
// //                 </div>
// //                 <button
// //                   type="button"
// //                   className="doctor-change-close"
// //                   onClick={() => setChangeRequestModalOpen(false)}
// //                   disabled={changeRequestLoading}
// //                   aria-label={txt.cancel}
// //                 >
// //                   ×
// //                 </button>
// //               </div>

// //               <div className="doctor-change-modal-body">
// //                 <label className="doctor-change-reason-label">
// //                   {txt.changeReason}
// //                 </label>
// //                 <textarea
// //                   value={changeRequestReason}
// //                   onChange={(e) => setChangeRequestReason(e.target.value)}
// //                   placeholder={txt.changeReasonPlaceholder}
// //                   rows={5}
// //                   disabled={changeRequestLoading}
// //                   className="doctor-change-reason-input"
// //                 />
// //               </div>

// //               <div className="doctor-change-modal-actions">
// //                 <button
// //                   type="button"
// //                   className="doctor-change-cancel"
// //                   onClick={() => setChangeRequestModalOpen(false)}
// //                   disabled={changeRequestLoading}
// //                 >
// //                   {txt.cancel}
// //                 </button>

// //                 <button
// //                   type="button"
// //                   className="doctor-change-submit"
// //                   onClick={handleDoctorChangeRequest}
// //                   disabled={changeRequestLoading}
// //                 >
// //                   {changeRequestLoading
// //                     ? txt.sendingRequest
// //                     : txt.sendRequest}
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         )}


// //         {/* =================================================
// //             ERROR
// //         ================================================= */}

// //         {error && (

// //           <div className="error-box">

// //             <span className="error-icon">
// //               !
// //             </span>

// //             <span>
// //               {error}
// //             </span>

// //           </div>

// //         )}


// //         {/* =================================================
// //             ACTIONS
// //         ================================================= */}

// //         <div className="action-row">

// //           <button
// //             type="button"
// //             className="back-button"
// //             onClick={() =>
// //               navigate("/awareness")
// //             }
// //           >
// //             ← {txt.back}
// //           </button>


// //           <button
// //             type="button"
// //             className="continue-button"
// //             onClick={handleSubmit}
// //             disabled={loading}
// //           >

// //             {loading ? (
// //               <>
// //                 <span className="spinner"></span>
// //                 {txt.saving}
// //               </>
// //             ) : (
// //               <>
// //                 {txt.save}
// //                 <span>→</span>
// //               </>
// //             )}

// //           </button>

// //         </div>


// //         {/* =================================================
// //             FOOTER
// //         ================================================= */}

// //         <div className="bottom-note">

// //           <span className="small-info">
// //             i
// //           </span>

// //           <span>
// //             {txt.secure}
// //           </span>

// //         </div>

// //       </div>


// //       {/* =================================================
// //           STYLES
// //       ================================================= */}

// //       <style>{`

// //         * {
// //           box-sizing: border-box;
// //         }

// //         .clinical-page {
// //           min-height: 100vh;
// //           width: 100%;
// //           padding: 32px 20px;

// //           background:
// //             linear-gradient(
// //               135deg,
// //               #eef3fa 0%,
// //               #f7f9fd 50%,
// //               #edf2f9 100%
// //             );

// //           display: flex;
// //           justify-content: center;
// //           align-items: flex-start;

// //           font-family:
// //             Inter,
// //             -apple-system,
// //             BlinkMacSystemFont,
// //             "Segoe UI",
// //             sans-serif;

// //           color: #1c2942;
// //         }

// //         .clinical-container {
// //           width: min(960px, 100%);

// //           padding: 28px;

// //           background: #ffffff;

// //           border:
// //             1px solid #dce4ef;

// //           border-radius: 18px;

// //           box-shadow:
// //             0 18px 50px
// //             rgba(30, 48, 95, 0.09);
// //         }

// //         .clinical-header {
// //           display: flex;
// //           align-items: center;
// //           gap: 13px;

// //           padding-bottom: 22px;

// //           border-bottom:
// //             1px solid #e1e6ee;
// //         }

// //         .header-icon {
// //           width: 44px;
// //           height: 44px;

// //           flex-shrink: 0;

// //           display: flex;
// //           align-items: center;
// //           justify-content: center;

// //           border-radius: 11px;

// //           background:
// //             linear-gradient(
// //               135deg,
// //               #24328f,
// //               #4a7dfc
// //             );

// //           color: white;

// //           font-size: 25px;
// //           font-weight: 300;
// //         }

// //         .header-eyebrow {
// //           display: block;
// //           margin-bottom: 4px;

// //           color: #4a7dfc;

// //           font-size: 8px;
// //           font-weight: 700;

// //           letter-spacing: 1px;
// //         }

// //         .header-text h1 {
// //           margin: 0;

// //           color: #1d2a47;

// //           font-size: 23px;
// //           font-weight: 700;
// //         }

// //         .header-text p {
// //           margin: 5px 0 0;

// //           color: #78869a;

// //           font-size: 10px;
// //           line-height: 1.5;
// //         }

// //         .info-banner {
// //           margin-top: 18px;

// //           padding: 12px 14px;

// //           display: flex;
// //           align-items: flex-start;

// //           gap: 9px;

// //           border:
// //             1px solid #cfe3eb;

// //           border-radius: 10px;

// //           background: #effafd;
// //         }

// //         .info-banner-icon {
// //           width: 21px;
// //           height: 21px;

// //           flex-shrink: 0;

// //           display: flex;
// //           align-items: center;
// //           justify-content: center;

// //           border-radius: 50%;

// //           background: #d9f1f6;

// //           color: #3b8093;

// //           font-size: 10px;
// //           font-weight: 700;
// //         }

// //         .info-banner strong {
// //           display: block;

// //           color: #315d70;

// //           font-size: 9px;
// //         }

// //         .info-banner p {
// //           margin: 3px 0 0;

// //           color: #648499;

// //           font-size: 8px;

// //           line-height: 1.5;
// //         }

// //         .clinical-section {
// //           margin-top: 18px;

// //           padding: 19px;

// //           border:
// //             1px solid #dfe6ef;

// //           border-radius: 12px;

// //           background: #ffffff;

// //           transition:
// //             border-color .2s ease,
// //             background .2s ease;
// //         }

// //         .clinical-section.section-complete {
// //           border-color: #cdd9ee;
// //           background: #fbfcff;
// //         }

// //         .section-header {
// //           display: flex;
// //           align-items: center;

// //           gap: 10px;

// //           margin-bottom: 18px;
// //         }

// //         .section-number {
// //           width: 30px;
// //           height: 30px;

// //           flex-shrink: 0;

// //           display: flex;
// //           align-items: center;
// //           justify-content: center;

// //           border-radius: 8px;

// //           background: #eef2ff;

// //           color: #24328f;

// //           font-size: 8px;
// //           font-weight: 700;
// //         }

// //         .section-header h2 {
// //           margin: 0;

// //           color: #202d47;

// //           font-size: 14px;
// //           font-weight: 700;
// //         }

// //         .section-header p {
// //           margin: 3px 0 0;

// //           color: #8996a8;

// //           font-size: 8px;
// //         }

// //         .completion-mark {
// //           width: 21px;
// //           height: 21px;

// //           margin-left: auto;

// //           display: flex;
// //           align-items: center;
// //           justify-content: center;

// //           border-radius: 50%;

// //           background: #edf8f2;

// //           color: #2b9660;

// //           border:
// //             1px solid #d5ebdf;

// //           font-size: 10px;
// //           font-weight: 700;
// //         }

// //         .form-grid {
// //           display: grid;

// //           grid-template-columns:
// //             repeat(3, minmax(0, 1fr));

// //           gap: 14px;
// //         }

// //         .form-grid.two-columns {
// //           grid-template-columns:
// //             repeat(2, minmax(0, 1fr));

// //           margin-top: 16px;
// //         }

// //         .field {
// //           min-width: 0;
// //           margin-bottom: 14px;
// //         }

// //         .full-width {
// //           grid-column: 1 / -1;
// //         }

// //         .field label {
// //           display: block;

// //           margin-bottom: 6px;

// //           color: #46556d;

// //           font-size: 9px;

// //           font-weight: 600;
// //         }

// //         .required {
// //           margin-left: 3px;
// //           color: #d34c4c;
// //         }

// //         .field-help {
// //           margin: -1px 0 9px;

// //           color: #8a97a9;

// //           font-size: 8px;

// //           line-height: 1.4;
// //         }

// //         .field input,
// //         .field select,
// //         .doctor-change-button {
// //           margin-top: 12px;
// //           width: 100%;
// //           min-height: 35px;
// //           border: 1px solid #1890b4;
// //           border-radius: 10px;
// //           background: #fff;
// //           color: black;
// //           font-size: 9px;
// //           font-weight: 200;
// //           cursor: pointer;
// //           transition: 0.2s ease;
// //         }

// //         .doctor-change-button:hover:not(:disabled) {
// //           background: #fff5f4;
// //         }

// //         .doctor-change-button:disabled {
// //           opacity: 0.6;
// //           cursor: not-allowed;
// //         }

// //         .doctor-change-pending {
// //           display: flex;
// //           align-items: flex-start;
// //           gap: 9px;
// //           margin-top: 12px;
// //           padding: 12px 14px;
// //           border: 1px solid #f0c36d;
// //           border-radius: 10px;
// //           background: #fffaf0;
// //           color: #7a4b00;
// //           font-size: 13px;
// //           line-height: 1.5;
// //         }

// //         .doctor-change-pending-icon {
// //           flex: 0 0 auto;
// //         }

// //         .doctor-change-modal-overlay {
// //           position: fixed;
// //           inset: 0;
// //           z-index: 9999;
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           padding: 20px;
// //           background: rgba(0, 0, 0, 0.45);
// //         }

// //         .doctor-change-modal {
// //           width: min(560px, 100%);
// //           max-height: calc(100vh - 40px);
// //           overflow-y: auto;
// //           border-radius: 16px;
// //           background: #fff;
// //           box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
// //         }

// //         .doctor-change-modal-header {
// //           display: flex;
// //           align-items: flex-start;
// //           justify-content: space-between;
// //           gap: 16px;
// //           padding: 22px 22px 16px;
// //           border-bottom: 1px solid #eee;
// //         }

// //         .doctor-change-modal-header h3 {
// //           margin: 0 0 7px;
// //           font-size: 20px;
// //           line-height: 1.25;
// //         }

// //         .doctor-change-modal-header p {
// //           margin: 0;
// //           color: #666;
// //           font-size: 13px;
// //           line-height: 1.55;
// //         }

// //         .doctor-change-close {
// //           width: 34px;
// //           height: 34px;
// //           flex: 0 0 auto;
// //           border: 0;
// //           border-radius: 8px;
// //           background: #f5f5f5;
// //           color: #444;
// //           font-size: 24px;
// //           line-height: 1;
// //           cursor: pointer;
// //         }

// //         .doctor-change-modal-body {
// //           padding: 20px 22px;
// //         }

// //         .doctor-change-reason-label {
// //           display: block;
// //           margin-bottom: 8px;
// //           font-size: 14px;
// //           font-weight: 700;
// //         }

// //         .doctor-change-reason-input {
// //           width: 100%;
// //           min-height: 120px;
// //           box-sizing: border-box;
// //           resize: vertical;
// //           padding: 12px 13px;
// //           border: 1px solid #d6d6d6;
// //           border-radius: 10px;
// //           outline: none;
// //           font: inherit;
// //           line-height: 1.5;
// //         }

// //         .doctor-change-reason-input:focus {
// //           border-color: #777;
// //           box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06);
// //         }

// //         .doctor-change-modal-actions {
// //           display: flex;
// //           justify-content: flex-end;
// //           gap: 10px;
// //           padding: 0 22px 22px;
// //         }

// //         .doctor-change-cancel,
// //         .doctor-change-submit {
// //           min-height: 42px;
// //           padding: 0 18px;
// //           border-radius: 9px;
// //           font-size: 14px;
// //           font-weight: 700;
// //           cursor: pointer;
// //         }

// //         .doctor-change-cancel {
// //           border: 1px solid #d6d6d6;
// //           background: #fff;
// //           color: #444;
// //         }

// //         .doctor-change-submit {
// //           border: 1px solid #111;
// //           background: #111;
// //           color: #fff;
// //         }

// //         .doctor-change-cancel:disabled,
// //         .doctor-change-submit:disabled {
// //           opacity: 0.6;
// //           cursor: not-allowed;
// //         }

// //         .field textarea {
// //           width: 100%;

// //           padding: 10px 12px;

// //           border:
// //             1px solid #d8e0eb;

// //           border-radius: 8px;

// //           background: #ffffff;

// //           color: #26344d;

// //           font-family: inherit;

// //           font-size: 10px;

// //           outline: none;

// //           transition:
// //             border-color .15s ease,
// //             box-shadow .15s ease,
// //             background .15s ease;
// //         }

// //         .field input,
// //         .field select {
// //           height: 40px;
// //         }

// //         .field textarea {
// //           resize: vertical;
// //           min-height: 85px;
// //         }

// //         .field input::placeholder,
// //         .field textarea::placeholder {
// //           color: #a3adbc;
// //         }

// //         .field input:hover,
// //         .field select:hover,
// //         .field textarea:hover {
// //           border-color: #bcc8da;
// //           background: #fcfdff;
// //         }

// //         .field input:focus,
// //         .field select:focus,
// //         .field textarea:focus {
// //           border-color: #4a7dfc;

// //           background: #ffffff;

// //           box-shadow:
// //             0 0 0 3px
// //             rgba(74, 125, 252, .10);
// //         }

// //         .field select {
// //           cursor: pointer;
// //         }

// //         .field select:disabled {
// //           opacity: .65;
// //           cursor: not-allowed;
// //         }


// //         /* ================================================
// //            MEDICATION MULTI-SELECT DROPDOWN
// //         ================================================= */

// //         .medication-dropdown {
// //           position: relative;
// //           width: 100%;
// //         }

// //         .medication-dropdown-button {
// //           width: 100%;
// //           min-height: 38px;

// //           padding: 0 11px;

// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;

// //           gap: 8px;

// //           border:
// //             1px solid #d8e0eb;

// //           border-radius: 7px;

// //           background: #ffffff;

// //           color: #334155;

// //           font-family: inherit;
// //           font-size: 10px;
// //           font-weight: 500;

// //           cursor: pointer;

// //           text-align: left;

// //           transition:
// //             border-color .15s ease,
// //             box-shadow .15s ease;
// //         }

// //         .medication-dropdown-button:hover {
// //           border-color: #bcc8da;
// //           background: #fcfdff;
// //         }

// //         .medication-dropdown-button:focus {
// //           outline: none;

// //           border-color: #4a7dfc;

// //           box-shadow:
// //             0 0 0 3px
// //             rgba(74, 125, 252, .10);
// //         }

// //         .medication-dropdown-value {
// //           flex: 1;
// //           min-width: 0;

// //           overflow: hidden;
// //           text-overflow: ellipsis;
// //           white-space: nowrap;
// //         }

// //         .medication-dropdown-arrow {
// //           flex-shrink: 0;

// //           color: #66758b;

// //           font-size: 13px;
// //           line-height: 1;
// //         }

// //         .medication-dropdown-overlay {
// //           position: fixed;

// //           inset: 0;

// //           z-index: 90;

// //           width: 100%;
// //           height: 100%;

// //           padding: 0;

// //           border: none;

// //           background: transparent;

// //           cursor: default;
// //         }

// //         .medication-dropdown-menu {
// //           position: absolute;

// //           left: 0;
// //           right: 0;
// //           top: calc(100% + 4px);

// //           z-index: 100;

// //           max-height: 220px;

// //           overflow-y: auto;

// //           padding: 6px;

// //           border:
// //             1px solid #d8e0eb;

// //           border-radius: 8px;

// //           background: #ffffff;

// //           box-shadow:
// //             0 10px 24px
// //             rgba(31, 52, 86, .14);
// //         }

// //         .medication-option {
// //           display: flex;

// //           align-items: center;

// //           gap: 8px;

// //           min-height: 32px;

// //           padding: 6px 7px;

// //           border-radius: 6px;

// //           color: #4c5b70;

// //           font-size: 9px;
// //           font-weight: 600;

// //           cursor: pointer;

// //           transition:
// //             background .15s ease;
// //         }

// //         .medication-option:hover {
// //           background: #f4f7ff;
// //         }

// //         .medication-option input {
// //           width: 14px;
// //           height: 14px;

// //           flex-shrink: 0;

// //           margin: 0;

// //           cursor: pointer;

// //           accent-color: #4a7dfc;
// //         }

// //         .joint-field {
// //           margin-top: 16px;
// //         }

// //         .field-help {
// //           margin: 6px 0 0;
// //           color: #7b8798;
// //           font-size: 8px;
// //           line-height: 1.5;
// //         }

// //         .selected-joints-help {
// //           margin-top: 9px;
// //           font-weight: 600;
// //         }

// //         .joint-grid {
// //           display: flex;
// //           flex-wrap: wrap;
// //           gap: 7px;
// //         }

// //         .joint-chip {
// //           min-height: 31px;

// //           padding: 0 11px;

// //           display: flex;
// //           align-items: center;

// //           gap: 5px;

// //           border:
// //             1px solid #d8e0eb;

// //           border-radius: 999px;

// //           background: #ffffff;

// //           color: #5c6a7e;

// //           font-family: inherit;

// //           font-size: 9px;

// //           font-weight: 600;

// //           cursor: pointer;

// //           transition: all .15s ease;
// //         }

// //         .joint-chip:hover {
// //           border-color: #9eb3dc;

// //           background: #f5f8ff;

// //           color: #24328f;
// //         }

// //         .joint-chip.active {
// //           border-color: #4a7dfc;

// //           background: #eef2ff;

// //           color: #24328f;
// //         }

// //         .joint-check {
// //           width: 14px;
// //           height: 14px;

// //           display: flex;
// //           align-items: center;
// //           justify-content: center;

// //           border-radius: 50%;

// //           background: #edf0f5;

// //           color: transparent;

// //           font-size: 8px;
// //         }

// //         .joint-chip.active
// //         .joint-check {
// //           background: #4a7dfc;
// //           color: #ffffff;
// //         }

// //         /* ================================================
// //            CONDITIONAL PHYSIO BOX
// //         ================================================= */

// //         .conditional-box {
// //           margin-top: 17px;

// //           padding: 16px;

// //           border:
// //             1px solid #dce6f3;

// //           border-radius: 10px;

// //           background: #f9fbff;
// //         }

// //         .conditional-box h3 {
// //           margin: 0 0 15px;

// //           color: #2a3c5d;

// //           font-size: 11px;

// //           font-weight: 700;
// //         }

// //         /* ================================================
// //            PROBLEM CHIPS
// //         ================================================= */

// //         .problem-grid {
// //           display: flex;

// //           flex-wrap: wrap;

// //           gap: 7px;
// //         }

// //         .problem-chip {
// //           min-height: 34px;

// //           padding: 0 11px;

// //           display: flex;

// //           align-items: center;

// //           gap: 6px;

// //           border:
// //             1px solid #d8e0eb;

// //           border-radius: 8px;

// //           background: #ffffff;

// //           color: #5c6a7e;

// //           font-family: inherit;

// //           font-size: 9px;

// //           font-weight: 600;

// //           cursor: pointer;

// //           transition: all .15s ease;
// //         }

// //         .problem-chip:hover {
// //           border-color: #9eb3dc;

// //           background: #f5f8ff;
// //         }

// //         .problem-chip.active {
// //           border-color: #4a7dfc;

// //           background: #eef2ff;

// //           color: #24328f;
// //         }

// //         .problem-chip span {
// //           width: 15px;
// //           height: 15px;

// //           display: flex;

// //           align-items: center;
// //           justify-content: center;

// //           border-radius: 50%;

// //           background: #edf0f5;

// //           font-size: 8px;
// //         }

// //         .problem-chip.active span {
// //           background: #4a7dfc;
// //           color: #ffffff;
// //         }

// //         /* ================================================
// //            ERROR
// //         ================================================= */

// //         .error-box {
// //           margin-top: 16px;

// //           padding: 10px 12px;

// //           display: flex;

// //           align-items: center;

// //           gap: 8px;

// //           border:
// //             1px solid #f0c9c6;

// //           border-radius: 9px;

// //           background: #fff6f5;

// //           color: #b3261e;

// //           font-size: 9px;
// //         }

// //         .error-icon {
// //           width: 19px;
// //           height: 19px;

// //           flex-shrink: 0;

// //           display: flex;

// //           align-items: center;
// //           justify-content: center;

// //           border-radius: 50%;

// //           background: #fde4e2;

// //           font-size: 9px;

// //           font-weight: 700;
// //         }

// //         /* ================================================
// //            ACTIONS
// //         ================================================= */

// //         .action-row {
// //           margin-top: 22px;

// //           display: flex;

// //           align-items: center;

// //           justify-content: space-between;

// //           gap: 12px;
// //         }

// //         .back-button,
// //         .continue-button {
// //           height: 40px;

// //           padding: 0 17px;

// //           display: flex;

// //           align-items: center;

// //           justify-content: center;

// //           gap: 7px;

// //           border-radius: 8px;

// //           font-family: inherit;

// //           font-size: 10px;

// //           font-weight: 600;

// //           cursor: pointer;

// //           transition: all .15s ease;
// //         }

// //         .back-button {
// //           min-width: 90px;

// //           border:
// //             1px solid #d8e0eb;

// //           background: #f7f9fc;

// //           color: #657388;
// //         }

// //         .back-button:hover {
// //           border-color: #c4cfde;

// //           background: #eef2f7;

// //           color: #3f4e65;
// //         }

// //         .continue-button {
// //           min-width: 170px;

// //           border: none;

// //           background:
// //             linear-gradient(
// //               135deg,
// //               #4a7dfc,
// //               #5f8dff
// //             );

// //           color: #ffffff;

// //           box-shadow:
// //             0 6px 16px
// //             rgba(74, 125, 252, .20);
// //         }

// //         .continue-button:hover:not(:disabled) {
// //           transform: translateY(-1px);

// //           box-shadow:
// //             0 8px 20px
// //             rgba(74, 125, 252, .28);
// //         }

// //         .continue-button:disabled {
// //           opacity: .65;

// //           cursor: not-allowed;

// //           transform: none;

// //           box-shadow: none;
// //         }

// //         .spinner {
// //           width: 12px;
// //           height: 12px;

// //           border:
// //             2px solid
// //             rgba(255,255,255,.35);

// //           border-top-color: #ffffff;

// //           border-radius: 50%;

// //           animation:
// //             spin .7s linear infinite;
// //         }

// //         @keyframes spin {
// //           to {
// //             transform: rotate(360deg);
// //           }
// //         }

// //         .bottom-note {
// //           margin-top: 18px;

// //           padding-top: 12px;

// //           display: flex;

// //           align-items: center;

// //           justify-content: center;

// //           gap: 6px;

// //           border-top:
// //             1px solid #e7ebf1;

// //           color: #8a97a8;

// //           font-size: 8px;

// //           text-align: center;
// //         }

// //         .small-info {
// //           width: 15px;
// //           height: 15px;

// //           flex-shrink: 0;

// //           display: flex;

// //           align-items: center;

// //           justify-content: center;

// //           border-radius: 50%;

// //           background: #eef2ff;

// //           color: #4a7dfc;

// //           font-size: 8px;

// //           font-weight: 700;
// //         }

// //         @media (max-width: 800px) {

// //           .clinical-page {
// //             padding: 22px 14px;
// //           }

// //           .clinical-container {
// //             padding: 22px;

// //             border-radius: 15px;
// //           }

// //           .form-grid {
// //             grid-template-columns:
// //               repeat(2, minmax(0, 1fr));
// //           }

// //         }

// //         @media (max-width: 600px) {

// //           .clinical-page {
// //             padding: 0;

// //             background: #f4f7fb;
// //           }

// //           .clinical-container {
// //             width: 100%;

// //             padding: 18px 14px;

// //             border-radius: 0;

// //             border-left: none;
// //             border-right: none;

// //             box-shadow: none;
// //           }

// //           .clinical-header {
// //             padding-bottom: 17px;
// //           }

// //           .header-icon {
// //             width: 38px;
// //             height: 38px;

// //             font-size: 22px;
// //           }

// //           .header-text h1 {
// //             font-size: 18px;
// //           }

// //           .header-text p {
// //             font-size: 8px;
// //           }

// //           .clinical-section {
// //             padding: 15px;

// //             margin-top: 13px;

// //             border-radius: 10px;
// //           }

// //           .section-header {
// //             margin-bottom: 14px;
// //           }

// //           .section-header h2 {
// //             font-size: 12px;
// //           }

// //           .section-header p {
// //             font-size: 7px;
// //           }

// //           .form-grid,
// //           .form-grid.two-columns {
// //             grid-template-columns: 1fr;

// //             gap: 12px;
// //           }

// //           .joint-grid,
// //           .problem-grid {
// //             gap: 6px;
// //           }

// //           .joint-chip,
// //           .problem-chip {
// //             font-size: 8px;
// //           }

// //           .action-row {
// //             flex-direction: column-reverse;

// //             align-items: stretch;
// //           }

// //           .back-button,
// //           .continue-button {
// //             width: 100%;

// //             height: 42px;
// //           }

// //           .bottom-note {
// //             align-items: flex-start;

// //             font-size: 7px;
// //           }

// //         }

// //         @media (max-width: 380px) {

// //           .clinical-container {
// //             padding: 15px 11px;
// //           }

// //           .header-icon {
// //             width: 34px;
// //             height: 34px;
// //           }

// //           .header-text h1 {
// //             font-size: 16px;
// //           }

// //           .info-banner {
// //             padding: 10px;
// //           }

// //           .clinical-section {
// //             padding: 13px;
// //           }

// //           .section-number {
// //             width: 27px;
// //             height: 27px;
// //           }

// //         }

// //         @media (prefers-reduced-motion: reduce) {

// //           .spinner {
// //             animation: none;
// //           }

// //           .clinical-section,
// //           .joint-chip,
// //           .problem-chip,
// //           .back-button,
// //           .continue-button {
// //             transition: none;
// //           }

// //         }

// //       `}</style>

// //     </div>
// //   );
// // };

// // export default HemophiliaDetailsScreen;


// // import React, { useEffect, useState } from "react";
// // import api from "../apiClient";
// // import { useNavigate } from "react-router-dom";
// // import { useTranslation } from "react-i18next";


// // // =====================================================
// // // DOCTOR NAME TRANSLATIONS
// // // =====================================================
// // // Doctor names are normally proper names, but the current
// // // registered doctors are translated here because the UI
// // // requirement is to display their names in Hindi/Marathi.
// // //
// // // The professional ID is used as the stable key so that
// // // changing the doctor's name in the database does not
// // // accidentally translate the wrong doctor.
// // const DOCTOR_NAME_TRANSLATIONS = {
// // //   hi: {
// // //     DOC001: "डॉ. सुहानी सूर्यवंशी",
// // //     DOC002: "डॉ. टेस्ट डॉक्टर",
// // //     DOC003: "आयुष सोनी",
// // //   },
// // //   mr: {
// // //     DOC001: "डॉ. सुहानी सूर्यवंशी",
// // //     DOC002: "डॉ. टेस्ट डॉक्टर",
// // //     DOC003: "आयुष सोनी",
// // //   },
// // };

// // const getDoctorDisplayName = (doctor, language) => {
// //   if (!doctor) return "";

// //   if (language === "en") {
// //     return doctor.fullName || "";
// //   }

// //   return (
// //     DOCTOR_NAME_TRANSLATIONS[language]?.[doctor.professionalId] ||
// //     doctor.fullName ||
// //     ""
// //   );
// // };

// // // =====================================================
// // // MULTI-SELECT MEDICATION DROPDOWN
// // // =====================================================

// // const MedicationDropdown = ({ value, onChange, txt }) => {
// //   const [open, setOpen] = useState(false);

// //   const selectedValues = Array.isArray(value) ? value : [];

// //   const options = [
// //     {
// //       value: "Tranexamic acid",
// //       label: txt.medicationOptions.tranexamicAcid,
// //     },
// //     {
// //       value: "Paracetamol / Acetaminophen",
// //       label: txt.medicationOptions.paracetamol,
// //     },
// //     {
// //       value: "Iron supplement",
// //       label: txt.medicationOptions.iron,
// //     },
// //     {
// //       value: "Pain medication",
// //       label: txt.medicationOptions.painMedication,
// //     },
// //     {
// //       value: "Other",
// //       label: txt.medicationOptions.other,
// //     },
// //     {
// //       value: "None",
// //       label: txt.medicationOptions.none,
// //     },
// //   ];

// //   const toggleOption = (optionValue) => {
// //     let updated = [...selectedValues];

// //     // "None" is mutually exclusive with every medication.
// //     if (optionValue === "None") {
// //       onChange(["None"]);
// //       setOpen(false);
// //       return;
// //     }

// //     // Remove None if a real medication is selected.
// //     updated = updated.filter((item) => item !== "None");

// //     if (updated.includes(optionValue)) {
// //       updated = updated.filter((item) => item !== optionValue);
// //     } else {
// //       updated.push(optionValue);
// //     }

// //     onChange(updated);
// //   };

// //   const selectedLabels = options
// //     .filter((option) => selectedValues.includes(option.value))
// //     .map((option) => option.label);

// //   return (
// //     <div className="medication-dropdown">
// //       <button
// //         type="button"
// //         className="medication-dropdown-button"
// //         onClick={() => setOpen((prev) => !prev)}
// //       >
// //         <span className="medication-dropdown-value">
// //           {selectedLabels.length > 0
// //             ? selectedLabels.join(", ")
// //             : txt.medicationOptions.placeholder}
// //         </span>

// //         <span className="medication-dropdown-arrow">
// //           {open ? "⌃" : "⌄"}
// //         </span>
// //       </button>

// //       {open && (
// //         <>
// //           <button
// //             type="button"
// //             className="medication-dropdown-overlay"
// //             aria-label="Close medication dropdown"
// //             onClick={() => setOpen(false)}
// //           />

// //           <div className="medication-dropdown-menu">
// //             {options.map((option) => (
// //               <label
// //                 key={option.value}
// //                 className="medication-option"
// //               >
// //                 <input
// //                   type="checkbox"
// //                   checked={selectedValues.includes(option.value)}
// //                   onChange={() => toggleOption(option.value)}
// //                 />

// //                 <span>{option.label}</span>
// //               </label>
// //             ))}
// //           </div>
// //         </>
// //       )}
// //     </div>
// //   );
// // };

// // const HemophiliaDetailsScreen = () => {
// //   const navigate = useNavigate();
// //   const { i18n } = useTranslation();

// //   // =====================================================
// //   // LANGUAGE
// //   // =====================================================

// //   const currentLanguage =
// //     (i18n.language || "en").split("-")[0];

// //   const language = ["en", "hi", "mr"].includes(
// //     currentLanguage
// //   )
// //     ? currentLanguage
// //     : "en";

// //   // =====================================================
// //   // TRANSLATIONS
// //   // =====================================================

// //   const TEXT = {
// //     en: {

// //       treatmentOptions: {
// //     title: "Current Hemophilia Treatment",
// //     label: "Current treatment",
// //     placeholder: "Select current treatment",
// //     none: "No current treatment",
// //     factorVIII: "Factor VIII",
// //     factorIX: "Factor IX",
// //     extendedVIII: "Extended half-life Factor VIII",
// //     extendedIX: "Extended half-life Factor IX",
// //     emicizumab: "Emicizumab",
// //     bypassingAgent: "Bypassing agent",
// //     other: "Other",
// //     otherPlaceholder: "Please specify other treatment",
// //   },

// //   medicationOptions: {
// //     title: "Other Medications",
// //     label: "Medications you are currently taking",
// //     placeholder: "Select medications",
// //     none: "None",
// //     tranexamicAcid: "Tranexamic acid",
// //     paracetamol: "Paracetamol / Acetaminophen",
// //     iron: "Iron supplement",
// //     painMedication: "Pain medication",
// //     other: "Other",
// //     otherPlaceholder: "Please specify other medication",
// //   },
// //       eyebrow: "PATIENT CLINICAL PROFILE",

// //       title: "Hemophilia Clinical Details",

// //       subtitle:
// //         "Provide your existing clinical information to help personalize your care guidance.",

// //       accurateTitle:
// //         "Keep your information accurate",

// //       accurateText:
// //         "These details help the application understand your current hemophilia profile, bleeding pattern, physiotherapy, and care needs.",

// //       classification:
// //         "Clinical Classification",

// //       classificationDesc:
// //         "Basic information about your diagnosis",

// //       type:
// //         "Type of Hemophilia",

// //       selectType:
// //         "Select type",

// //       typeA:
// //         "Hemophilia A",

// //       typeB:
// //         "Hemophilia B",

// //       typeC:
// //         "Hemophilia C",

// //       severity:
// //         "Severity",

// //       selectSeverity:
// //         "Select severity",

// //       mild:
// //         "Mild",

// //       moderate:
// //         "Moderate",

// //       severe:
// //         "Severe",

// //       ageDiagnosis:
// //         "Age at Diagnosis",

// //       enterAge:
// //         "Enter age",

// //       treatment:
// //         "Treatment Profile",

// //       treatmentDesc:
// //         "Your current treatment and medications",

// //       factorTherapy:
// //         "Current Hemophilia Treatment",

// //       factorPlaceholder:
// //         "e.g. Factor VIII replacement",

// //       medications:
// //         "Medications You Are Currently Taking",

// //       medicationsPlaceholder:
// //         "Enter medications if any",

// //       bleeding:
// //         "Bleeding Pattern",

// //       bleedingDesc:
// //         "Information about your bleeding history and affected joints",

// //       bleedingPattern:
// //         "Bleeding Pattern",

// //       selectPattern:
// //         "Select bleeding pattern",

// //       spontaneous:
// //         "Spontaneous bleeding",

// //       trauma:
// //         "Bleeding after injury / trauma",

// //       procedure:
// //         "Bleeding after medical or dental procedure",

// //       mixed:
// //         "Mixed / more than one pattern",

// //       other:
// //         "Other",

// //       affectedJoints:
// //         "Affected Joints",

// //       affectedJointsHelp:
// //         "Select all joints that are currently affected or have experienced bleeding.",

// //       selectedJoints:
// //         "Selected joints",

// //       noJointsSelected:
// //         "No joints selected",

// //       targetJoint:
// //         "Target Joint",

// //       selectTargetJoint:
// //         "Select target joint",

// //       none:
// //         "None",

// //       knee:
// //         "Knee",

// //       ankle:
// //         "Ankle",

// //       elbow:
// //         "Elbow",

// //       shoulder:
// //         "Shoulder",

// //       hip:
// //         "Hip",

// //       wrist:
// //         "Wrist",

// //       bleedFrequency:
// //         "Bleed Frequency",

// //       selectFrequency:
// //         "Select frequency",

// //       daily:
// //         "Daily",

// //       weekly:
// //         "Weekly",

// //       monthly:
// //         "Monthly",

// //       quarterly:
// //         "Every few months",

// //       rare:
// //         "Rare",

// //       lastBleed:
// //         "Last Bleed Date",

// //       otherDetails:
// //         "Any Other Detail",

// //       otherDetailsPlaceholder:
// //         "Enter any other information you would like your care team to know",

// //       physiotherapy:
// //         "Physiotherapy & Exercise",

// //       physiotherapyDesc:
// //         "Tell us about your current or previous physiotherapy experience",

// //       currentlyPhysio:
// //         "Are you currently undergoing physiotherapy?",

// //       selectOption:
// //         "Select option",

// //       yes:
// //         "Yes",

// //       no:
// //         "No",

// //       wherePhysio:
// //         "Where are you taking physiotherapy?",

// //       hospital:
// //         "Hospital",

// //       clinic:
// //         "Clinic",

// //       hemophiliaCentre:
// //         "Hemophilia Centre",

// //       home:
// //         "At home",

// //       sessions:
// //         "How many sessions a week?",

// //       onceWeek:
// //         "Once a week",

// //       twoThree:
// //         "2–3 times a week",

// //       moreThree:
// //         "More than 3 sessions a week",

// //       sessionDuration:
// //         "How many minutes does each session last?",

// //       lessTen:
// //         "Less than 10 minutes",

// //       tenTwenty:
// //         "10–20 minutes",

// //       twentyThirty:
// //         "20–30 minutes",

// //       moreThirty:
// //         "More than 30 minutes",

// //       affectedBodyPart:
// //         "Which body part is most affected and currently being treated?",

// //       treatmentReceived:
// //         "What kind of treatment are you receiving?",

// //       stretching:
// //         "Stretching",

// //       strengthening:
// //         "Strengthening",

// //       balance:
// //         "Balance exercises",

// //       generalFitness:
// //         "General fitness",

// //       jointMovement:
// //         "Joint movement exercises",

// //       painRelief:
// //         "Exercises for pain relief",

// //       equipment:
// //         "Are you using any equipment for exercise?",

// //       noEquipment:
// //         "No equipment",

// //       dumbbells:
// //         "Dumbbells",

// //       weightsCuffs:
// //         "Weight cuffs",

// //       theraband:
// //         "Theraband",

// //       yogaMat:
// //         "Yoga mat",

// //       otherEquipment:
// //         "Other equipment",

// //       helping:
// //         "Is physiotherapy helping you?",

// //       problems:
// //         "Do you have any problem while exercising or after the session?",

// //       noProblems:
// //         "No problem",

// //       pain:
// //         "Pain",

// //       newBleeding:
// //         "New bleeding",

// //       stiffness:
// //         "Stiffness",

// //       increasedSwelling:
// //         "Increased swelling",

// //       tired:
// //         "Feeling tired",

// //       previousPhysio:
// //         "Have you used physiotherapy previously?",

// //       stoppedWhen:
// //         "When did you stop physiotherapy?",

// //       stoppedWhy:
// //         "Why did you stop physiotherapy?",

// //       stoppedWhyPlaceholder:
// //         "Select the main reason",

// //       noNeed:
// //         "No longer needed",

// //       improved:
// //         "Symptoms improved",

// //       access:
// //         "Difficulty accessing physiotherapy",

// //       cost:
// //         "Cost / financial reasons",

// //       time:
// //         "Time constraints",

// //       doctor:
// //         "Consulting Doctor",

// //       doctorDesc:
// //         "Select the doctor who is currently managing your hemophilia care.",

// //       requestDoctorChange:
// //         "Request Doctor Change",

// //       requestDoctorChangeTitle:
// //         "Request a Doctor Change",

// //       requestDoctorChangeText:
// //         "Your current doctor must release you before you can select another doctor.",

// //       changeReason:
// //         "Reason for changing doctor",

// //       changeReasonPlaceholder:
// //         "Please tell us why you would like to change your doctor",

// //       cancel:
// //         "Cancel",

// //       sendRequest:
// //         "Send Request",

// //       sendingRequest:
// //         "Sending...",

// //       requestPending:
// //         "Doctor change request is pending. Your current doctor needs to release you.",

// //       selectDoctor:
// //         "Select doctor",

// //       noDoctors:
// //         "No approved doctors available",

// //       doctorLoading:
// //         "Loading doctors...",

// //       doctorId:
// //         "Professional ID",

// //       required:
// //         "*",

// //       mobility:
// //         "Mobility Limitation",

// //       selectMobility:
// //         "Select mobility limitation",

// //       noLimitation:
// //         "None",

// //       assistive:
// //         "Assistive Devices",

// //       assistivePlaceholder:
// //         "Select an assistive device",

// //       assistiveOptions: {
// //         none: "None",
// //         kneeBrace: "Knee Brace",
// //         ankleBrace: "Ankle / Foot Brace",
// //         elbowBrace: "Elbow Brace",
// //         wristSupport: "Wrist Support",
// //         cane: "Cane / Walking Stick",
// //         crutches: "Crutches",
// //         walker: "Walker",
// //         wheelchair: "Wheelchair",
// //         other: "Other",
// //       },

// //       errorRequired:
// //         "Please complete all required fields.",

// //       errorDoctor:
// //         "Unable to load doctors. Please try again.",

// //       errorSave:
// //         "Failed to save details. Please try again.",

// //       save:
// //         "Save & Continue",

// //       saving:
// //         "Saving...",

// //       back:
// //         "Back",

// //       secure:
// //         "Your clinical information is stored securely and used to personalize your care guidance.",

// //       previousPhysioSection:
// //         "Previous Physiotherapy",

// //       currentPhysioSection:
// //         "Current Physiotherapy Details",
// //     },

// //     // ===================================================
// //     // HINDI
// //     // ===================================================

// //     hi: {

// //       treatmentOptions: {
// //         title: "वर्तमान हीमोफीलिया उपचार",
// //         label: "वर्तमान उपचार",
// //         placeholder: "वर्तमान उपचार चुनें",
// //         none: "कोई वर्तमान उपचार नहीं",
// //         factorVIII: "फैक्टर VIII",
// //         factorIX: "फैक्टर IX",
// //         extendedVIII: "एक्सटेंडेड हाफ-लाइफ फैक्टर VIII",
// //         extendedIX: "एक्सटेंडेड हाफ-लाइफ फैक्टर IX",
// //         emicizumab: "एमिसिज़ुमैब",
// //         bypassingAgent: "बायपासिंग एजेंट",
// //         other: "अन्य",
// //         otherPlaceholder: "अन्य उपचार लिखें",
// //       },

// //       medicationOptions: {
// //         title: "अन्य दवाएँ",
// //         label: "वर्तमान में ली जा रही दवाएँ",
// //         placeholder: "दवाएँ चुनें",
// //         none: "कोई नहीं",
// //         tranexamicAcid: "ट्रानेक्सामिक एसिड",
// //         paracetamol: "पैरासिटामोल / एसीटामिनोफेन",
// //         iron: "आयरन सप्लीमेंट",
// //         painMedication: "दर्द की दवा",
// //         other: "अन्य",
// //         otherPlaceholder: "अन्य दवा का नाम लिखें",
// //       },

// //       eyebrow: "रोगी की चिकित्सीय जानकारी",

// //       title: "हीमोफीलिया चिकित्सीय विवरण",

// //       subtitle:
// //         "अपनी मौजूदा चिकित्सीय जानकारी दें ताकि आपकी देखभाल संबंधी मार्गदर्शन को बेहतर बनाया जा सके।",

// //       accurateTitle:
// //         "अपनी जानकारी सही रखें",

// //       accurateText:
// //         "ये विवरण आपके हीमोफीलिया प्रोफाइल, रक्तस्राव, फिजियोथेरेपी और देखभाल की जरूरतों को समझने में मदद करते हैं।",

// //       classification:
// //         "हीमोफीलिया जानकारी",

// //       classificationDesc:
// //         "आपके निदान की मूल जानकारी",

// //       type:
// //         "हीमोफीलिया का प्रकार",

// //       selectType:
// //         "प्रकार चुनें",

// //       typeA:
// //         "हीमोफीलिया A",

// //       typeB:
// //         "हीमोफीलिया B",

// //       typeC:
// //         "हीमोफीलिया C",

// //       severity:
// //         "गंभीरता",

// //       selectSeverity:
// //         "गंभीरता चुनें",

// //       mild:
// //         "हल्का",

// //       moderate:
// //         "मध्यम",

// //       severe:
// //         "गंभीर",

// //       ageDiagnosis:
// //         "निदान के समय उम्र",

// //       enterAge:
// //         "उम्र दर्ज करें",

// //       treatment:
// //         "उपचार जानकारी",

// //       treatmentDesc:
// //         "आपका वर्तमान उपचार और दवाएँ",

// //       factorTherapy:
// //         "वर्तमान हीमोफीलिया उपचार",

// //       factorPlaceholder:
// //         "जैसे Factor VIII replacement",

// //       medications:
// //         "वर्तमान में ली जा रही दवाएँ",

// //       medicationsPlaceholder:
// //         "यदि कोई दवा है तो दर्ज करें",

// //       bleeding:
// //         "रक्तस्राव का पैटर्न",

// //       bleedingDesc:
// //         "आपके रक्तस्राव के इतिहास और प्रभावित जोड़ों की जानकारी",

// //       bleedingPattern:
// //         "रक्तस्राव का पैटर्न",

// //       selectPattern:
// //         "पैटर्न चुनें",

// //       spontaneous:
// //         "बिना स्पष्ट कारण रक्तस्राव",

// //       trauma:
// //         "चोट के बाद रक्तस्राव",

// //       procedure:
// //         "चिकित्सीय या दंत प्रक्रिया के बाद रक्तस्राव",

// //       mixed:
// //         "मिश्रित / एक से अधिक पैटर्न",

// //       other:
// //         "अन्य",

// //       affectedJoints:
// //         "प्रभावित जोड़",

// //       affectedJointsHelp:
// //         "वर्तमान में प्रभावित या पहले रक्तस्राव वाले सभी जोड़ों को चुनें।",

// //       selectedJoints:
// //         "चयनित जोड़",

// //       noJointsSelected:
// //         "कोई जोड़ चयनित नहीं है",

// //       targetJoint:
// //         "टारगेट जोड़",

// //       selectTargetJoint:
// //         "टारगेट जोड़ चुनें",

// //       none:
// //         "कोई नहीं",

// //       knee:
// //         "घुटना",

// //       ankle:
// //         "टखना",

// //       elbow:
// //         "कोहनी",

// //       shoulder:
// //         "कंधा",

// //       hip:
// //         "कूल्हा",

// //       wrist:
// //         "कलाई",

// //       bleedFrequency:
// //         "रक्तस्राव की आवृत्ति",

// //       selectFrequency:
// //         "आवृत्ति चुनें",

// //       daily:
// //         "प्रतिदिन",

// //       weekly:
// //         "साप्ताहिक",

// //       monthly:
// //         "मासिक",

// //       quarterly:
// //         "हर कुछ महीनों में",

// //       rare:
// //         "बहुत कम",

// //       lastBleed:
// //         "अंतिम रक्तस्राव की तारीख",

// //       otherDetails:
// //         "अन्य जानकारी",

// //       otherDetailsPlaceholder:
// //         "कोई अन्य जानकारी दर्ज करें जो आपकी देखभाल टीम को पता होनी चाहिए",

// //       physiotherapy:
// //         "फिजियोथेरेपी और व्यायाम",

// //       physiotherapyDesc:
// //         "अपनी वर्तमान या पिछली फिजियोथेरेपी के बारे में बताएं",

// //       currentlyPhysio:
// //         "क्या आप वर्तमान में फिजियोथेरेपी करवा रहे हैं?",

// //       selectOption:
// //         "विकल्प चुनें",

// //       yes:
// //         "हाँ",

// //       no:
// //         "नहीं",

// //       wherePhysio:
// //         "आप फिजियोथेरेपी कहाँ करवा रहे हैं?",

// //       hospital:
// //         "अस्पताल",

// //       clinic:
// //         "क्लिनिक",

// //       hemophiliaCentre:
// //         "हीमोफीलिया केंद्र",

// //       home:
// //         "घर पर",

// //       sessions:
// //         "सप्ताह में कितने सत्र?",

// //       onceWeek:
// //         "सप्ताह में एक बार",

// //       twoThree:
// //         "सप्ताह में 2–3 बार",

// //       moreThree:
// //         "सप्ताह में 3 से अधिक बार",

// //       sessionDuration:
// //         "प्रत्येक सत्र कितने मिनट का होता है?",

// //       lessTen:
// //         "10 मिनट से कम",

// //       tenTwenty:
// //         "10–20 मिनट",

// //       twentyThirty:
// //         "20–30 मिनट",

// //       moreThirty:
// //         "30 मिनट से अधिक",

// //       affectedBodyPart:
// //         "सबसे अधिक प्रभावित और वर्तमान में उपचारित शरीर का भाग कौन सा है?",

// //       treatmentReceived:
// //         "आप किस प्रकार का उपचार प्राप्त कर रहे हैं?",

// //       stretching:
// //         "स्ट्रेचिंग",

// //       strengthening:
// //         "मांसपेशियों को मजबूत करने के व्यायाम",

// //       balance:
// //         "संतुलन व्यायाम",

// //       generalFitness:
// //         "सामान्य फिटनेस",

// //       jointMovement:
// //         "जोड़ों की गति के व्यायाम",

// //       painRelief:
// //         "दर्द से राहत के व्यायाम",

// //       equipment:
// //         "क्या आप व्यायाम के लिए किसी उपकरण का उपयोग करते हैं?",

// //       noEquipment:
// //         "कोई उपकरण नहीं",

// //       dumbbells:
// //         "डम्बल",

// //       weightsCuffs:
// //         "वेट कफ",

// //       theraband:
// //         "थेराबैंड",

// //       yogaMat:
// //         "योगा मैट",

// //       otherEquipment:
// //         "अन्य उपकरण",

// //       helping:
// //         "क्या फिजियोथेरेपी से आपको लाभ हो रहा है?",

// //       problems:
// //         "व्यायाम करते समय या सत्र के बाद कोई समस्या होती है?",

// //       noProblems:
// //         "कोई समस्या नहीं",

// //       pain:
// //         "दर्द",

// //       newBleeding:
// //         "नया रक्तस्राव",

// //       stiffness:
// //         "जकड़न",

// //       increasedSwelling:
// //         "सूजन बढ़ना",

// //       tired:
// //         "थकान महसूस होना",

// //       previousPhysio:
// //         "क्या आपने पहले फिजियोथेरेपी का उपयोग किया है?",

// //       stoppedWhen:
// //         "आपने फिजियोथेरेपी कब बंद की?",

// //       stoppedWhy:
// //         "आपने फिजियोथेरेपी क्यों बंद की?",

// //       stoppedWhyPlaceholder:
// //         "मुख्य कारण चुनें",

// //       noNeed:
// //         "अब आवश्यकता नहीं थी",

// //       improved:
// //         "लक्षणों में सुधार हुआ",

// //       access:
// //         "फिजियोथेरेपी तक पहुँचने में कठिनाई",

// //       cost:
// //         "खर्च / आर्थिक कारण",

// //       time:
// //         "समय की समस्या",

// //       doctor:
// //         "परामर्श देने वाले डॉक्टर",

// //       doctorDesc:
// //         "उस डॉक्टर को चुनें जो वर्तमान में आपकी हीमोफीलिया देखभाल कर रहे हैं।",

// //       requestDoctorChange:
// //         "डॉक्टर बदलने का अनुरोध करें",

// //       requestDoctorChangeTitle:
// //         "डॉक्टर बदलने का अनुरोध",

// //       requestDoctorChangeText:
// //         "दूसरे डॉक्टर को चुनने से पहले आपके वर्तमान डॉक्टर को आपको रिलीज़ करना होगा।",

// //       changeReason:
// //         "डॉक्टर बदलने का कारण",

// //       changeReasonPlaceholder:
// //         "कृपया बताएं कि आप डॉक्टर क्यों बदलना चाहते हैं",

// //       cancel:
// //         "रद्द करें",

// //       sendRequest:
// //         "अनुरोध भेजें",

// //       sendingRequest:
// //         "भेजा जा रहा है...",

// //       requestPending:
// //         "डॉक्टर बदलने का अनुरोध लंबित है। आपके वर्तमान डॉक्टर को आपको रिलीज़ करना होगा।",

// //       selectDoctor:
// //         "डॉक्टर चुनें",

// //       noDoctors:
// //         "कोई स्वीकृत डॉक्टर उपलब्ध नहीं है",

// //       doctorLoading:
// //         "डॉक्टर लोड हो रहे हैं...",

// //       doctorId:
// //         "प्रोफेशनल आईडी",

// //       required:
// //         "*",

// //       mobility:
// //         "चलने-फिरने में कठिनाई",

// //       selectMobility:
// //         "चलने-फिरने की कठिनाई चुनें",

// //       noLimitation:
// //         "कोई कठिनाई नहीं",

// //       assistive:
// //         "सहायक उपकरण",

// //       assistivePlaceholder:
// //         "सहायक उपकरण चुनें",

// //       assistiveOptions: {
// //         none: "कोई उपकरण नहीं",
// //         kneeBrace: "घुटने का ब्रेस",
// //         ankleBrace: "टखने / पैर का ब्रेस",
// //         elbowBrace: "कोहनी का ब्रेस",
// //         wristSupport: "कलाई का सहारा",
// //         cane: "छड़ी / चलने की छड़ी",
// //         crutches: "बैसाखी",
// //         walker: "वॉकर",
// //         wheelchair: "व्हीलचेयर",
// //         other: "अन्य",
// //       },

// //       errorRequired:
// //         "कृपया सभी आवश्यक जानकारी पूरी करें।",

// //       errorDoctor:
// //         "डॉक्टरों की सूची लोड नहीं हो सकी। कृपया फिर प्रयास करें।",

// //       errorSave:
// //         "जानकारी सेव नहीं हो सकी। कृपया फिर प्रयास करें।",

// //       save:
// //         "सेव करें और आगे बढ़ें",

// //       saving:
// //         "सेव हो रहा है...",

// //       back:
// //         "वापस",

// //       secure:
// //         "आपकी चिकित्सीय जानकारी सुरक्षित रूप से संग्रहीत की जाती है और आपकी देखभाल संबंधी मार्गदर्शन को व्यक्तिगत बनाने के लिए उपयोग की जाती है।",

// //       previousPhysioSection:
// //         "पिछली फिजियोथेरेपी",

// //       currentPhysioSection:
// //         "वर्तमान फिजियोथेरेपी विवरण",
// //     },

// //     // ===================================================
// //     // MARATHI
// //     // ===================================================

// //     mr: {

// //       treatmentOptions: {
// //         title: "सध्याचा हिमोफिलिया उपचार",
// //         label: "सध्याचा उपचार",
// //         placeholder: "सध्याचा उपचार निवडा",
// //         none: "सध्या कोणताही उपचार नाही",
// //         factorVIII: "फॅक्टर VIII",
// //         factorIX: "फॅक्टर IX",
// //         extendedVIII: "एक्स्टेंडेड हाफ-लाइफ फॅक्टर VIII",
// //         extendedIX: "एक्स्टेंडेड हाफ-लाइफ फॅक्टर IX",
// //         emicizumab: "एमिसिझुमॅब",
// //         bypassingAgent: "बायपासिंग एजंट",
// //         other: "इतर",
// //         otherPlaceholder: "इतर उपचार लिहा",
// //       },

// //       medicationOptions: {
// //         title: "इतर औषधे",
// //         label: "सध्या घेत असलेली औषधे",
// //         placeholder: "औषधे निवडा",
// //         none: "एकही नाही",
// //         tranexamicAcid: "ट्रॅनेक्सॅमिक अॅसिड",
// //         paracetamol: "पॅरासिटामॉल / अॅसिटामिनोफेन",
// //         iron: "आयर्न सप्लिमेंट",
// //         painMedication: "वेदनेवरील औषध",
// //         other: "इतर",
// //         otherPlaceholder: "इतर औषधाचे नाव लिहा",
// //       },

// //       eyebrow: "रुग्णाची वैद्यकीय माहिती",

// //       title: "हिमोफिलिया वैद्यकीय तपशील",

// //       subtitle:
// //         "तुमच्या काळजीचे मार्गदर्शन वैयक्तिक करण्यासाठी तुमची सध्याची वैद्यकीय माहिती द्या.",

// //       accurateTitle:
// //         "तुमची माहिती अचूक ठेवा",

// //       accurateText:
// //         "ही माहिती तुमची हिमोफिलिया स्थिती, रक्तस्त्रावाचा नमुना, फिजिओथेरपी आणि काळजीच्या गरजा समजून घेण्यास मदत करते.",

// //       classification:
// //         "हिमोफिलिया माहिती",

// //       classificationDesc:
// //         "तुमच्या निदानाची मूलभूत माहिती",

// //       type:
// //         "हिमोफिलियाचा प्रकार",

// //       selectType:
// //         "प्रकार निवडा",

// //       typeA:
// //         "हिमोफिलिया A",

// //       typeB:
// //         "हिमोफिलिया B",

// //       typeC:
// //         "हिमोफिलिया C",

// //       severity:
// //         "तीव्रता",

// //       selectSeverity:
// //         "तीव्रता निवडा",

// //       mild:
// //         "सौम्य",

// //       moderate:
// //         "मध्यम",

// //       severe:
// //         "गंभीर",

// //       ageDiagnosis:
// //         "निदानाच्या वेळी वय",

// //       enterAge:
// //         "वय प्रविष्ट करा",

// //       treatment:
// //         "उपचाराची माहिती",

// //       treatmentDesc:
// //         "तुमचे सध्याचे उपचार आणि औषधे",

// //       factorTherapy:
// //         "सध्याचा हिमोफिलिया उपचार",

// //       factorPlaceholder:
// //         "उदा. Factor VIII replacement",

// //       medications:
// //         "सध्या घेत असलेली औषधे",

// //       medicationsPlaceholder:
// //         "औषधे असल्यास प्रविष्ट करा",

// //       bleeding:
// //         "रक्तस्त्रावाचा नमुना",

// //       bleedingDesc:
// //         "तुमच्या रक्तस्त्रावाचा इतिहास आणि प्रभावित सांध्यांची माहिती",

// //       bleedingPattern:
// //         "रक्तस्त्रावाचा नमुना",

// //       selectPattern:
// //         "नमुना निवडा",

// //       spontaneous:
// //         "स्वतःहून होणारा रक्तस्त्राव",

// //       trauma:
// //         "इजा / दुखापतीनंतर रक्तस्त्राव",

// //       procedure:
// //         "वैद्यकीय किंवा दंत प्रक्रियेनंतर रक्तस्त्राव",

// //       mixed:
// //         "मिश्र / एकापेक्षा जास्त नमुने",

// //       other:
// //         "इतर",

// //       affectedJoints:
// //         "प्रभावित सांधे",

// //       affectedJointsHelp:
// //         "सध्या प्रभावित असलेले किंवा पूर्वी रक्तस्त्राव झालेले सर्व सांधे निवडा.",

// //       selectedJoints:
// //         "निवडलेले सांधे",

// //       noJointsSelected:
// //         "कोणताही सांधा निवडलेला नाही",

// //       targetJoint:
// //         "टार्गेट सांधा",

// //       selectTargetJoint:
// //         "टार्गेट सांधा निवडा",

// //       none:
// //         "कोणताही नाही",

// //       knee:
// //         "गुडघा",

// //       ankle:
// //         "घोटा",

// //       elbow:
// //         "कोपर",

// //       shoulder:
// //         "खांदा",

// //       hip:
// //         "नितंब",

// //       wrist:
// //         "मनगट",

// //       bleedFrequency:
// //         "रक्तस्त्रावाची वारंवारता",

// //       selectFrequency:
// //         "वारंवारता निवडा",

// //       daily:
// //         "दररोज",

// //       weekly:
// //         "आठवड्यातून",

// //       monthly:
// //         "मासिक",

// //       quarterly:
// //         "दर काही महिन्यांनी",

// //       rare:
// //         "क्वचित",

// //       lastBleed:
// //         "शेवटच्या रक्तस्त्रावाची तारीख",

// //       otherDetails:
// //         "इतर माहिती",

// //       otherDetailsPlaceholder:
// //         "तुमच्या काळजीच्या टीमला माहीत असावी अशी इतर माहिती प्रविष्ट करा",

// //       physiotherapy:
// //         "फिजिओथेरपी आणि व्यायाम",

// //       physiotherapyDesc:
// //         "तुमच्या सध्याच्या किंवा पूर्वीच्या फिजिओथेरपीबद्दल माहिती द्या",

// //       currentlyPhysio:
// //         "तुम्ही सध्या फिजिओथेरपी घेत आहात का?",

// //       selectOption:
// //         "पर्याय निवडा",

// //       yes:
// //         "होय",

// //       no:
// //         "नाही",

// //       wherePhysio:
// //         "तुम्ही फिजिओथेरपी कुठे घेत आहात?",

// //       hospital:
// //         "रुग्णालय",

// //       clinic:
// //         "क्लिनिक",

// //       hemophiliaCentre:
// //         "हिमोफिलिया केंद्र",

// //       home:
// //         "घरी",

// //       sessions:
// //         "आठवड्यात किती सत्रे?",

// //       onceWeek:
// //         "आठवड्यातून एकदा",

// //       twoThree:
// //         "आठवड्यातून 2–3 वेळा",

// //       moreThree:
// //         "आठवड्यातून 3 पेक्षा जास्त वेळा",

// //       sessionDuration:
// //         "प्रत्येक सत्र किती मिनिटांचे असते?",

// //       lessTen:
// //         "10 मिनिटांपेक्षा कमी",

// //       tenTwenty:
// //         "10–20 मिनिटे",

// //       twentyThirty:
// //         "20–30 मिनिटे",

// //       moreThirty:
// //         "30 मिनिटांपेक्षा जास्त",

// //       affectedBodyPart:
// //         "सध्या उपचार घेत असलेला सर्वाधिक प्रभावित शरीराचा भाग कोणता?",

// //       treatmentReceived:
// //         "तुम्ही कोणत्या प्रकारचे उपचार घेत आहात?",

// //       stretching:
// //         "स्ट्रेचिंग",

// //       strengthening:
// //         "स्नायू मजबूत करण्याचे व्यायाम",

// //       balance:
// //         "संतुलन व्यायाम",

// //       generalFitness:
// //         "सामान्य फिटनेस",

// //       jointMovement:
// //         "सांध्यांच्या हालचालीचे व्यायाम",

// //       painRelief:
// //         "वेदना कमी करण्यासाठी व्यायाम",

// //       equipment:
// //         "तुम्ही व्यायामासाठी कोणतेही उपकरण वापरता का?",

// //       noEquipment:
// //         "कोणतेही उपकरण नाही",

// //       dumbbells:
// //         "डम्बेल्स",

// //       weightsCuffs:
// //         "वेट कफ",

// //       theraband:
// //         "थेराबँड",

// //       yogaMat:
// //         "योगा मॅट",

// //       otherEquipment:
// //         "इतर उपकरण",

// //       helping:
// //         "फिजिओथेरपीमुळे तुम्हाला फायदा होत आहे का?",

// //       problems:
// //         "व्यायाम करताना किंवा सत्रानंतर काही समस्या होतात का?",

// //       noProblems:
// //         "कोणतीही समस्या नाही",

// //       pain:
// //         "वेदना",

// //       newBleeding:
// //         "नवीन रक्तस्त्राव",

// //       stiffness:
// //         "ताठरपणा",

// //       increasedSwelling:
// //         "सूज वाढणे",

// //       tired:
// //         "थकवा जाणवणे",

// //       previousPhysio:
// //         "तुम्ही यापूर्वी फिजिओथेरपी घेतली आहे का?",

// //       stoppedWhen:
// //         "तुम्ही फिजिओथेरपी कधी थांबवली?",

// //       stoppedWhy:
// //         "तुम्ही फिजिओथेरपी का थांबवली?",

// //       stoppedWhyPlaceholder:
// //         "मुख्य कारण निवडा",

// //       noNeed:
// //         "आता गरज नव्हती",

// //       improved:
// //         "लक्षणांमध्ये सुधारणा झाली",

// //       access:
// //         "फिजिओथेरपी मिळवण्यात अडचण",

// //       cost:
// //         "खर्च / आर्थिक कारणे",

// //       time:
// //         "वेळेची समस्या",

// //       doctor:
// //         "सल्ला देणारे डॉक्टर",

// //       doctorDesc:
// //         "सध्या तुमच्या हिमोफिलिया उपचाराचे व्यवस्थापन करणारे डॉक्टर निवडा.",

// //       requestDoctorChange:
// //         "डॉक्टर बदलण्याची विनंती करा",

// //       requestDoctorChangeTitle:
// //         "डॉक्टर बदलण्याची विनंती",

// //       requestDoctorChangeText:
// //         "दुसरा डॉक्टर निवडण्यापूर्वी तुमच्या सध्याच्या डॉक्टरांनी तुम्हाला रिलीज करणे आवश्यक आहे.",

// //       changeReason:
// //         "डॉक्टर बदलण्याचे कारण",

// //       changeReasonPlaceholder:
// //         "तुम्हाला डॉक्टर का बदलायचे आहेत ते कृपया सांगा",

// //       cancel:
// //         "रद्द करा",

// //       sendRequest:
// //         "विनंती पाठवा",

// //       sendingRequest:
// //         "पाठवत आहे...",

// //       requestPending:
// //         "डॉक्टर बदलण्याची विनंती प्रलंबित आहे. तुमच्या सध्याच्या डॉक्टरांनी तुम्हाला रिलीज करणे आवश्यक आहे.",

// //       selectDoctor:
// //         "डॉक्टर निवडा",

// //       noDoctors:
// //         "कोणतेही मंजूर डॉक्टर उपलब्ध नाहीत",

// //       doctorLoading:
// //         "डॉक्टर लोड होत आहेत...",

// //       doctorId:
// //         "प्रोफेशनल आयडी",

// //       required:
// //         "*",

// //       mobility:
// //         "हालचालींमध्ये मर्यादा",

// //       selectMobility:
// //         "हालचालींची मर्यादा निवडा",

// //       noLimitation:
// //         "कोणतीही मर्यादा नाही",

// //       assistive:
// //         "सहाय्यक उपकरणे",

// //       assistivePlaceholder:
// //         "सहाय्यक उपकरण निवडा",

// //       assistiveOptions: {
// //         none: "कोणतेही उपकरण नाही",
// //         kneeBrace: "गुडघ्याचा ब्रेस",
// //         ankleBrace: "घोटा / पायाचा ब्रेस",
// //         elbowBrace: "कोपराचा ब्रेस",
// //         wristSupport: "मनगटाचा आधार",
// //         cane: "काठी / चालण्याची काठी",
// //         crutches: "कुबड्या",
// //         walker: "वॉकर",
// //         wheelchair: "व्हीलचेअर",
// //         other: "इतर",
// //       },

// //       errorRequired:
// //         "कृपया सर्व आवश्यक माहिती पूर्ण करा.",

// //       errorDoctor:
// //         "डॉक्टरांची यादी लोड करता आली नाही. कृपया पुन्हा प्रयत्न करा.",

// //       errorSave:
// //         "माहिती सेव्ह करता आली नाही. कृपया पुन्हा प्रयत्न करा.",

// //       save:
// //         "सेव्ह करा आणि पुढे जा",

// //       saving:
// //         "सेव्ह होत आहे...",

// //       back:
// //         "मागे",

// //       secure:
// //         "तुमची वैद्यकीय माहिती सुरक्षितपणे साठवली जाते आणि तुमचे काळजी मार्गदर्शन वैयक्तिक करण्यासाठी वापरली जाते.",

// //       previousPhysioSection:
// //         "पूर्वीची फिजिओथेरपी",

// //       currentPhysioSection:
// //         "सध्याचे फिजिओथेरपी तपशील",
// //     }
  
// //   };

// //   const txt =
// //     TEXT[language] || TEXT.en;

// //   // =====================================================
// //   // FORM
// //   // =====================================================

// //   const [form, setForm] = useState({
// //   type: "",
// //   severity: "",
// //   ageAtDiagnosis: "",

// //   familyHistory: "",
// //   geneticTestingDone: "",

// //   currentFactorTherapy: "",
// //   otherCurrentTreatment: "",

// //   otherMedications: [],
// //   otherMedicationDetails: "",

// //   bleedingPattern: "",
// //   jointsAffected: [],
// //   targetJoint: "",
// //   bleedFrequency: "",
// //   lastBleedDate: "",
// //   otherBleedingDetails: "",

// //   underPhysiotherapy: "",
// //   physiotherapyLocation: "",
// //   physiotherapySessions: "",
// //   physiotherapyDuration: "",
// //   physiotherapyBodyPart: "",
// //   physiotherapyTreatment: "",
// //   physiotherapyEquipment: "",
// //   physiotherapyHelping: "",
// //   physiotherapyProblems: [],

// //   previousPhysiotherapy: "",
// //   physiotherapyStoppedDate: "",
// //   physiotherapyStoppedReason: "",

// //   mobilityLimitation: "",
// //   assistiveDevices: "",

// //   consultingDoctorId: "",
// // });

// //   // =====================================================
// //   // DOCTORS
// //   // =====================================================

// //   const [doctors, setDoctors] =
// //     useState([]);

// //   const [doctorsLoading, setDoctorsLoading] =
// //     useState(true);

// //   // =====================================================
// //   // UI STATE
// //   // =====================================================

// //   const [loading, setLoading] =
// //     useState(false);

// //   const [error, setError] =
// //     useState("");

// //     // =====================================================
// // // DOCTOR ASSIGNMENT / CHANGE REQUEST STATE
// // // =====================================================

// // const [doctorStatusLoading, setDoctorStatusLoading] =
// //   useState(true);

// // // IMPORTANT:
// // // This becomes true only when a doctor assignment already exists
// // // in the saved patient record, or after Save & Continue succeeds.
// // // Merely selecting a doctor in the dropdown must NOT lock it.
// // const [doctorAssignmentSaved, setDoctorAssignmentSaved] =
// //   useState(false);

// // const [pendingDoctorChangeRequest, setPendingDoctorChangeRequest] =
// //   useState(null);

// // const [changeRequestModalOpen, setChangeRequestModalOpen] =
// //   useState(false);

// // const [changeRequestReason, setChangeRequestReason] =
// //   useState("");

// // const [changeRequestLoading, setChangeRequestLoading] =
// //   useState(false);

// //   // =====================================================
// //   // LOAD APPROVED DOCTORS
// //   // =====================================================

// //   useEffect(() => {
// //     const loadDoctors = async () => {
// //       try {
// //         setDoctorsLoading(true);

        
// //           const response =
// //             await api.get(
// //               `/hemophilia-details/doctors?language=${language}`
// //             );

// //         const list =
// //           response.data?.doctors || [];

// //         setDoctors(
// //           Array.isArray(list)
// //             ? list
// //             : []
// //         );
// //       } catch (err) {
// //         console.error(
// //           "Failed to load doctors:",
// //           err
// //         );

// //         setError(
// //           txt.errorDoctor
// //         );
// //       } finally {
// //         setDoctorsLoading(false);
// //       }
// //     };

// //     loadDoctors();
// //   }, [language]);

// //   // =====================================================
// // // LOAD CURRENT DOCTOR ASSIGNMENT
// // // =====================================================

// // useEffect(() => {
// //   const loadDoctorStatus = async () => {
// //     try {
// //       setDoctorStatusLoading(true);

// //       const response =
// //         await api.get(
// //           "/hemophilia-details/doctor-change-status"
// //         );

// //       const assignedDoctor =
// //         response.data?.assignedDoctor || null;

// //       const pendingRequest =
// //         response.data?.pendingRequest || null;

// //       // -----------------------------------------------
// //       // RESTORE CURRENT DOCTOR
// //       // -----------------------------------------------

// //       setForm((prev) => ({
// //         ...prev,

// //         consultingDoctorId:
// //           assignedDoctor?._id || "",
// //       }));

// //       // Only a doctor that already exists in the saved record
// //       // should make the field read-only.
// //       setDoctorAssignmentSaved(
// //         Boolean(assignedDoctor?._id)
// //       );

// //       // -----------------------------------------------
// //       // RESTORE PENDING REQUEST
// //       // -----------------------------------------------

// //       setPendingDoctorChangeRequest(
// //         pendingRequest
// //       );
// //     } catch (err) {
// //       console.error(
// //         "Failed to load doctor assignment status:",
// //         err
// //       );

// //       setError(
// //         err.response?.data?.message ||
// //           "Unable to load your doctor assignment."
// //       );
// //     } finally {
// //       setDoctorStatusLoading(false);
// //     }
// //   };

// //   loadDoctorStatus();
// // }, []);

// // // =====================================================
// // // DOCTOR ASSIGNMENT HELPERS
// // // =====================================================

// // // Selecting a doctor in the dropdown changes form.consultingDoctorId
// // // immediately, but that does NOT mean the assignment is saved.
// // const doctorAssigned =
// //   doctorAssignmentSaved;

// // const doctorChangePending =
// //   Boolean(pendingDoctorChangeRequest);

// // // Before the first Save & Continue:
// // //   doctorStatusLoading -> false
// // //   doctorsLoading -> false
// // //   doctorAssignmentSaved -> false
// // // therefore the dropdown stays editable.
// // //
// // // After the first successful Save & Continue, or when an already-saved
// // // assignment is loaded from the backend, the field becomes locked.
// // const doctorFieldLocked =
// //   doctorStatusLoading ||
// //   doctorsLoading ||
// //   (
// //     doctorAssignmentSaved &&
// //     pendingDoctorChangeRequest?.status !== "RELEASED"
// //   );


// //   // =====================================================
// // // REQUEST DOCTOR CHANGE
// // // =====================================================

// // const handleDoctorChangeRequest =
// //   async () => {
// //     setError("");

// //     try {
// //       setChangeRequestLoading(true);

// //       const response =
// //         await api.post(
// //           "/hemophilia-details/doctor-change-request",
// //           {
// //             reason:
// //               changeRequestReason.trim(),
// //           }
// //         );

// //       setPendingDoctorChangeRequest(
// //         response.data?.request || {
// //           status: "PENDING",
// //         }
// //       );

// //       setChangeRequestReason("");

// //       setChangeRequestModalOpen(false);
// //     } catch (err) {
// //       console.error(
// //         "Doctor change request failed:",
// //         err
// //       );

// //       setError(
// //         err.response?.data?.message ||
// //           "Failed to submit doctor change request."
// //       );
// //     } finally {
// //       setChangeRequestLoading(false);
// //     }
// //   };
// //   // =====================================================
// //   // UPDATE FIELD
// //   // =====================================================

// //   const updateField = (
// //     field,
// //     value
// //   ) => {
// //     setForm((prev) => ({
// //       ...prev,
// //       [field]: value,
// //     }));
// //   };

// //   // =====================================================
// //   // TOGGLE JOINT
// //   // =====================================================

// //   const toggleJoint = (
// //     joint
// //   ) => {
// //     setForm((prev) => {
// //       const exists =
// //         prev.jointsAffected.includes(
// //           joint
// //         );

// //       return {
// //         ...prev,

// //         jointsAffected: exists
// //           ? prev.jointsAffected.filter(
// //               (j) => j !== joint
// //             )
// //           : [
// //               ...prev.jointsAffected,
// //               joint,
// //             ],
// //       };
// //     });
// //   };

// //   // =====================================================
// //   // TOGGLE PHYSIO PROBLEM
// //   // =====================================================

// //   const togglePhysioProblem =
// //     (problem) => {
// //       setForm((prev) => {
// //         const exists =
// //           prev.physiotherapyProblems.includes(
// //             problem
// //           );

// //         return {
// //           ...prev,

// //           physiotherapyProblems:
// //             exists
// //               ? prev.physiotherapyProblems.filter(
// //                   (p) => p !== problem
// //                 )
// //               : [
// //                   ...prev.physiotherapyProblems,
// //                   problem,
// //                 ],
// //         };
// //       });
// //     };

// //   // =====================================================
// //   // REQUIRED VALIDATION
// //   // =====================================================

// //   const handleSubmit = async () => {
// //     setError("");

// //     if (
// //       !form.type ||
// //       !form.severity ||
// //       !form.bleedingPattern ||
// //       !form.bleedFrequency ||
// //       !form.consultingDoctorId ||
// //       form.underPhysiotherapy === ""
// //     ) {
// //       setError(
// //         txt.errorRequired
// //       );

// //       window.scrollTo({
// //         top: 0,
// //         behavior: "smooth",
// //       });

// //       return;
// //     }

// //     // -----------------------------------------------
// //     // IF CURRENTLY IN PHYSIOTHERAPY
// //     // -----------------------------------------------

// //     if (
// //       form.underPhysiotherapy === true
// //     ) {
// //       if (
// //         !form.physiotherapyLocation ||
// //         !form.physiotherapySessions ||
// //         !form.physiotherapyDuration ||
// //         !form.physiotherapyBodyPart ||
// //         !form.physiotherapyTreatment ||
// //         !form.physiotherapyEquipment ||
// //         !form.physiotherapyHelping
// //       ) {
// //         setError(
// //           txt.errorRequired
// //         );

// //         window.scrollTo({
// //           top: 0,
// //           behavior: "smooth",
// //         });

// //         return;
// //       }
// //     }

// //     // -----------------------------------------------
// //     // IF NOT CURRENTLY IN PHYSIO
// //     // -----------------------------------------------

// //     if (
// //       form.underPhysiotherapy === false &&
// //       form.previousPhysiotherapy === ""
// //     ) {
// //       setError(
// //         txt.errorRequired
// //       );

// //       window.scrollTo({
// //         top: 0,
// //         behavior: "smooth",
// //       });

// //       return;
// //     }

// //     if (
// //       form.underPhysiotherapy === false &&
// //       form.previousPhysiotherapy === true &&
// //       (
// //         !form.physiotherapyStoppedDate ||
// //         !form.physiotherapyStoppedReason
// //       )
// //     ) {
// //       setError(
// //         txt.errorRequired
// //       );

// //       window.scrollTo({
// //         top: 0,
// //         behavior: "smooth",
// //       });

// //       return;
// //     }

// //     setLoading(true);

// //     try {
// //       await api.post(
// //         "/hemophilia-details",
// //         form
// //       );

// //       // Generate persistent ML exercise recommendations after the
// //       // clinical details have been successfully saved.
// //       // A recommendation is only created once and starts as
// //       // PENDING_DOCTOR_REVIEW.
// //       try {
// //         await api.post("/exercise-recommendations/generate");
// //       } catch (recommendationError) {
// //         console.error(
// //           "Exercise recommendation generation failed:",
// //           recommendationError
// //         );
// //         // Clinical details were already saved, so do not block
// //         // the patient from continuing through the care flow.
// //       }

// //       // The assignment is now actually persisted in the database.
// //       // Only NOW should the consulting-doctor field become locked.
// //       setDoctorAssignmentSaved(
// //         Boolean(form.consultingDoctorId)
// //       );

// //       // =============================================
// //       // NEXT STEP
// //       // =============================================

// //       navigate(
// //         "/care-guidance"
// //       );

// //     } catch (err) {
// //       console.error(
// //         "Failed to save hemophilia details:",
// //         err
// //       );

// //       setError(
// //         err.response?.data?.message ||
// //           txt.errorSave
// //       );
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // =====================================================
// //   // SECTION STATUS
// //   // =====================================================

// //   const classificationDone =
// //     form.type &&
// //     form.severity;

// //   const bleedingDone =
// //     form.bleedingPattern &&
// //     form.bleedFrequency;

// //   const physioDone =
// //     form.underPhysiotherapy !== "";

// //   // =====================================================
// //   // JOINTS
// //   // =====================================================

// //   const joints = [
// //     {
// //       value: "Knee",
// //       label: txt.knee,
// //     },
// //     {
// //       value: "Ankle",
// //       label: txt.ankle,
// //     },
// //     {
// //       value: "Elbow",
// //       label: txt.elbow,
// //     },
// //     {
// //       value: "Shoulder",
// //       label: txt.shoulder,
// //     },
// //     {
// //       value: "Hip",
// //       label: txt.hip,
// //     },
// //     {
// //       value: "Wrist",
// //       label: txt.wrist,
// //     },
// //   ];

// //   return (
// //     <div className="clinical-page">

// //       <div className="clinical-container">

// //         {/* =================================================
// //             HEADER
// //         ================================================= */}

// //         <div className="clinical-header">

// //           <div className="header-icon">
// //             +
// //           </div>

// //           <div className="header-text">

// //             <span className="header-eyebrow">
// //               {txt.eyebrow}
// //             </span>

// //             <h1>
// //               {txt.title}
// //             </h1>

// //             <p>
// //               {txt.subtitle}
// //             </p>

// //           </div>

// //         </div>


// //         {/* =================================================
// //             INFO
// //         ================================================= */}

// //         <div className="info-banner">

// //           <div className="info-banner-icon">
// //             i
// //           </div>

// //           <div>

// //             <strong>
// //               {txt.accurateTitle}
// //             </strong>

// //             <p>
// //               {txt.accurateText}
// //             </p>

// //           </div>

// //         </div>


// //         {/* =================================================
// //             SECTION 01
// //         ================================================= */}

// //         <div
// //           className={`clinical-section ${
// //             classificationDone
// //               ? "section-complete"
// //               : ""
// //           }`}
// //         >

// //           <div className="section-header">

// //             <div className="section-number">
// //               01
// //             </div>

// //             <div>

// //               <h2>
// //                 {txt.classification}
// //               </h2>

// //               <p>
// //                 {txt.classificationDesc}
// //               </p>

// //             </div>

// //             {classificationDone && (
// //               <div className="completion-mark">
// //                 ✓
// //               </div>
// //             )}

// //           </div>


// //           <div className="form-grid">

// //             {/* TYPE */}

// //             <div className="field">

// //               <label>
// //                 {txt.type}
// //                 <span className="required">
// //                   {txt.required}
// //                 </span>
// //               </label>

// //               <select
// //                 value={form.type}
// //                 onChange={(e) =>
// //                   updateField(
// //                     "type",
// //                     e.target.value
// //                   )
// //                 }
// //               >

// //                 <option value="">
// //                   {txt.selectType}
// //                 </option>

// //                 <option value="A">
// //                   {txt.typeA}
// //                 </option>

// //                 <option value="B">
// //                   {txt.typeB}
// //                 </option>

// //                 <option value="C">
// //                   {txt.typeC}
// //                 </option>

// //               </select>

// //             </div>


// //             {/* SEVERITY */}

// //             <div className="field">

// //               <label>
// //                 {txt.severity}
// //                 <span className="required">
// //                   {txt.required}
// //                 </span>
// //               </label>

// //               <select
// //                 value={form.severity}
// //                 onChange={(e) =>
// //                   updateField(
// //                     "severity",
// //                     e.target.value
// //                   )
// //                 }
// //               >

// //                 <option value="">
// //                   {txt.selectSeverity}
// //                 </option>

// //                 <option value="Mild">
// //                   {txt.mild}
// //                 </option>

// //                 <option value="Moderate">
// //                   {txt.moderate}
// //                 </option>

// //                 <option value="Severe">
// //                   {txt.severe}
// //                 </option>

// //               </select>

// //             </div>


// //             {/* AGE */}

// //             <div className="field">

// //               <label>
// //                 {txt.ageDiagnosis}
// //               </label>

// //               <input
// //                 type="number"
// //                 min="0"
// //                 max="120"
// //                 placeholder={
// //                   txt.enterAge
// //                 }
// //                 value={
// //                   form.ageAtDiagnosis
// //                 }
// //                 onChange={(e) =>
// //                   updateField(
// //                     "ageAtDiagnosis",
// //                     e.target.value
// //                   )
// //                 }
// //               />

// //             </div>

// //           </div>

// //         </div>


// //         {/* =================================================
// //             SECTION 02 - TREATMENT
// //         ================================================= */}

// //         <div className="clinical-section">

// //           <div className="section-header">

// //             <div className="section-number">
// //               02
// //             </div>

// //             <div>

// //               <h2>
// //                 {txt.treatment}
// //               </h2>

// //               <p>
// //                 {txt.treatmentDesc}
// //               </p>

// //             </div>

// //           </div>


// //           <div className="form-grid two-columns">

// //             {/* CURRENT HEMOPHILIA TREATMENT */}

// //             <div className="field">

// //               <label>
// //                 {txt.factorTherapy}
// //               </label>

// //               <select
// //                 value={form.currentFactorTherapy}
// //                 onChange={(e) => {
// //                   updateField(
// //                     "currentFactorTherapy",
// //                     e.target.value
// //                   );

// //                   if (e.target.value !== "Other") {
// //                     updateField(
// //                       "otherCurrentTreatment",
// //                       ""
// //                     );
// //                   }
// //                 }}
// //               >

// //                 <option value="">
// //                   {txt.treatmentOptions.placeholder}
// //                 </option>

// //                 <option value="None">
// //                   {txt.treatmentOptions.none}
// //                 </option>

// //                 <option value="Factor VIII">
// //                   {txt.treatmentOptions.factorVIII}
// //                 </option>

// //                 <option value="Factor IX">
// //                   {txt.treatmentOptions.factorIX}
// //                 </option>

// //                 <option value="Extended half-life Factor VIII">
// //                   {txt.treatmentOptions.extendedVIII}
// //                 </option>

// //                 <option value="Extended half-life Factor IX">
// //                   {txt.treatmentOptions.extendedIX}
// //                 </option>

// //                 <option value="Emicizumab">
// //                   {txt.treatmentOptions.emicizumab}
// //                 </option>

// //                 <option value="Bypassing agent">
// //                   {txt.treatmentOptions.bypassingAgent}
// //                 </option>

// //                 <option value="Other">
// //                   {txt.treatmentOptions.other}
// //                 </option>

// //               </select>

// //             </div>


// //             {/* OTHER TREATMENT */}

// //             {form.currentFactorTherapy === "Other" && (
// //               <div className="field">

// //                 <label>
// //                   {txt.treatmentOptions.other}
// //                 </label>

// //                 <input
// //                   type="text"
// //                   placeholder={
// //                     txt.treatmentOptions.otherPlaceholder
// //                   }
// //                   value={
// //                     form.otherCurrentTreatment
// //                   }
// //                   onChange={(e) =>
// //                     updateField(
// //                       "otherCurrentTreatment",
// //                       e.target.value
// //                     )
// //                   }
// //                 />

// //               </div>
// //             )}


// //             {/* OTHER MEDICATIONS */}

// //             <div className="field">

// //               <label>
// //                 {txt.medications}
// //               </label>

// //               <MedicationDropdown
// //                 value={form.otherMedications}
// //                 onChange={(values) =>
// //                   updateField(
// //                     "otherMedications",
// //                     values
// //                   )
// //                 }
// //                 txt={txt}
// //               />

// //             </div>


// //             {/* OTHER MEDICATION DETAILS */}

// //             {form.otherMedications.includes("Other") && (
// //               <div className="field">

// //                 <label>
// //                   {txt.medicationOptions.other}
// //                 </label>

// //                 <input
// //                   type="text"
// //                   placeholder={
// //                     txt.medicationOptions.otherPlaceholder
// //                   }
// //                   value={
// //                     form.otherMedicationDetails
// //                   }
// //                   onChange={(e) =>
// //                     updateField(
// //                       "otherMedicationDetails",
// //                       e.target.value
// //                     )
// //                   }
// //                 />

// //               </div>
// //             )}

// //           </div>

// //         </div>


// //         {/* =================================================
// //             SECTION 03 - BLEEDING
// //         ================================================= */}

// //         <div
// //           className={`clinical-section ${
// //             bleedingDone
// //               ? "section-complete"
// //               : ""
// //           }`}
// //         >

// //           <div className="section-header">

// //             <div className="section-number">
// //               03
// //             </div>

// //             <div>

// //               <h2>
// //                 {txt.bleeding}
// //               </h2>

// //               <p>
// //                 {txt.bleedingDesc}
// //               </p>

// //             </div>

// //             {bleedingDone && (
// //               <div className="completion-mark">
// //                 ✓
// //               </div>
// //             )}

// //           </div>


// //           {/* BLEEDING PATTERN */}

// //           <div className="form-grid two-columns">

// //             <div className="field">

// //               <label>
// //                 {txt.bleedingPattern}
// //                 <span className="required">
// //                   {txt.required}
// //                 </span>
// //               </label>

// //               <select
// //                 value={
// //                   form.bleedingPattern
// //                 }
// //                 onChange={(e) =>
// //                   updateField(
// //                     "bleedingPattern",
// //                     e.target.value
// //                   )
// //                 }
// //               >

// //                 <option value="">
// //                   {txt.selectPattern}
// //                 </option>

// //                 <option value="Spontaneous">
// //                   {txt.spontaneous}
// //                 </option>

// //                 <option value="Trauma-related">
// //                   {txt.trauma}
// //                 </option>

// //                 <option value="Post-procedure">
// //                   {txt.procedure}
// //                 </option>

// //                 <option value="Mixed">
// //                   {txt.mixed}
// //                 </option>

// //                 <option value="Other">
// //                   {txt.other}
// //                 </option>

// //               </select>

// //             </div>


// //             {/* FREQUENCY */}

// //             <div className="field">

// //               <label>
// //                 {txt.bleedFrequency}
// //                 <span className="required">
// //                   {txt.required}
// //                 </span>
// //               </label>

// //               <select
// //                 value={
// //                   form.bleedFrequency
// //                 }
// //                 onChange={(e) =>
// //                   updateField(
// //                     "bleedFrequency",
// //                     e.target.value
// //                   )
// //                 }
// //               >

// //                 <option value="">
// //                   {txt.selectFrequency}
// //                 </option>

// //                 <option value="Daily">
// //                   {txt.daily}
// //                 </option>

// //                 <option value="Weekly">
// //                   {txt.weekly}
// //                 </option>

// //                 <option value="Monthly">
// //                   {txt.monthly}
// //                 </option>

// //                 <option value="Every few months">
// //                   {txt.quarterly}
// //                 </option>

// //                 <option value="Rare">
// //                   {txt.rare}
// //                 </option>

// //               </select>

// //             </div>

// //           </div>


// //           {/* AFFECTED JOINTS - MULTI SELECT */}

// //           <div className="field joint-field">

// //             <label>
// //               {txt.affectedJoints}
// //             </label>

// //             <p className="field-help">
// //               {txt.affectedJointsHelp}
// //             </p>

// //             <div className="joint-grid">
// //               {joints.map((joint) => {
// //                 const selected =
// //                   Array.isArray(form.jointsAffected) &&
// //                   form.jointsAffected.includes(joint.value);

// //                 return (
// //                   <button
// //                     key={joint.value}
// //                     type="button"
// //                     className={`joint-chip ${
// //                       selected ? "active" : ""
// //                     }`}
// //                     onClick={() => toggleJoint(joint.value)}
// //                     aria-pressed={selected}
// //                   >
// //                     <span className="joint-check">
// //                       {selected ? "✓" : ""}
// //                     </span>
// //                     {joint.label}
// //                   </button>
// //                 );
// //               })}
// //             </div>

// //             <p className="field-help selected-joints-help">
// //               {Array.isArray(form.jointsAffected) &&
// //               form.jointsAffected.length > 0
// //                 ? `${txt.selectedJoints}: ${form.jointsAffected
// //                     .map(
// //                       (value) =>
// //                         joints.find((joint) => joint.value === value)?.label ||
// //                         value
// //                     )
// //                     .join(", ")}`
// //                 : txt.noJointsSelected}
// //             </p>

// //           </div>


// //           {/* TARGET JOINT + LAST BLEED */}

// //           <div className="form-grid two-columns">

// //             <div className="field">

// //               <label>
// //                 {txt.targetJoint}
// //               </label>

// //               <select
// //                 value={
// //                   form.targetJoint
// //                 }
// //                 onChange={(e) =>
// //                   updateField(
// //                     "targetJoint",
// //                     e.target.value
// //                   )
// //                 }
// //               >

// //                 <option value="">
// //                   {txt.selectTargetJoint}
// //                 </option>

// //                 <option value="">
// //                   {txt.none}
// //                 </option>

// //                 {joints.map(
// //                   (joint) => (
// //                     <option
// //                       key={joint.value}
// //                       value={
// //                         joint.value
// //                       }
// //                     >
// //                       {joint.label}
// //                     </option>
// //                   )
// //                 )}

// //               </select>

// //             </div>


// //             <div className="field">

// //               <label>
// //                 {txt.lastBleed}
// //               </label>

// //               <input
// //                 type="date"
// //                 value={
// //                   form.lastBleedDate
// //                 }
// //                 onChange={(e) =>
// //                   updateField(
// //                     "lastBleedDate",
// //                     e.target.value
// //                   )
// //                 }
// //               />

// //             </div>

// //           </div>


// //           {/* OTHER DETAILS */}

// //           <div className="field full-width">

// //             <label>
// //               {txt.otherDetails}
// //             </label>

// //             <textarea
// //               rows="4"
// //               placeholder={
// //                 txt.otherDetailsPlaceholder
// //               }
// //               value={
// //                 form.otherBleedingDetails
// //               }
// //               onChange={(e) =>
// //                 updateField(
// //                   "otherBleedingDetails",
// //                   e.target.value
// //                 )
// //               }
// //             />

// //           </div>

// //         </div>


// //         {/* =================================================
// //             SECTION 04 - PHYSIOTHERAPY
// //         ================================================= */}

// //         <div
// //           className={`clinical-section ${
// //             physioDone
// //               ? "section-complete"
// //               : ""
// //           }`}
// //         >

// //           <div className="section-header">

// //             <div className="section-number">
// //               04
// //             </div>

// //             <div>

// //               <h2>
// //                 {txt.physiotherapy}
// //               </h2>

// //               <p>
// //                 {txt.physiotherapyDesc}
// //               </p>

// //             </div>

// //             {physioDone && (
// //               <div className="completion-mark">
// //                 ✓
// //               </div>
// //             )}

// //           </div>


// //           {/* CURRENT PHYSIO */}

// //           <div className="field">

// //             <label>
// //               {txt.currentlyPhysio}
// //               <span className="required">
// //                 {txt.required}
// //               </span>
// //             </label>

// //             <select
// //               value={
// //                 form.underPhysiotherapy === ""
// //                   ? ""
// //                   : form.underPhysiotherapy
// //                   ? "Yes"
// //                   : "No"
// //               }
// //               onChange={(e) => {

// //                 const value =
// //                   e.target.value;

// //                 updateField(
// //                   "underPhysiotherapy",
// //                   value === ""
// //                     ? ""
// //                     : value === "Yes"
// //                 );

// //                 if (
// //                   value === "Yes"
// //                 ) {
// //                   updateField(
// //                     "previousPhysiotherapy",
// //                     ""
// //                   );
// //                 }

// //               }}
// //             >

// //               <option value="">
// //                 {txt.selectOption}
// //               </option>

// //               <option value="Yes">
// //                 {txt.yes}
// //               </option>

// //               <option value="No">
// //                 {txt.no}
// //               </option>

// //             </select>

// //           </div>


// //           {/* =================================================
// //               YES → CURRENT PHYSIO DETAILS
// //           ================================================= */}

// //           {form.underPhysiotherapy ===
// //             true && (

// //             <div className="conditional-box">

// //               <h3>
// //                 {txt.currentPhysioSection}
// //               </h3>


// //               <div className="form-grid two-columns">

// //                 {/* LOCATION */}

// //                 <div className="field">

// //                   <label>
// //                     {txt.wherePhysio}
// //                   </label>

// //                   <select
// //                     value={
// //                       form.physiotherapyLocation
// //                     }
// //                     onChange={(e) =>
// //                       updateField(
// //                         "physiotherapyLocation",
// //                         e.target.value
// //                       )
// //                     }
// //                   >

// //                     <option value="">
// //                       {txt.selectOption}
// //                     </option>

// //                     <option value="Hospital">
// //                       {txt.hospital}
// //                     </option>

// //                     <option value="Clinic">
// //                       {txt.clinic}
// //                     </option>

// //                     <option value="Hemophilia Centre">
// //                       {txt.hemophiliaCentre}
// //                     </option>

// //                     <option value="Home">
// //                       {txt.home}
// //                     </option>

// //                   </select>

// //                 </div>


// //                 {/* SESSIONS */}

// //                 <div className="field">

// //                   <label>
// //                     {txt.sessions}
// //                   </label>

// //                   <select
// //                     value={
// //                       form.physiotherapySessions
// //                     }
// //                     onChange={(e) =>
// //                       updateField(
// //                         "physiotherapySessions",
// //                         e.target.value
// //                       )
// //                     }
// //                   >

// //                     <option value="">
// //                       {txt.selectOption}
// //                     </option>

// //                     <option value="Once a week">
// //                       {txt.onceWeek}
// //                     </option>

// //                     <option value="2-3 times a week">
// //                       {txt.twoThree}
// //                     </option>

// //                     <option value="More than 3 sessions a week">
// //                       {txt.moreThree}
// //                     </option>

// //                   </select>

// //                 </div>


// //                 {/* DURATION */}

// //                 <div className="field">

// //                   <label>
// //                     {txt.sessionDuration}
// //                   </label>

// //                   <select
// //                     value={
// //                       form.physiotherapyDuration
// //                     }
// //                     onChange={(e) =>
// //                       updateField(
// //                         "physiotherapyDuration",
// //                         e.target.value
// //                       )
// //                     }
// //                   >

// //                     <option value="">
// //                       {txt.selectOption}
// //                     </option>

// //                     <option value="Less than 10 minutes">
// //                       {txt.lessTen}
// //                     </option>

// //                     <option value="10-20 minutes">
// //                       {txt.tenTwenty}
// //                     </option>

// //                     <option value="20-30 minutes">
// //                       {txt.twentyThirty}
// //                     </option>

// //                     <option value="More than 30 minutes">
// //                       {txt.moreThirty}
// //                     </option>

// //                   </select>

// //                 </div>


// //                 {/* BODY PART */}

// //                 <div className="field">

// //                   <label>
// //                     {txt.affectedBodyPart}
// //                   </label>

// //                   <select
// //                     value={
// //                       form.physiotherapyBodyPart
// //                     }
// //                     onChange={(e) =>
// //                       updateField(
// //                         "physiotherapyBodyPart",
// //                         e.target.value
// //                       )
// //                     }
// //                   >

// //                     <option value="">
// //                       {txt.selectOption}
// //                     </option>

// //                     {joints.map(
// //                       (joint) => (
// //                         <option
// //                           key={joint.value}
// //                           value={
// //                             joint.value
// //                           }
// //                         >
// //                           {joint.label}
// //                         </option>
// //                       )
// //                     )}

// //                   </select>

// //                 </div>

// //               </div>


// //               {/* TREATMENT */}

// //               <div className="field">

// //                 <label>
// //                   {txt.treatmentReceived}
// //                 </label>

// //                 <select
// //                   value={
// //                     form.physiotherapyTreatment
// //                   }
// //                   onChange={(e) =>
// //                     updateField(
// //                       "physiotherapyTreatment",
// //                       e.target.value
// //                     )
// //                   }
// //                 >

// //                   <option value="">
// //                     {txt.selectOption}
// //                   </option>

// //                   <option value="Stretching">
// //                     {txt.stretching}
// //                   </option>

// //                   <option value="Strengthening">
// //                     {txt.strengthening}
// //                   </option>

// //                   <option value="Balance exercises">
// //                     {txt.balance}
// //                   </option>

// //                   <option value="General fitness">
// //                     {txt.generalFitness}
// //                   </option>

// //                   <option value="Joint movement exercises">
// //                     {txt.jointMovement}
// //                   </option>

// //                   <option value="Exercises for pain relief">
// //                     {txt.painRelief}
// //                   </option>

// //                 </select>

// //               </div>


// //               {/* EQUIPMENT */}

// //               <div className="field">

// //                 <label>
// //                   {txt.equipment}
// //                 </label>

// //                 <select
// //                   value={
// //                     form.physiotherapyEquipment
// //                   }
// //                   onChange={(e) =>
// //                     updateField(
// //                       "physiotherapyEquipment",
// //                       e.target.value
// //                     )
// //                   }
// //                 >

// //                   <option value="">
// //                     {txt.selectOption}
// //                   </option>

// //                   <option value="None">
// //                     {txt.noEquipment}
// //                   </option>

// //                   <option value="Dumbbells">
// //                     {txt.dumbbells}
// //                   </option>

// //                   <option value="Weight cuffs">
// //                     {txt.weightsCuffs}
// //                   </option>

// //                   <option value="Theraband">
// //                     {txt.theraband}
// //                   </option>

// //                   <option value="Yoga mat">
// //                     {txt.yogaMat}
// //                   </option>

// //                   <option value="Other">
// //                     {txt.otherEquipment}
// //                   </option>

// //                 </select>

// //               </div>


// //               {/* HELPING */}

// //               <div className="field">

// //                 <label>
// //                   {txt.helping}
// //                 </label>

// //                 <select
// //                   value={
// //                     form.physiotherapyHelping
// //                   }
// //                   onChange={(e) =>
// //                     updateField(
// //                       "physiotherapyHelping",
// //                       e.target.value
// //                     )
// //                   }
// //                 >

// //                   <option value="">
// //                     {txt.selectOption}
// //                   </option>

// //                   <option value="Yes">
// //                     {txt.yes}
// //                   </option>

// //                   <option value="No">
// //                     {txt.no}
// //                   </option>

// //                 </select>

// //               </div>


// //               {/* PROBLEMS */}

// //               <div className="field">

// //                 <label>
// //                   {txt.problems}
// //                 </label>

// //                 <div className="problem-grid">

// //                   {[
// //                     {
// //                       value: "None",
// //                       label: txt.noProblems,
// //                     },
// //                     {
// //                       value: "Pain",
// //                       label: txt.pain,
// //                     },
// //                     {
// //                       value: "New bleeding",
// //                       label: txt.newBleeding,
// //                     },
// //                     {
// //                       value: "Stiffness",
// //                       label: txt.stiffness,
// //                     },
// //                     {
// //                       value: "Increased swelling",
// //                       label: txt.increasedSwelling,
// //                     },
// //                     {
// //                       value: "Feeling tired",
// //                       label: txt.tired,
// //                     },
// //                   ].map(
// //                     (problem) => {

// //                       const active =
// //                         form.physiotherapyProblems.includes(
// //                           problem.value
// //                         );

// //                       return (
// //                         <button
// //                           key={
// //                             problem.value
// //                           }
// //                           type="button"
// //                           className={`problem-chip ${
// //                             active
// //                               ? "active"
// //                               : ""
// //                           }`}
// //                           onClick={() =>
// //                             togglePhysioProblem(
// //                               problem.value
// //                             )
// //                           }
// //                         >

// //                           <span>
// //                             {active
// //                               ? "✓"
// //                               : ""}
// //                           </span>

// //                           {problem.label}

// //                         </button>
// //                       );
// //                     }
// //                   )}

// //                 </div>

// //               </div>

// //             </div>
// //           )}


// //           {/* =================================================
// //               NO → PREVIOUS PHYSIO
// //           ================================================= */}

// //           {form.underPhysiotherapy ===
// //             false && (

// //             <div className="conditional-box">

// //               <h3>
// //                 {txt.previousPhysioSection}
// //               </h3>


// //               <div className="field">

// //                 <label>
// //                   {txt.previousPhysio}
// //                 </label>

// //                 <select
// //                   value={
// //                     form.previousPhysiotherapy === ""
// //                       ? ""
// //                       : form.previousPhysiotherapy
// //                       ? "Yes"
// //                       : "No"
// //                   }
// //                   onChange={(e) =>
// //                     updateField(
// //                       "previousPhysiotherapy",
// //                       e.target.value ===
// //                         "Yes"
// //                     )
// //                   }
// //                 >

// //                   <option value="">
// //                     {txt.selectOption}
// //                   </option>

// //                   <option value="Yes">
// //                     {txt.yes}
// //                   </option>

// //                   <option value="No">
// //                     {txt.no}
// //                   </option>

// //                 </select>

// //               </div>


// //               {form.previousPhysiotherapy ===
// //                 true && (

// //                 <div className="form-grid two-columns">

// //                   <div className="field">

// //                     <label>
// //                       {txt.stoppedWhen}
// //                     </label>

// //                     <input
// //                       type="date"
// //                       value={
// //                         form.physiotherapyStoppedDate
// //                       }
// //                       onChange={(e) =>
// //                         updateField(
// //                           "physiotherapyStoppedDate",
// //                           e.target.value
// //                         )
// //                       }
// //                     />

// //                   </div>


// //                   <div className="field">

// //                     <label>
// //                       {txt.stoppedWhy}
// //                     </label>

// //                     <select
// //                       value={
// //                         form.physiotherapyStoppedReason
// //                       }
// //                       onChange={(e) =>
// //                         updateField(
// //                           "physiotherapyStoppedReason",
// //                           e.target.value
// //                         )
// //                       }
// //                     >

// //                       <option value="">
// //                         {
// //                           txt.stoppedWhyPlaceholder
// //                         }
// //                       </option>

// //                       <option value="No longer needed">
// //                         {txt.noNeed}
// //                       </option>

// //                       <option value="Symptoms improved">
// //                         {txt.improved}
// //                       </option>

// //                       <option value="Difficulty accessing physiotherapy">
// //                         {txt.access}
// //                       </option>

// //                       <option value="Cost / financial reasons">
// //                         {txt.cost}
// //                       </option>

// //                       <option value="Time constraints">
// //                         {txt.time}
// //                       </option>

// //                       <option value="Other">
// //                         {txt.other}
// //                       </option>

// //                     </select>

// //                   </div>

// //                 </div>

// //               )}

// //             </div>

// //           )}

// //         </div>


// //         {/* =================================================
// //             SECTION 05 - MOBILITY
// //         ================================================= */}

// //         <div className="clinical-section">

// //           <div className="section-header">

// //             <div className="section-number">
// //               05
// //             </div>

// //             <div>

// //               <h2>
// //                 {txt.mobility}
// //               </h2>

// //             </div>

// //           </div>


// //           <div className="form-grid two-columns">

// //             <div className="field">

// //               <label>
// //                 {txt.mobility}
// //               </label>

// //               <select
// //                 value={
// //                   form.mobilityLimitation
// //                 }
// //                 onChange={(e) =>
// //                   updateField(
// //                     "mobilityLimitation",
// //                     e.target.value
// //                   )
// //                 }
// //               >

// //                 <option value="">
// //                   {txt.selectMobility}
// //                 </option>

// //                 <option value="None">
// //                   {txt.noLimitation}
// //                 </option>

// //                 <option value="Mild">
// //                   {txt.mild}
// //                 </option>

// //                 <option value="Moderate">
// //                   {txt.moderate}
// //                 </option>

// //                 <option value="Severe">
// //                   {txt.severe}
// //                 </option>

// //               </select>

// //             </div>


// //             <div className="field">

// //               <label>
// //                 {txt.assistive}
// //               </label>

// //               <select
// //                 value={
// //                   form.assistiveDevices
// //                 }
// //                 onChange={(e) =>
// //                   updateField(
// //                     "assistiveDevices",
// //                     e.target.value
// //                   )
// //                 }
// //               >
// //                 <option value="">
// //                   {txt.assistivePlaceholder}
// //                 </option>

// //                 <option value="None">
// //                   {txt.assistiveOptions.none}
// //                 </option>

// //                 <option value="Knee Brace">
// //                   {txt.assistiveOptions.kneeBrace}
// //                 </option>

// //                 <option value="Ankle / Foot Brace">
// //                   {txt.assistiveOptions.ankleBrace}
// //                 </option>

// //                 <option value="Elbow Brace">
// //                   {txt.assistiveOptions.elbowBrace}
// //                 </option>

// //                 <option value="Wrist Support">
// //                   {txt.assistiveOptions.wristSupport}
// //                 </option>

// //                 <option value="Cane / Walking Stick">
// //                   {txt.assistiveOptions.cane}
// //                 </option>

// //                 <option value="Crutches">
// //                   {txt.assistiveOptions.crutches}
// //                 </option>

// //                 <option value="Walker">
// //                   {txt.assistiveOptions.walker}
// //                 </option>

// //                 <option value="Wheelchair">
// //                   {txt.assistiveOptions.wheelchair}
// //                 </option>

// //                 <option value="Other">
// //                   {txt.assistiveOptions.other}
// //                 </option>
// //               </select>

// //             </div>

// //           </div>

// //         </div>


// //         {/* =================================================
// //             SECTION 06 - DOCTOR
// //         ================================================= */}

// //         <div className="clinical-section">

// //           <div className="section-header">

// //             <div className="section-number">
// //               06
// //             </div>

// //             <div>

// //               <h2>
// //                 {txt.doctor}
// //               </h2>

// //               <p>
// //                 {txt.doctorDesc}
// //               </p>

// //             </div>

// //           </div>


// //           <div className="field">

// //             <label>
// //               {txt.doctor}
// //               <span className="required">
// //                 {txt.required}
// //               </span>
// //             </label>

// //             <select
// //               value={
// //                 form.consultingDoctorId
// //               }
// //               onChange={(e) =>
// //                 updateField(
// //                   "consultingDoctorId",
// //                   e.target.value
// //                 )
// //               }
// //               disabled={
// //                 doctorFieldLocked
// //               }
// //             >

// //               <option value="">
// //                 {doctorsLoading
// //                   ? txt.doctorLoading
// //                   : txt.selectDoctor}
// //               </option>

// //               {!doctorsLoading &&
// //                 doctors.length ===
// //                   0 && (
// //                   <option value="">
// //                     {txt.noDoctors}
// //                   </option>
// //                 )}

// //               {doctors.map((doctor) => (
// //                 <option
// //                   key={doctor._id}
// //                   value={doctor._id}
// //                 >
// //                   {doctor.nameTranslations?.[language] ||
// //                     doctor.fullName}{" "}
// //                   — {doctor.professionalId}
// //                 </option>
// //               ))}

// //             </select>

// //             {doctorAssigned && !doctorChangePending && (
// //               <button
// //                 type="button"
// //                 className="doctor-change-button"
// //                 onClick={() => {
// //                   setChangeRequestReason("");
// //                   setChangeRequestModalOpen(true);
// //                 }}
// //                 disabled={doctorStatusLoading || changeRequestLoading}
// //               >
// //                 {txt.requestDoctorChange}
// //               </button>
// //             )}

// //             {doctorChangePending && (
// //               <div className="doctor-change-pending">
// //                 <span className="doctor-change-pending-icon">⏳</span>
// //                 <span>{txt.requestPending}</span>
// //               </div>
// //             )}

// //           </div>

// //         </div>


// //         {/* =================================================
// //             DOCTOR CHANGE REQUEST MODAL
// //         ================================================= */}

// //         {changeRequestModalOpen && (
// //           <div
// //             className="doctor-change-modal-overlay"
// //             onMouseDown={(e) => {
// //               if (e.target === e.currentTarget && !changeRequestLoading) {
// //                 setChangeRequestModalOpen(false);
// //               }
// //             }}
// //           >
// //             <div
// //               className="doctor-change-modal"
// //               role="dialog"
// //               aria-modal="true"
// //               aria-labelledby="doctor-change-title"
// //             >
// //               <div className="doctor-change-modal-header">
// //                 <div>
// //                   <h3 id="doctor-change-title">
// //                     {txt.requestDoctorChangeTitle}
// //                   </h3>
// //                   <p>{txt.requestDoctorChangeText}</p>
// //                 </div>
// //                 <button
// //                   type="button"
// //                   className="doctor-change-close"
// //                   onClick={() => setChangeRequestModalOpen(false)}
// //                   disabled={changeRequestLoading}
// //                   aria-label={txt.cancel}
// //                 >
// //                   ×
// //                 </button>
// //               </div>

// //               <div className="doctor-change-modal-body">
// //                 <label className="doctor-change-reason-label">
// //                   {txt.changeReason}
// //                 </label>
// //                 <textarea
// //                   value={changeRequestReason}
// //                   onChange={(e) => setChangeRequestReason(e.target.value)}
// //                   placeholder={txt.changeReasonPlaceholder}
// //                   rows={5}
// //                   disabled={changeRequestLoading}
// //                   className="doctor-change-reason-input"
// //                 />
// //               </div>

// //               <div className="doctor-change-modal-actions">
// //                 <button
// //                   type="button"
// //                   className="doctor-change-cancel"
// //                   onClick={() => setChangeRequestModalOpen(false)}
// //                   disabled={changeRequestLoading}
// //                 >
// //                   {txt.cancel}
// //                 </button>

// //                 <button
// //                   type="button"
// //                   className="doctor-change-submit"
// //                   onClick={handleDoctorChangeRequest}
// //                   disabled={changeRequestLoading}
// //                 >
// //                   {changeRequestLoading
// //                     ? txt.sendingRequest
// //                     : txt.sendRequest}
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         )}


// //         {/* =================================================
// //             ERROR
// //         ================================================= */}

// //         {error && (

// //           <div className="error-box">

// //             <span className="error-icon">
// //               !
// //             </span>

// //             <span>
// //               {error}
// //             </span>

// //           </div>

// //         )}


// //         {/* =================================================
// //             ACTIONS
// //         ================================================= */}

// //         <div className="action-row">

// //           <button
// //             type="button"
// //             className="back-button"
// //             onClick={() =>
// //               navigate("/awareness")
// //             }
// //           >
// //             ← {txt.back}
// //           </button>


// //           <button
// //             type="button"
// //             className="continue-button"
// //             onClick={handleSubmit}
// //             disabled={loading}
// //           >

// //             {loading ? (
// //               <>
// //                 <span className="spinner"></span>
// //                 {txt.saving}
// //               </>
// //             ) : (
// //               <>
// //                 {txt.save}
// //                 <span>→</span>
// //               </>
// //             )}

// //           </button>

// //         </div>


// //         {/* =================================================
// //             FOOTER
// //         ================================================= */}

// //         <div className="bottom-note">

// //           <span className="small-info">
// //             i
// //           </span>

// //           <span>
// //             {txt.secure}
// //           </span>

// //         </div>

// //       </div>


// //       {/* =================================================
// //           STYLES
// //       ================================================= */}

// //       <style>{`

// //         * {
// //           box-sizing: border-box;
// //         }

// //         .clinical-page {
// //           min-height: 100vh;
// //           width: 100%;
// //           padding: 32px 20px;

// //           background:
// //             linear-gradient(
// //               135deg,
// //               #eef3fa 0%,
// //               #f7f9fd 50%,
// //               #edf2f9 100%
// //             );

// //           display: flex;
// //           justify-content: center;
// //           align-items: flex-start;

// //           font-family:
// //             Inter,
// //             -apple-system,
// //             BlinkMacSystemFont,
// //             "Segoe UI",
// //             sans-serif;

// //           color: #1c2942;
// //         }

// //         .clinical-container {
// //           width: min(960px, 100%);

// //           padding: 28px;

// //           background: #ffffff;

// //           border:
// //             1px solid #dce4ef;

// //           border-radius: 18px;

// //           box-shadow:
// //             0 18px 50px
// //             rgba(30, 48, 95, 0.09);
// //         }

// //         .clinical-header {
// //           display: flex;
// //           align-items: center;
// //           gap: 13px;

// //           padding-bottom: 22px;

// //           border-bottom:
// //             1px solid #e1e6ee;
// //         }

// //         .header-icon {
// //           width: 44px;
// //           height: 44px;

// //           flex-shrink: 0;

// //           display: flex;
// //           align-items: center;
// //           justify-content: center;

// //           border-radius: 11px;

// //           background:
// //             linear-gradient(
// //               135deg,
// //               #24328f,
// //               #4a7dfc
// //             );

// //           color: white;

// //           font-size: 25px;
// //           font-weight: 300;
// //         }

// //         .header-eyebrow {
// //           display: block;
// //           margin-bottom: 4px;

// //           color: #4a7dfc;

// //           font-size: 8px;
// //           font-weight: 700;

// //           letter-spacing: 1px;
// //         }

// //         .header-text h1 {
// //           margin: 0;

// //           color: #1d2a47;

// //           font-size: 23px;
// //           font-weight: 700;
// //         }

// //         .header-text p {
// //           margin: 5px 0 0;

// //           color: #78869a;

// //           font-size: 10px;
// //           line-height: 1.5;
// //         }

// //         .info-banner {
// //           margin-top: 18px;

// //           padding: 12px 14px;

// //           display: flex;
// //           align-items: flex-start;

// //           gap: 9px;

// //           border:
// //             1px solid #cfe3eb;

// //           border-radius: 10px;

// //           background: #effafd;
// //         }

// //         .info-banner-icon {
// //           width: 21px;
// //           height: 21px;

// //           flex-shrink: 0;

// //           display: flex;
// //           align-items: center;
// //           justify-content: center;

// //           border-radius: 50%;

// //           background: #d9f1f6;

// //           color: #3b8093;

// //           font-size: 10px;
// //           font-weight: 700;
// //         }

// //         .info-banner strong {
// //           display: block;

// //           color: #315d70;

// //           font-size: 9px;
// //         }

// //         .info-banner p {
// //           margin: 3px 0 0;

// //           color: #648499;

// //           font-size: 8px;

// //           line-height: 1.5;
// //         }

// //         .clinical-section {
// //           margin-top: 18px;

// //           padding: 19px;

// //           border:
// //             1px solid #dfe6ef;

// //           border-radius: 12px;

// //           background: #ffffff;

// //           transition:
// //             border-color .2s ease,
// //             background .2s ease;
// //         }

// //         .clinical-section.section-complete {
// //           border-color: #cdd9ee;
// //           background: #fbfcff;
// //         }

// //         .section-header {
// //           display: flex;
// //           align-items: center;

// //           gap: 10px;

// //           margin-bottom: 18px;
// //         }

// //         .section-number {
// //           width: 30px;
// //           height: 30px;

// //           flex-shrink: 0;

// //           display: flex;
// //           align-items: center;
// //           justify-content: center;

// //           border-radius: 8px;

// //           background: #eef2ff;

// //           color: #24328f;

// //           font-size: 8px;
// //           font-weight: 700;
// //         }

// //         .section-header h2 {
// //           margin: 0;

// //           color: #202d47;

// //           font-size: 14px;
// //           font-weight: 700;
// //         }

// //         .section-header p {
// //           margin: 3px 0 0;

// //           color: #8996a8;

// //           font-size: 8px;
// //         }

// //         .completion-mark {
// //           width: 21px;
// //           height: 21px;

// //           margin-left: auto;

// //           display: flex;
// //           align-items: center;
// //           justify-content: center;

// //           border-radius: 50%;

// //           background: #edf8f2;

// //           color: #2b9660;

// //           border:
// //             1px solid #d5ebdf;

// //           font-size: 10px;
// //           font-weight: 700;
// //         }

// //         .form-grid {
// //           display: grid;

// //           grid-template-columns:
// //             repeat(3, minmax(0, 1fr));

// //           gap: 14px;
// //         }

// //         .form-grid.two-columns {
// //           grid-template-columns:
// //             repeat(2, minmax(0, 1fr));

// //           margin-top: 16px;
// //         }

// //         .field {
// //           min-width: 0;
// //           margin-bottom: 14px;
// //         }

// //         .full-width {
// //           grid-column: 1 / -1;
// //         }

// //         .field label {
// //           display: block;

// //           margin-bottom: 6px;

// //           color: #46556d;

// //           font-size: 9px;

// //           font-weight: 600;
// //         }

// //         .required {
// //           margin-left: 3px;
// //           color: #d34c4c;
// //         }

// //         .field-help {
// //           margin: -1px 0 9px;

// //           color: #8a97a9;

// //           font-size: 8px;

// //           line-height: 1.4;
// //         }

// //         .field input,
// //         .field select,
// //         .doctor-change-button {
// //           margin-top: 12px;
// //           width: 100%;
// //           min-height: 35px;
// //           border: 1px solid #1890b4;
// //           border-radius: 10px;
// //           background: #fff;
// //           color: black;
// //           font-size: 9px;
// //           font-weight: 200;
// //           cursor: pointer;
// //           transition: 0.2s ease;
// //         }

// //         .doctor-change-button:hover:not(:disabled) {
// //           background: #fff5f4;
// //         }

// //         .doctor-change-button:disabled {
// //           opacity: 0.6;
// //           cursor: not-allowed;
// //         }

// //         .doctor-change-pending {
// //           display: flex;
// //           align-items: flex-start;
// //           gap: 9px;
// //           margin-top: 12px;
// //           padding: 12px 14px;
// //           border: 1px solid #f0c36d;
// //           border-radius: 10px;
// //           background: #fffaf0;
// //           color: #7a4b00;
// //           font-size: 13px;
// //           line-height: 1.5;
// //         }

// //         .doctor-change-pending-icon {
// //           flex: 0 0 auto;
// //         }

// //         .doctor-change-modal-overlay {
// //           position: fixed;
// //           inset: 0;
// //           z-index: 9999;
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           padding: 20px;
// //           background: rgba(0, 0, 0, 0.45);
// //         }

// //         .doctor-change-modal {
// //           width: min(560px, 100%);
// //           max-height: calc(100vh - 40px);
// //           overflow-y: auto;
// //           border-radius: 16px;
// //           background: #fff;
// //           box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
// //         }

// //         .doctor-change-modal-header {
// //           display: flex;
// //           align-items: flex-start;
// //           justify-content: space-between;
// //           gap: 16px;
// //           padding: 22px 22px 16px;
// //           border-bottom: 1px solid #eee;
// //         }

// //         .doctor-change-modal-header h3 {
// //           margin: 0 0 7px;
// //           font-size: 20px;
// //           line-height: 1.25;
// //         }

// //         .doctor-change-modal-header p {
// //           margin: 0;
// //           color: #666;
// //           font-size: 13px;
// //           line-height: 1.55;
// //         }

// //         .doctor-change-close {
// //           width: 34px;
// //           height: 34px;
// //           flex: 0 0 auto;
// //           border: 0;
// //           border-radius: 8px;
// //           background: #f5f5f5;
// //           color: #444;
// //           font-size: 24px;
// //           line-height: 1;
// //           cursor: pointer;
// //         }

// //         .doctor-change-modal-body {
// //           padding: 20px 22px;
// //         }

// //         .doctor-change-reason-label {
// //           display: block;
// //           margin-bottom: 8px;
// //           font-size: 14px;
// //           font-weight: 700;
// //         }

// //         .doctor-change-reason-input {
// //           width: 100%;
// //           min-height: 120px;
// //           box-sizing: border-box;
// //           resize: vertical;
// //           padding: 12px 13px;
// //           border: 1px solid #d6d6d6;
// //           border-radius: 10px;
// //           outline: none;
// //           font: inherit;
// //           line-height: 1.5;
// //         }

// //         .doctor-change-reason-input:focus {
// //           border-color: #777;
// //           box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06);
// //         }

// //         .doctor-change-modal-actions {
// //           display: flex;
// //           justify-content: flex-end;
// //           gap: 10px;
// //           padding: 0 22px 22px;
// //         }

// //         .doctor-change-cancel,
// //         .doctor-change-submit {
// //           min-height: 42px;
// //           padding: 0 18px;
// //           border-radius: 9px;
// //           font-size: 14px;
// //           font-weight: 700;
// //           cursor: pointer;
// //         }

// //         .doctor-change-cancel {
// //           border: 1px solid #d6d6d6;
// //           background: #fff;
// //           color: #444;
// //         }

// //         .doctor-change-submit {
// //           border: 1px solid #111;
// //           background: #111;
// //           color: #fff;
// //         }

// //         .doctor-change-cancel:disabled,
// //         .doctor-change-submit:disabled {
// //           opacity: 0.6;
// //           cursor: not-allowed;
// //         }

// //         .field textarea {
// //           width: 100%;

// //           padding: 10px 12px;

// //           border:
// //             1px solid #d8e0eb;

// //           border-radius: 8px;

// //           background: #ffffff;

// //           color: #26344d;

// //           font-family: inherit;

// //           font-size: 10px;

// //           outline: none;

// //           transition:
// //             border-color .15s ease,
// //             box-shadow .15s ease,
// //             background .15s ease;
// //         }

// //         .field input,
// //         .field select {
// //           height: 40px;
// //         }

// //         .field textarea {
// //           resize: vertical;
// //           min-height: 85px;
// //         }

// //         .field input::placeholder,
// //         .field textarea::placeholder {
// //           color: #a3adbc;
// //         }

// //         .field input:hover,
// //         .field select:hover,
// //         .field textarea:hover {
// //           border-color: #bcc8da;
// //           background: #fcfdff;
// //         }

// //         .field input:focus,
// //         .field select:focus,
// //         .field textarea:focus {
// //           border-color: #4a7dfc;

// //           background: #ffffff;

// //           box-shadow:
// //             0 0 0 3px
// //             rgba(74, 125, 252, .10);
// //         }

// //         .field select {
// //           cursor: pointer;
// //         }

// //         .field select:disabled {
// //           opacity: .65;
// //           cursor: not-allowed;
// //         }


// //         /* ================================================
// //            MEDICATION MULTI-SELECT DROPDOWN
// //         ================================================= */

// //         .medication-dropdown {
// //           position: relative;
// //           width: 100%;
// //         }

// //         .medication-dropdown-button {
// //           width: 100%;
// //           min-height: 38px;

// //           padding: 0 11px;

// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;

// //           gap: 8px;

// //           border:
// //             1px solid #d8e0eb;

// //           border-radius: 7px;

// //           background: #ffffff;

// //           color: #334155;

// //           font-family: inherit;
// //           font-size: 10px;
// //           font-weight: 500;

// //           cursor: pointer;

// //           text-align: left;

// //           transition:
// //             border-color .15s ease,
// //             box-shadow .15s ease;
// //         }

// //         .medication-dropdown-button:hover {
// //           border-color: #bcc8da;
// //           background: #fcfdff;
// //         }

// //         .medication-dropdown-button:focus {
// //           outline: none;

// //           border-color: #4a7dfc;

// //           box-shadow:
// //             0 0 0 3px
// //             rgba(74, 125, 252, .10);
// //         }

// //         .medication-dropdown-value {
// //           flex: 1;
// //           min-width: 0;

// //           overflow: hidden;
// //           text-overflow: ellipsis;
// //           white-space: nowrap;
// //         }

// //         .medication-dropdown-arrow {
// //           flex-shrink: 0;

// //           color: #66758b;

// //           font-size: 13px;
// //           line-height: 1;
// //         }

// //         .medication-dropdown-overlay {
// //           position: fixed;

// //           inset: 0;

// //           z-index: 90;

// //           width: 100%;
// //           height: 100%;

// //           padding: 0;

// //           border: none;

// //           background: transparent;

// //           cursor: default;
// //         }

// //         .medication-dropdown-menu {
// //           position: absolute;

// //           left: 0;
// //           right: 0;
// //           top: calc(100% + 4px);

// //           z-index: 100;

// //           max-height: 220px;

// //           overflow-y: auto;

// //           padding: 6px;

// //           border:
// //             1px solid #d8e0eb;

// //           border-radius: 8px;

// //           background: #ffffff;

// //           box-shadow:
// //             0 10px 24px
// //             rgba(31, 52, 86, .14);
// //         }

// //         .medication-option {
// //           display: flex;

// //           align-items: center;

// //           gap: 8px;

// //           min-height: 32px;

// //           padding: 6px 7px;

// //           border-radius: 6px;

// //           color: #4c5b70;

// //           font-size: 9px;
// //           font-weight: 600;

// //           cursor: pointer;

// //           transition:
// //             background .15s ease;
// //         }

// //         .medication-option:hover {
// //           background: #f4f7ff;
// //         }

// //         .medication-option input {
// //           width: 14px;
// //           height: 14px;

// //           flex-shrink: 0;

// //           margin: 0;

// //           cursor: pointer;

// //           accent-color: #4a7dfc;
// //         }

// //         .joint-field {
// //           margin-top: 16px;
// //         }

// //         .field-help {
// //           margin: 6px 0 0;
// //           color: #7b8798;
// //           font-size: 8px;
// //           line-height: 1.5;
// //         }

// //         .selected-joints-help {
// //           margin-top: 9px;
// //           font-weight: 600;
// //         }

// //         .joint-grid {
// //           display: flex;
// //           flex-wrap: wrap;
// //           gap: 7px;
// //         }

// //         .joint-chip {
// //           min-height: 31px;

// //           padding: 0 11px;

// //           display: flex;
// //           align-items: center;

// //           gap: 5px;

// //           border:
// //             1px solid #d8e0eb;

// //           border-radius: 999px;

// //           background: #ffffff;

// //           color: #5c6a7e;

// //           font-family: inherit;

// //           font-size: 9px;

// //           font-weight: 600;

// //           cursor: pointer;

// //           transition: all .15s ease;
// //         }

// //         .joint-chip:hover {
// //           border-color: #9eb3dc;

// //           background: #f5f8ff;

// //           color: #24328f;
// //         }

// //         .joint-chip.active {
// //           border-color: #4a7dfc;

// //           background: #eef2ff;

// //           color: #24328f;
// //         }

// //         .joint-check {
// //           width: 14px;
// //           height: 14px;

// //           display: flex;
// //           align-items: center;
// //           justify-content: center;

// //           border-radius: 50%;

// //           background: #edf0f5;

// //           color: transparent;

// //           font-size: 8px;
// //         }

// //         .joint-chip.active
// //         .joint-check {
// //           background: #4a7dfc;
// //           color: #ffffff;
// //         }

// //         /* ================================================
// //            CONDITIONAL PHYSIO BOX
// //         ================================================= */

// //         .conditional-box {
// //           margin-top: 17px;

// //           padding: 16px;

// //           border:
// //             1px solid #dce6f3;

// //           border-radius: 10px;

// //           background: #f9fbff;
// //         }

// //         .conditional-box h3 {
// //           margin: 0 0 15px;

// //           color: #2a3c5d;

// //           font-size: 11px;

// //           font-weight: 700;
// //         }

// //         /* ================================================
// //            PROBLEM CHIPS
// //         ================================================= */

// //         .problem-grid {
// //           display: flex;

// //           flex-wrap: wrap;

// //           gap: 7px;
// //         }

// //         .problem-chip {
// //           min-height: 34px;

// //           padding: 0 11px;

// //           display: flex;

// //           align-items: center;

// //           gap: 6px;

// //           border:
// //             1px solid #d8e0eb;

// //           border-radius: 8px;

// //           background: #ffffff;

// //           color: #5c6a7e;

// //           font-family: inherit;

// //           font-size: 9px;

// //           font-weight: 600;

// //           cursor: pointer;

// //           transition: all .15s ease;
// //         }

// //         .problem-chip:hover {
// //           border-color: #9eb3dc;

// //           background: #f5f8ff;
// //         }

// //         .problem-chip.active {
// //           border-color: #4a7dfc;

// //           background: #eef2ff;

// //           color: #24328f;
// //         }

// //         .problem-chip span {
// //           width: 15px;
// //           height: 15px;

// //           display: flex;

// //           align-items: center;
// //           justify-content: center;

// //           border-radius: 50%;

// //           background: #edf0f5;

// //           font-size: 8px;
// //         }

// //         .problem-chip.active span {
// //           background: #4a7dfc;
// //           color: #ffffff;
// //         }

// //         /* ================================================
// //            ERROR
// //         ================================================= */

// //         .error-box {
// //           margin-top: 16px;

// //           padding: 10px 12px;

// //           display: flex;

// //           align-items: center;

// //           gap: 8px;

// //           border:
// //             1px solid #f0c9c6;

// //           border-radius: 9px;

// //           background: #fff6f5;

// //           color: #b3261e;

// //           font-size: 9px;
// //         }

// //         .error-icon {
// //           width: 19px;
// //           height: 19px;

// //           flex-shrink: 0;

// //           display: flex;

// //           align-items: center;
// //           justify-content: center;

// //           border-radius: 50%;

// //           background: #fde4e2;

// //           font-size: 9px;

// //           font-weight: 700;
// //         }

// //         /* ================================================
// //            ACTIONS
// //         ================================================= */

// //         .action-row {
// //           margin-top: 22px;

// //           display: flex;

// //           align-items: center;

// //           justify-content: space-between;

// //           gap: 12px;
// //         }

// //         .back-button,
// //         .continue-button {
// //           height: 40px;

// //           padding: 0 17px;

// //           display: flex;

// //           align-items: center;

// //           justify-content: center;

// //           gap: 7px;

// //           border-radius: 8px;

// //           font-family: inherit;

// //           font-size: 10px;

// //           font-weight: 600;

// //           cursor: pointer;

// //           transition: all .15s ease;
// //         }

// //         .back-button {
// //           min-width: 90px;

// //           border:
// //             1px solid #d8e0eb;

// //           background: #f7f9fc;

// //           color: #657388;
// //         }

// //         .back-button:hover {
// //           border-color: #c4cfde;

// //           background: #eef2f7;

// //           color: #3f4e65;
// //         }

// //         .continue-button {
// //           min-width: 170px;

// //           border: none;

// //           background:
// //             linear-gradient(
// //               135deg,
// //               #4a7dfc,
// //               #5f8dff
// //             );

// //           color: #ffffff;

// //           box-shadow:
// //             0 6px 16px
// //             rgba(74, 125, 252, .20);
// //         }

// //         .continue-button:hover:not(:disabled) {
// //           transform: translateY(-1px);

// //           box-shadow:
// //             0 8px 20px
// //             rgba(74, 125, 252, .28);
// //         }

// //         .continue-button:disabled {
// //           opacity: .65;

// //           cursor: not-allowed;

// //           transform: none;

// //           box-shadow: none;
// //         }

// //         .spinner {
// //           width: 12px;
// //           height: 12px;

// //           border:
// //             2px solid
// //             rgba(255,255,255,.35);

// //           border-top-color: #ffffff;

// //           border-radius: 50%;

// //           animation:
// //             spin .7s linear infinite;
// //         }

// //         @keyframes spin {
// //           to {
// //             transform: rotate(360deg);
// //           }
// //         }

// //         .bottom-note {
// //           margin-top: 18px;

// //           padding-top: 12px;

// //           display: flex;

// //           align-items: center;

// //           justify-content: center;

// //           gap: 6px;

// //           border-top:
// //             1px solid #e7ebf1;

// //           color: #8a97a8;

// //           font-size: 8px;

// //           text-align: center;
// //         }

// //         .small-info {
// //           width: 15px;
// //           height: 15px;

// //           flex-shrink: 0;

// //           display: flex;

// //           align-items: center;

// //           justify-content: center;

// //           border-radius: 50%;

// //           background: #eef2ff;

// //           color: #4a7dfc;

// //           font-size: 8px;

// //           font-weight: 700;
// //         }

// //         @media (max-width: 800px) {

// //           .clinical-page {
// //             padding: 22px 14px;
// //           }

// //           .clinical-container {
// //             padding: 22px;

// //             border-radius: 15px;
// //           }

// //           .form-grid {
// //             grid-template-columns:
// //               repeat(2, minmax(0, 1fr));
// //           }

// //         }

// //         @media (max-width: 600px) {

// //           .clinical-page {
// //             padding: 0;

// //             background: #f4f7fb;
// //           }

// //           .clinical-container {
// //             width: 100%;

// //             padding: 18px 14px;

// //             border-radius: 0;

// //             border-left: none;
// //             border-right: none;

// //             box-shadow: none;
// //           }

// //           .clinical-header {
// //             padding-bottom: 17px;
// //           }

// //           .header-icon {
// //             width: 38px;
// //             height: 38px;

// //             font-size: 22px;
// //           }

// //           .header-text h1 {
// //             font-size: 18px;
// //           }

// //           .header-text p {
// //             font-size: 8px;
// //           }

// //           .clinical-section {
// //             padding: 15px;

// //             margin-top: 13px;

// //             border-radius: 10px;
// //           }

// //           .section-header {
// //             margin-bottom: 14px;
// //           }

// //           .section-header h2 {
// //             font-size: 12px;
// //           }

// //           .section-header p {
// //             font-size: 7px;
// //           }

// //           .form-grid,
// //           .form-grid.two-columns {
// //             grid-template-columns: 1fr;

// //             gap: 12px;
// //           }

// //           .joint-grid,
// //           .problem-grid {
// //             gap: 6px;
// //           }

// //           .joint-chip,
// //           .problem-chip {
// //             font-size: 8px;
// //           }

// //           .action-row {
// //             flex-direction: column-reverse;

// //             align-items: stretch;
// //           }

// //           .back-button,
// //           .continue-button {
// //             width: 100%;

// //             height: 42px;
// //           }

// //           .bottom-note {
// //             align-items: flex-start;

// //             font-size: 7px;
// //           }

// //         }

// //         @media (max-width: 380px) {

// //           .clinical-container {
// //             padding: 15px 11px;
// //           }

// //           .header-icon {
// //             width: 34px;
// //             height: 34px;
// //           }

// //           .header-text h1 {
// //             font-size: 16px;
// //           }

// //           .info-banner {
// //             padding: 10px;
// //           }

// //           .clinical-section {
// //             padding: 13px;
// //           }

// //           .section-number {
// //             width: 27px;
// //             height: 27px;
// //           }

// //         }

// //         @media (prefers-reduced-motion: reduce) {

// //           .spinner {
// //             animation: none;
// //           }

// //           .clinical-section,
// //           .joint-chip,
// //           .problem-chip,
// //           .back-button,
// //           .continue-button {
// //             transition: none;
// //           }

// //         }

// //       `}</style>

// //     </div>
// //   );
// // };

// // export default HemophiliaDetailsScreen;



// import React, { useEffect, useState } from "react";
// import api from "../apiClient";
// import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";


// // =====================================================
// // DOCTOR NAME TRANSLATIONS
// // =====================================================
// // Doctor names are normally proper names, but the current
// // registered doctors are translated here because the UI
// // requirement is to display their names in Hindi/Marathi.
// //
// // The professional ID is used as the stable key so that
// // changing the doctor's name in the database does not
// // accidentally translate the wrong doctor.
// const DOCTOR_NAME_TRANSLATIONS = {
// //   hi: {
// //     DOC001: "डॉ. सुहानी सूर्यवंशी",
// //     DOC002: "डॉ. टेस्ट डॉक्टर",
// //     DOC003: "आयुष सोनी",
// //   },
// //   mr: {
// //     DOC001: "डॉ. सुहानी सूर्यवंशी",
// //     DOC002: "डॉ. टेस्ट डॉक्टर",
// //     DOC003: "आयुष सोनी",
// //   },
// };

// const getDoctorDisplayName = (doctor, language) => {
//   if (!doctor) return "";

//   if (language === "en") {
//     return doctor.fullName || "";
//   }

//   return (
//     DOCTOR_NAME_TRANSLATIONS[language]?.[doctor.professionalId] ||
//     doctor.fullName ||
//     ""
//   );
// };

// // =====================================================
// // MULTI-SELECT MEDICATION DROPDOWN
// // =====================================================

// const MedicationDropdown = ({ value, onChange, txt }) => {
//   const [open, setOpen] = useState(false);

//   const selectedValues = Array.isArray(value) ? value : [];

//   const options = [
//     {
//       value: "Tranexamic acid",
//       label: txt.medicationOptions.tranexamicAcid,
//     },
//     {
//       value: "Paracetamol / Acetaminophen",
//       label: txt.medicationOptions.paracetamol,
//     },
//     {
//       value: "Iron supplement",
//       label: txt.medicationOptions.iron,
//     },
//     {
//       value: "Pain medication",
//       label: txt.medicationOptions.painMedication,
//     },
//     {
//       value: "Other",
//       label: txt.medicationOptions.other,
//     },
//     {
//       value: "None",
//       label: txt.medicationOptions.none,
//     },
//   ];

//   const toggleOption = (optionValue) => {
//     let updated = [...selectedValues];

//     // "None" is mutually exclusive with every medication.
//     if (optionValue === "None") {
//       onChange(["None"]);
//       setOpen(false);
//       return;
//     }

//     // Remove None if a real medication is selected.
//     updated = updated.filter((item) => item !== "None");

//     if (updated.includes(optionValue)) {
//       updated = updated.filter((item) => item !== optionValue);
//     } else {
//       updated.push(optionValue);
//     }

//     onChange(updated);
//   };

//   const selectedLabels = options
//     .filter((option) => selectedValues.includes(option.value))
//     .map((option) => option.label);

//   return (
//     <div className="medication-dropdown">
//       <button
//         type="button"
//         className="medication-dropdown-button"
//         onClick={() => setOpen((prev) => !prev)}
//       >
//         <span className="medication-dropdown-value">
//           {selectedLabels.length > 0
//             ? selectedLabels.join(", ")
//             : txt.medicationOptions.placeholder}
//         </span>

//         <span className="medication-dropdown-arrow">
//           {open ? "⌃" : "⌄"}
//         </span>
//       </button>

//       {open && (
//         <>
//           <button
//             type="button"
//             className="medication-dropdown-overlay"
//             aria-label="Close medication dropdown"
//             onClick={() => setOpen(false)}
//           />

//           <div className="medication-dropdown-menu">
//             {options.map((option) => (
//               <label
//                 key={option.value}
//                 className="medication-option"
//               >
//                 <input
//                   type="checkbox"
//                   checked={selectedValues.includes(option.value)}
//                   onChange={() => toggleOption(option.value)}
//                 />

//                 <span>{option.label}</span>
//               </label>
//             ))}
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// const HemophiliaDetailsScreen = () => {
//   const navigate = useNavigate();
//   const { i18n } = useTranslation();

//   // =====================================================
//   // LANGUAGE
//   // =====================================================

//   const currentLanguage =
//     (i18n.language || "en").split("-")[0];

//   const language = ["en", "hi", "mr"].includes(
//     currentLanguage
//   )
//     ? currentLanguage
//     : "en";

//   // =====================================================
//   // TRANSLATIONS
//   // =====================================================

//   const TEXT = {
//     en: {

//       treatmentOptions: {
//     title: "Current Hemophilia Treatment",
//     label: "Current treatment",
//     placeholder: "Select current treatment",
//     none: "No current treatment",
//     factorVIII: "Factor VIII",
//     factorIX: "Factor IX",
//     extendedVIII: "Extended half-life Factor VIII",
//     extendedIX: "Extended half-life Factor IX",
//     emicizumab: "Emicizumab",
//     bypassingAgent: "Bypassing agent",
//     other: "Other",
//     otherPlaceholder: "Please specify other treatment",
//   },

//   medicationOptions: {
//     title: "Other Medications",
//     label: "Medications you are currently taking",
//     placeholder: "Select medications",
//     none: "None",
//     tranexamicAcid: "Tranexamic acid",
//     paracetamol: "Paracetamol / Acetaminophen",
//     iron: "Iron supplement",
//     painMedication: "Pain medication",
//     other: "Other",
//     otherPlaceholder: "Please specify other medication",
//   },
//       eyebrow: "PATIENT CLINICAL PROFILE",

//       title: "Hemophilia Clinical Details",

//       subtitle:
//         "Provide your existing clinical information to help personalize your care guidance.",

//       accurateTitle:
//         "Keep your information accurate",

//       accurateText:
//         "These details help the application understand your current hemophilia profile, bleeding pattern, physiotherapy, and care needs.",

//       classification:
//         "Clinical Classification",

//       classificationDesc:
//         "Basic information about your diagnosis",

//       type:
//         "Type of Hemophilia",

//       selectType:
//         "Select type",

//       typeA:
//         "Hemophilia A",

//       typeB:
//         "Hemophilia B",

//       typeC:
//         "Hemophilia C",

//       severity:
//         "Severity",

//       selectSeverity:
//         "Select severity",

//       mild:
//         "Mild",

//       moderate:
//         "Moderate",

//       severe:
//         "Severe",

//       ageDiagnosis:
//         "Age at Diagnosis",

//       enterAge:
//         "Enter age",

//       treatment:
//         "Treatment Profile",

//       treatmentDesc:
//         "Your current treatment and medications",

//       factorTherapy:
//         "Current Hemophilia Treatment",

//       factorPlaceholder:
//         "e.g. Factor VIII replacement",

//       medications:
//         "Medications You Are Currently Taking",

//       medicationsPlaceholder:
//         "Enter medications if any",

//       bleeding:
//         "Bleeding Pattern",

//       bleedingDesc:
//         "Information about your bleeding history and affected joints",

//       bleedingPattern:
//         "Bleeding Pattern",

//       selectPattern:
//         "Select bleeding pattern",

//       spontaneous:
//         "Spontaneous bleeding",

//       trauma:
//         "Bleeding after injury / trauma",

//       procedure:
//         "Bleeding after medical or dental procedure",

//       mixed:
//         "Mixed / more than one pattern",

//       other:
//         "Other",

//       affectedJoints:
//         "Affected Joints",

//       affectedJointsHelp:
//         "Select all joints that are currently affected or have experienced bleeding.",

//       selectedJoints:
//         "Selected joints",

//       noJointsSelected:
//         "No joints selected",

//       targetJoint:
//         "Target Joint",

//       selectTargetJoint:
//         "Select target joint",

//       none:
//         "None",

//       knee:
//         "Knee",

//       ankle:
//         "Ankle",

//       elbow:
//         "Elbow",

//       shoulder:
//         "Shoulder",

//       hip:
//         "Hip",

//       wrist:
//         "Wrist",

//       bleedFrequency:
//         "Bleed Frequency",

//       selectFrequency:
//         "Select frequency",

//       daily:
//         "Daily",

//       weekly:
//         "Weekly",

//       monthly:
//         "Monthly",

//       quarterly:
//         "Every few months",

//       rare:
//         "Rare",

//       lastBleed:
//         "Last Bleed Date",

//       otherDetails:
//         "Any Other Detail",

//       otherDetailsPlaceholder:
//         "Enter any other information you would like your care team to know",

//       physiotherapy:
//         "Physiotherapy & Exercise",

//       physiotherapyDesc:
//         "Tell us about your current or previous physiotherapy experience",

//       currentlyPhysio:
//         "Are you currently undergoing physiotherapy?",

//       selectOption:
//         "Select option",

//       yes:
//         "Yes",

//       no:
//         "No",

//       wherePhysio:
//         "Where are you taking physiotherapy?",

//       hospital:
//         "Hospital",

//       clinic:
//         "Clinic",

//       hemophiliaCentre:
//         "Hemophilia Centre",

//       home:
//         "At home",

//       sessions:
//         "How many sessions a week?",

//       onceWeek:
//         "Once a week",

//       twoThree:
//         "2–3 times a week",

//       moreThree:
//         "More than 3 sessions a week",

//       sessionDuration:
//         "How many minutes does each session last?",

//       lessTen:
//         "Less than 10 minutes",

//       tenTwenty:
//         "10–20 minutes",

//       twentyThirty:
//         "20–30 minutes",

//       moreThirty:
//         "More than 30 minutes",

//       affectedBodyPart:
//         "Which body part is most affected and currently being treated?",

//       treatmentReceived:
//         "What kind of treatment are you receiving?",

//       stretching:
//         "Stretching",

//       strengthening:
//         "Strengthening",

//       balance:
//         "Balance exercises",

//       generalFitness:
//         "General fitness",

//       jointMovement:
//         "Joint movement exercises",

//       painRelief:
//         "Exercises for pain relief",

//       equipment:
//         "Are you using any equipment for exercise?",

//       noEquipment:
//         "No equipment",

//       dumbbells:
//         "Dumbbells",

//       weightsCuffs:
//         "Weight cuffs",

//       theraband:
//         "Theraband",

//       yogaMat:
//         "Yoga mat",

//       otherEquipment:
//         "Other equipment",

//       helping:
//         "Is physiotherapy helping you?",

//       problems:
//         "Do you have any problem while exercising or after the session?",

//       noProblems:
//         "No problem",

//       pain:
//         "Pain",

//       newBleeding:
//         "New bleeding",

//       stiffness:
//         "Stiffness",

//       increasedSwelling:
//         "Increased swelling",

//       tired:
//         "Feeling tired",

//       previousPhysio:
//         "Have you used physiotherapy previously?",

//       stoppedWhen:
//         "When did you stop physiotherapy?",

//       stoppedWhy:
//         "Why did you stop physiotherapy?",

//       stoppedWhyPlaceholder:
//         "Select the main reason",

//       noNeed:
//         "No longer needed",

//       improved:
//         "Symptoms improved",

//       access:
//         "Difficulty accessing physiotherapy",

//       cost:
//         "Cost / financial reasons",

//       time:
//         "Time constraints",

//       doctor:
//         "Consulting Doctor",

//       doctorDesc:
//         "Select the doctor who is currently managing your hemophilia care.",

//       requestDoctorChange:
//         "Request Doctor Change",

//       requestDoctorChangeTitle:
//         "Request a Doctor Change",

//       requestDoctorChangeText:
//         "Your current doctor must release you before you can select another doctor.",

//       changeReason:
//         "Reason for changing doctor",

//       changeReasonPlaceholder:
//         "Please tell us why you would like to change your doctor",

//       cancel:
//         "Cancel",

//       sendRequest:
//         "Send Request",

//       sendingRequest:
//         "Sending...",

//       requestPending:
//         "Doctor change request is pending. Your current doctor needs to release you.",

//       selectDoctor:
//         "Select doctor",

//       noDoctors:
//         "No approved doctors available",

//       doctorLoading:
//         "Loading doctors...",

//       doctorId:
//         "Professional ID",

//       required:
//         "*",

//       mobility:
//         "Mobility Limitation",

//       selectMobility:
//         "Select mobility limitation",

//       noLimitation:
//         "None",

//       assistive:
//         "Assistive Devices",

//       assistivePlaceholder:
//         "Select an assistive device",

//       assistiveOptions: {
//         none: "None",
//         kneeBrace: "Knee Brace",
//         ankleBrace: "Ankle / Foot Brace",
//         elbowBrace: "Elbow Brace",
//         wristSupport: "Wrist Support",
//         cane: "Cane / Walking Stick",
//         crutches: "Crutches",
//         walker: "Walker",
//         wheelchair: "Wheelchair",
//         other: "Other",
//       },

//       errorRequired:
//         "Please complete all required fields.",

//       errorDoctor:
//         "Unable to load doctors. Please try again.",

//       errorSave:
//         "Failed to save details. Please try again.",

//       save:
//         "Save & Continue",

//       saving:
//         "Saving...",

//       back:
//         "Back",

//       secure:
//         "Your clinical information is stored securely and used to personalize your care guidance.",

//       previousPhysioSection:
//         "Previous Physiotherapy",

//       currentPhysioSection:
//         "Current Physiotherapy Details",
//     },

//     // ===================================================
//     // HINDI
//     // ===================================================

//     hi: {

//       treatmentOptions: {
//         title: "वर्तमान हीमोफीलिया उपचार",
//         label: "वर्तमान उपचार",
//         placeholder: "वर्तमान उपचार चुनें",
//         none: "कोई वर्तमान उपचार नहीं",
//         factorVIII: "फैक्टर VIII",
//         factorIX: "फैक्टर IX",
//         extendedVIII: "एक्सटेंडेड हाफ-लाइफ फैक्टर VIII",
//         extendedIX: "एक्सटेंडेड हाफ-लाइफ फैक्टर IX",
//         emicizumab: "एमिसिज़ुमैब",
//         bypassingAgent: "बायपासिंग एजेंट",
//         other: "अन्य",
//         otherPlaceholder: "अन्य उपचार लिखें",
//       },

//       medicationOptions: {
//         title: "अन्य दवाएँ",
//         label: "वर्तमान में ली जा रही दवाएँ",
//         placeholder: "दवाएँ चुनें",
//         none: "कोई नहीं",
//         tranexamicAcid: "ट्रानेक्सामिक एसिड",
//         paracetamol: "पैरासिटामोल / एसीटामिनोफेन",
//         iron: "आयरन सप्लीमेंट",
//         painMedication: "दर्द की दवा",
//         other: "अन्य",
//         otherPlaceholder: "अन्य दवा का नाम लिखें",
//       },

//       eyebrow: "रोगी की चिकित्सीय जानकारी",

//       title: "हीमोफीलिया चिकित्सीय विवरण",

//       subtitle:
//         "अपनी मौजूदा चिकित्सीय जानकारी दें ताकि आपकी देखभाल संबंधी मार्गदर्शन को बेहतर बनाया जा सके।",

//       accurateTitle:
//         "अपनी जानकारी सही रखें",

//       accurateText:
//         "ये विवरण आपके हीमोफीलिया प्रोफाइल, रक्तस्राव, फिजियोथेरेपी और देखभाल की जरूरतों को समझने में मदद करते हैं।",

//       classification:
//         "हीमोफीलिया जानकारी",

//       classificationDesc:
//         "आपके निदान की मूल जानकारी",

//       type:
//         "हीमोफीलिया का प्रकार",

//       selectType:
//         "प्रकार चुनें",

//       typeA:
//         "हीमोफीलिया A",

//       typeB:
//         "हीमोफीलिया B",

//       typeC:
//         "हीमोफीलिया C",

//       severity:
//         "गंभीरता",

//       selectSeverity:
//         "गंभीरता चुनें",

//       mild:
//         "हल्का",

//       moderate:
//         "मध्यम",

//       severe:
//         "गंभीर",

//       ageDiagnosis:
//         "निदान के समय उम्र",

//       enterAge:
//         "उम्र दर्ज करें",

//       treatment:
//         "उपचार जानकारी",

//       treatmentDesc:
//         "आपका वर्तमान उपचार और दवाएँ",

//       factorTherapy:
//         "वर्तमान हीमोफीलिया उपचार",

//       factorPlaceholder:
//         "जैसे Factor VIII replacement",

//       medications:
//         "वर्तमान में ली जा रही दवाएँ",

//       medicationsPlaceholder:
//         "यदि कोई दवा है तो दर्ज करें",

//       bleeding:
//         "रक्तस्राव का पैटर्न",

//       bleedingDesc:
//         "आपके रक्तस्राव के इतिहास और प्रभावित जोड़ों की जानकारी",

//       bleedingPattern:
//         "रक्तस्राव का पैटर्न",

//       selectPattern:
//         "पैटर्न चुनें",

//       spontaneous:
//         "बिना स्पष्ट कारण रक्तस्राव",

//       trauma:
//         "चोट के बाद रक्तस्राव",

//       procedure:
//         "चिकित्सीय या दंत प्रक्रिया के बाद रक्तस्राव",

//       mixed:
//         "मिश्रित / एक से अधिक पैटर्न",

//       other:
//         "अन्य",

//       affectedJoints:
//         "प्रभावित जोड़",

//       affectedJointsHelp:
//         "वर्तमान में प्रभावित या पहले रक्तस्राव वाले सभी जोड़ों को चुनें।",

//       selectedJoints:
//         "चयनित जोड़",

//       noJointsSelected:
//         "कोई जोड़ चयनित नहीं है",

//       targetJoint:
//         "टारगेट जोड़",

//       selectTargetJoint:
//         "टारगेट जोड़ चुनें",

//       none:
//         "कोई नहीं",

//       knee:
//         "घुटना",

//       ankle:
//         "टखना",

//       elbow:
//         "कोहनी",

//       shoulder:
//         "कंधा",

//       hip:
//         "कूल्हा",

//       wrist:
//         "कलाई",

//       bleedFrequency:
//         "रक्तस्राव की आवृत्ति",

//       selectFrequency:
//         "आवृत्ति चुनें",

//       daily:
//         "प्रतिदिन",

//       weekly:
//         "साप्ताहिक",

//       monthly:
//         "मासिक",

//       quarterly:
//         "हर कुछ महीनों में",

//       rare:
//         "बहुत कम",

//       lastBleed:
//         "अंतिम रक्तस्राव की तारीख",

//       otherDetails:
//         "अन्य जानकारी",

//       otherDetailsPlaceholder:
//         "कोई अन्य जानकारी दर्ज करें जो आपकी देखभाल टीम को पता होनी चाहिए",

//       physiotherapy:
//         "फिजियोथेरेपी और व्यायाम",

//       physiotherapyDesc:
//         "अपनी वर्तमान या पिछली फिजियोथेरेपी के बारे में बताएं",

//       currentlyPhysio:
//         "क्या आप वर्तमान में फिजियोथेरेपी करवा रहे हैं?",

//       selectOption:
//         "विकल्प चुनें",

//       yes:
//         "हाँ",

//       no:
//         "नहीं",

//       wherePhysio:
//         "आप फिजियोथेरेपी कहाँ करवा रहे हैं?",

//       hospital:
//         "अस्पताल",

//       clinic:
//         "क्लिनिक",

//       hemophiliaCentre:
//         "हीमोफीलिया केंद्र",

//       home:
//         "घर पर",

//       sessions:
//         "सप्ताह में कितने सत्र?",

//       onceWeek:
//         "सप्ताह में एक बार",

//       twoThree:
//         "सप्ताह में 2–3 बार",

//       moreThree:
//         "सप्ताह में 3 से अधिक बार",

//       sessionDuration:
//         "प्रत्येक सत्र कितने मिनट का होता है?",

//       lessTen:
//         "10 मिनट से कम",

//       tenTwenty:
//         "10–20 मिनट",

//       twentyThirty:
//         "20–30 मिनट",

//       moreThirty:
//         "30 मिनट से अधिक",

//       affectedBodyPart:
//         "सबसे अधिक प्रभावित और वर्तमान में उपचारित शरीर का भाग कौन सा है?",

//       treatmentReceived:
//         "आप किस प्रकार का उपचार प्राप्त कर रहे हैं?",

//       stretching:
//         "स्ट्रेचिंग",

//       strengthening:
//         "मांसपेशियों को मजबूत करने के व्यायाम",

//       balance:
//         "संतुलन व्यायाम",

//       generalFitness:
//         "सामान्य फिटनेस",

//       jointMovement:
//         "जोड़ों की गति के व्यायाम",

//       painRelief:
//         "दर्द से राहत के व्यायाम",

//       equipment:
//         "क्या आप व्यायाम के लिए किसी उपकरण का उपयोग करते हैं?",

//       noEquipment:
//         "कोई उपकरण नहीं",

//       dumbbells:
//         "डम्बल",

//       weightsCuffs:
//         "वेट कफ",

//       theraband:
//         "थेराबैंड",

//       yogaMat:
//         "योगा मैट",

//       otherEquipment:
//         "अन्य उपकरण",

//       helping:
//         "क्या फिजियोथेरेपी से आपको लाभ हो रहा है?",

//       problems:
//         "व्यायाम करते समय या सत्र के बाद कोई समस्या होती है?",

//       noProblems:
//         "कोई समस्या नहीं",

//       pain:
//         "दर्द",

//       newBleeding:
//         "नया रक्तस्राव",

//       stiffness:
//         "जकड़न",

//       increasedSwelling:
//         "सूजन बढ़ना",

//       tired:
//         "थकान महसूस होना",

//       previousPhysio:
//         "क्या आपने पहले फिजियोथेरेपी का उपयोग किया है?",

//       stoppedWhen:
//         "आपने फिजियोथेरेपी कब बंद की?",

//       stoppedWhy:
//         "आपने फिजियोथेरेपी क्यों बंद की?",

//       stoppedWhyPlaceholder:
//         "मुख्य कारण चुनें",

//       noNeed:
//         "अब आवश्यकता नहीं थी",

//       improved:
//         "लक्षणों में सुधार हुआ",

//       access:
//         "फिजियोथेरेपी तक पहुँचने में कठिनाई",

//       cost:
//         "खर्च / आर्थिक कारण",

//       time:
//         "समय की समस्या",

//       doctor:
//         "परामर्श देने वाले डॉक्टर",

//       doctorDesc:
//         "उस डॉक्टर को चुनें जो वर्तमान में आपकी हीमोफीलिया देखभाल कर रहे हैं।",

//       requestDoctorChange:
//         "डॉक्टर बदलने का अनुरोध करें",

//       requestDoctorChangeTitle:
//         "डॉक्टर बदलने का अनुरोध",

//       requestDoctorChangeText:
//         "दूसरे डॉक्टर को चुनने से पहले आपके वर्तमान डॉक्टर को आपको रिलीज़ करना होगा।",

//       changeReason:
//         "डॉक्टर बदलने का कारण",

//       changeReasonPlaceholder:
//         "कृपया बताएं कि आप डॉक्टर क्यों बदलना चाहते हैं",

//       cancel:
//         "रद्द करें",

//       sendRequest:
//         "अनुरोध भेजें",

//       sendingRequest:
//         "भेजा जा रहा है...",

//       requestPending:
//         "डॉक्टर बदलने का अनुरोध लंबित है। आपके वर्तमान डॉक्टर को आपको रिलीज़ करना होगा।",

//       selectDoctor:
//         "डॉक्टर चुनें",

//       noDoctors:
//         "कोई स्वीकृत डॉक्टर उपलब्ध नहीं है",

//       doctorLoading:
//         "डॉक्टर लोड हो रहे हैं...",

//       doctorId:
//         "प्रोफेशनल आईडी",

//       required:
//         "*",

//       mobility:
//         "चलने-फिरने में कठिनाई",

//       selectMobility:
//         "चलने-फिरने की कठिनाई चुनें",

//       noLimitation:
//         "कोई कठिनाई नहीं",

//       assistive:
//         "सहायक उपकरण",

//       assistivePlaceholder:
//         "सहायक उपकरण चुनें",

//       assistiveOptions: {
//         none: "कोई उपकरण नहीं",
//         kneeBrace: "घुटने का ब्रेस",
//         ankleBrace: "टखने / पैर का ब्रेस",
//         elbowBrace: "कोहनी का ब्रेस",
//         wristSupport: "कलाई का सहारा",
//         cane: "छड़ी / चलने की छड़ी",
//         crutches: "बैसाखी",
//         walker: "वॉकर",
//         wheelchair: "व्हीलचेयर",
//         other: "अन्य",
//       },

//       errorRequired:
//         "कृपया सभी आवश्यक जानकारी पूरी करें।",

//       errorDoctor:
//         "डॉक्टरों की सूची लोड नहीं हो सकी। कृपया फिर प्रयास करें।",

//       errorSave:
//         "जानकारी सेव नहीं हो सकी। कृपया फिर प्रयास करें।",

//       save:
//         "सेव करें और आगे बढ़ें",

//       saving:
//         "सेव हो रहा है...",

//       back:
//         "वापस",

//       secure:
//         "आपकी चिकित्सीय जानकारी सुरक्षित रूप से संग्रहीत की जाती है और आपकी देखभाल संबंधी मार्गदर्शन को व्यक्तिगत बनाने के लिए उपयोग की जाती है।",

//       previousPhysioSection:
//         "पिछली फिजियोथेरेपी",

//       currentPhysioSection:
//         "वर्तमान फिजियोथेरेपी विवरण",
//     },

//     // ===================================================
//     // MARATHI
//     // ===================================================

//     mr: {

//       treatmentOptions: {
//         title: "सध्याचा हिमोफिलिया उपचार",
//         label: "सध्याचा उपचार",
//         placeholder: "सध्याचा उपचार निवडा",
//         none: "सध्या कोणताही उपचार नाही",
//         factorVIII: "फॅक्टर VIII",
//         factorIX: "फॅक्टर IX",
//         extendedVIII: "एक्स्टेंडेड हाफ-लाइफ फॅक्टर VIII",
//         extendedIX: "एक्स्टेंडेड हाफ-लाइफ फॅक्टर IX",
//         emicizumab: "एमिसिझुमॅब",
//         bypassingAgent: "बायपासिंग एजंट",
//         other: "इतर",
//         otherPlaceholder: "इतर उपचार लिहा",
//       },

//       medicationOptions: {
//         title: "इतर औषधे",
//         label: "सध्या घेत असलेली औषधे",
//         placeholder: "औषधे निवडा",
//         none: "एकही नाही",
//         tranexamicAcid: "ट्रॅनेक्सॅमिक अॅसिड",
//         paracetamol: "पॅरासिटामॉल / अॅसिटामिनोफेन",
//         iron: "आयर्न सप्लिमेंट",
//         painMedication: "वेदनेवरील औषध",
//         other: "इतर",
//         otherPlaceholder: "इतर औषधाचे नाव लिहा",
//       },

//       eyebrow: "रुग्णाची वैद्यकीय माहिती",

//       title: "हिमोफिलिया वैद्यकीय तपशील",

//       subtitle:
//         "तुमच्या काळजीचे मार्गदर्शन वैयक्तिक करण्यासाठी तुमची सध्याची वैद्यकीय माहिती द्या.",

//       accurateTitle:
//         "तुमची माहिती अचूक ठेवा",

//       accurateText:
//         "ही माहिती तुमची हिमोफिलिया स्थिती, रक्तस्त्रावाचा नमुना, फिजिओथेरपी आणि काळजीच्या गरजा समजून घेण्यास मदत करते.",

//       classification:
//         "हिमोफिलिया माहिती",

//       classificationDesc:
//         "तुमच्या निदानाची मूलभूत माहिती",

//       type:
//         "हिमोफिलियाचा प्रकार",

//       selectType:
//         "प्रकार निवडा",

//       typeA:
//         "हिमोफिलिया A",

//       typeB:
//         "हिमोफिलिया B",

//       typeC:
//         "हिमोफिलिया C",

//       severity:
//         "तीव्रता",

//       selectSeverity:
//         "तीव्रता निवडा",

//       mild:
//         "सौम्य",

//       moderate:
//         "मध्यम",

//       severe:
//         "गंभीर",

//       ageDiagnosis:
//         "निदानाच्या वेळी वय",

//       enterAge:
//         "वय प्रविष्ट करा",

//       treatment:
//         "उपचाराची माहिती",

//       treatmentDesc:
//         "तुमचे सध्याचे उपचार आणि औषधे",

//       factorTherapy:
//         "सध्याचा हिमोफिलिया उपचार",

//       factorPlaceholder:
//         "उदा. Factor VIII replacement",

//       medications:
//         "सध्या घेत असलेली औषधे",

//       medicationsPlaceholder:
//         "औषधे असल्यास प्रविष्ट करा",

//       bleeding:
//         "रक्तस्त्रावाचा नमुना",

//       bleedingDesc:
//         "तुमच्या रक्तस्त्रावाचा इतिहास आणि प्रभावित सांध्यांची माहिती",

//       bleedingPattern:
//         "रक्तस्त्रावाचा नमुना",

//       selectPattern:
//         "नमुना निवडा",

//       spontaneous:
//         "स्वतःहून होणारा रक्तस्त्राव",

//       trauma:
//         "इजा / दुखापतीनंतर रक्तस्त्राव",

//       procedure:
//         "वैद्यकीय किंवा दंत प्रक्रियेनंतर रक्तस्त्राव",

//       mixed:
//         "मिश्र / एकापेक्षा जास्त नमुने",

//       other:
//         "इतर",

//       affectedJoints:
//         "प्रभावित सांधे",

//       affectedJointsHelp:
//         "सध्या प्रभावित असलेले किंवा पूर्वी रक्तस्त्राव झालेले सर्व सांधे निवडा.",

//       selectedJoints:
//         "निवडलेले सांधे",

//       noJointsSelected:
//         "कोणताही सांधा निवडलेला नाही",

//       targetJoint:
//         "टार्गेट सांधा",

//       selectTargetJoint:
//         "टार्गेट सांधा निवडा",

//       none:
//         "कोणताही नाही",

//       knee:
//         "गुडघा",

//       ankle:
//         "घोटा",

//       elbow:
//         "कोपर",

//       shoulder:
//         "खांदा",

//       hip:
//         "नितंब",

//       wrist:
//         "मनगट",

//       bleedFrequency:
//         "रक्तस्त्रावाची वारंवारता",

//       selectFrequency:
//         "वारंवारता निवडा",

//       daily:
//         "दररोज",

//       weekly:
//         "आठवड्यातून",

//       monthly:
//         "मासिक",

//       quarterly:
//         "दर काही महिन्यांनी",

//       rare:
//         "क्वचित",

//       lastBleed:
//         "शेवटच्या रक्तस्त्रावाची तारीख",

//       otherDetails:
//         "इतर माहिती",

//       otherDetailsPlaceholder:
//         "तुमच्या काळजीच्या टीमला माहीत असावी अशी इतर माहिती प्रविष्ट करा",

//       physiotherapy:
//         "फिजिओथेरपी आणि व्यायाम",

//       physiotherapyDesc:
//         "तुमच्या सध्याच्या किंवा पूर्वीच्या फिजिओथेरपीबद्दल माहिती द्या",

//       currentlyPhysio:
//         "तुम्ही सध्या फिजिओथेरपी घेत आहात का?",

//       selectOption:
//         "पर्याय निवडा",

//       yes:
//         "होय",

//       no:
//         "नाही",

//       wherePhysio:
//         "तुम्ही फिजिओथेरपी कुठे घेत आहात?",

//       hospital:
//         "रुग्णालय",

//       clinic:
//         "क्लिनिक",

//       hemophiliaCentre:
//         "हिमोफिलिया केंद्र",

//       home:
//         "घरी",

//       sessions:
//         "आठवड्यात किती सत्रे?",

//       onceWeek:
//         "आठवड्यातून एकदा",

//       twoThree:
//         "आठवड्यातून 2–3 वेळा",

//       moreThree:
//         "आठवड्यातून 3 पेक्षा जास्त वेळा",

//       sessionDuration:
//         "प्रत्येक सत्र किती मिनिटांचे असते?",

//       lessTen:
//         "10 मिनिटांपेक्षा कमी",

//       tenTwenty:
//         "10–20 मिनिटे",

//       twentyThirty:
//         "20–30 मिनिटे",

//       moreThirty:
//         "30 मिनिटांपेक्षा जास्त",

//       affectedBodyPart:
//         "सध्या उपचार घेत असलेला सर्वाधिक प्रभावित शरीराचा भाग कोणता?",

//       treatmentReceived:
//         "तुम्ही कोणत्या प्रकारचे उपचार घेत आहात?",

//       stretching:
//         "स्ट्रेचिंग",

//       strengthening:
//         "स्नायू मजबूत करण्याचे व्यायाम",

//       balance:
//         "संतुलन व्यायाम",

//       generalFitness:
//         "सामान्य फिटनेस",

//       jointMovement:
//         "सांध्यांच्या हालचालीचे व्यायाम",

//       painRelief:
//         "वेदना कमी करण्यासाठी व्यायाम",

//       equipment:
//         "तुम्ही व्यायामासाठी कोणतेही उपकरण वापरता का?",

//       noEquipment:
//         "कोणतेही उपकरण नाही",

//       dumbbells:
//         "डम्बेल्स",

//       weightsCuffs:
//         "वेट कफ",

//       theraband:
//         "थेराबँड",

//       yogaMat:
//         "योगा मॅट",

//       otherEquipment:
//         "इतर उपकरण",

//       helping:
//         "फिजिओथेरपीमुळे तुम्हाला फायदा होत आहे का?",

//       problems:
//         "व्यायाम करताना किंवा सत्रानंतर काही समस्या होतात का?",

//       noProblems:
//         "कोणतीही समस्या नाही",

//       pain:
//         "वेदना",

//       newBleeding:
//         "नवीन रक्तस्त्राव",

//       stiffness:
//         "ताठरपणा",

//       increasedSwelling:
//         "सूज वाढणे",

//       tired:
//         "थकवा जाणवणे",

//       previousPhysio:
//         "तुम्ही यापूर्वी फिजिओथेरपी घेतली आहे का?",

//       stoppedWhen:
//         "तुम्ही फिजिओथेरपी कधी थांबवली?",

//       stoppedWhy:
//         "तुम्ही फिजिओथेरपी का थांबवली?",

//       stoppedWhyPlaceholder:
//         "मुख्य कारण निवडा",

//       noNeed:
//         "आता गरज नव्हती",

//       improved:
//         "लक्षणांमध्ये सुधारणा झाली",

//       access:
//         "फिजिओथेरपी मिळवण्यात अडचण",

//       cost:
//         "खर्च / आर्थिक कारणे",

//       time:
//         "वेळेची समस्या",

//       doctor:
//         "सल्ला देणारे डॉक्टर",

//       doctorDesc:
//         "सध्या तुमच्या हिमोफिलिया उपचाराचे व्यवस्थापन करणारे डॉक्टर निवडा.",

//       requestDoctorChange:
//         "डॉक्टर बदलण्याची विनंती करा",

//       requestDoctorChangeTitle:
//         "डॉक्टर बदलण्याची विनंती",

//       requestDoctorChangeText:
//         "दुसरा डॉक्टर निवडण्यापूर्वी तुमच्या सध्याच्या डॉक्टरांनी तुम्हाला रिलीज करणे आवश्यक आहे.",

//       changeReason:
//         "डॉक्टर बदलण्याचे कारण",

//       changeReasonPlaceholder:
//         "तुम्हाला डॉक्टर का बदलायचे आहेत ते कृपया सांगा",

//       cancel:
//         "रद्द करा",

//       sendRequest:
//         "विनंती पाठवा",

//       sendingRequest:
//         "पाठवत आहे...",

//       requestPending:
//         "डॉक्टर बदलण्याची विनंती प्रलंबित आहे. तुमच्या सध्याच्या डॉक्टरांनी तुम्हाला रिलीज करणे आवश्यक आहे.",

//       selectDoctor:
//         "डॉक्टर निवडा",

//       noDoctors:
//         "कोणतेही मंजूर डॉक्टर उपलब्ध नाहीत",

//       doctorLoading:
//         "डॉक्टर लोड होत आहेत...",

//       doctorId:
//         "प्रोफेशनल आयडी",

//       required:
//         "*",

//       mobility:
//         "हालचालींमध्ये मर्यादा",

//       selectMobility:
//         "हालचालींची मर्यादा निवडा",

//       noLimitation:
//         "कोणतीही मर्यादा नाही",

//       assistive:
//         "सहाय्यक उपकरणे",

//       assistivePlaceholder:
//         "सहाय्यक उपकरण निवडा",

//       assistiveOptions: {
//         none: "कोणतेही उपकरण नाही",
//         kneeBrace: "गुडघ्याचा ब्रेस",
//         ankleBrace: "घोटा / पायाचा ब्रेस",
//         elbowBrace: "कोपराचा ब्रेस",
//         wristSupport: "मनगटाचा आधार",
//         cane: "काठी / चालण्याची काठी",
//         crutches: "कुबड्या",
//         walker: "वॉकर",
//         wheelchair: "व्हीलचेअर",
//         other: "इतर",
//       },

//       errorRequired:
//         "कृपया सर्व आवश्यक माहिती पूर्ण करा.",

//       errorDoctor:
//         "डॉक्टरांची यादी लोड करता आली नाही. कृपया पुन्हा प्रयत्न करा.",

//       errorSave:
//         "माहिती सेव्ह करता आली नाही. कृपया पुन्हा प्रयत्न करा.",

//       save:
//         "सेव्ह करा आणि पुढे जा",

//       saving:
//         "सेव्ह होत आहे...",

//       back:
//         "मागे",

//       secure:
//         "तुमची वैद्यकीय माहिती सुरक्षितपणे साठवली जाते आणि तुमचे काळजी मार्गदर्शन वैयक्तिक करण्यासाठी वापरली जाते.",

//       previousPhysioSection:
//         "पूर्वीची फिजिओथेरपी",

//       currentPhysioSection:
//         "सध्याचे फिजिओथेरपी तपशील",
//     }
  
//   };

//   const txt =
//     TEXT[language] || TEXT.en;

//   // =====================================================
//   // FORM
//   // =====================================================

//   const [form, setForm] = useState({
//   type: "",
//   severity: "",
//   ageAtDiagnosis: "",

//   familyHistory: "",
//   geneticTestingDone: "",

//   currentFactorTherapy: "",
//   otherCurrentTreatment: "",

//   otherMedications: [],
//   otherMedicationDetails: "",

//   bleedingPattern: "",
//   jointsAffected: [],
//   targetJoint: "",
//   bleedFrequency: "",
//   lastBleedDate: "",
//   otherBleedingDetails: "",

//   underPhysiotherapy: "",
//   physiotherapyLocation: "",
//   physiotherapySessions: "",
//   physiotherapyDuration: "",
//   physiotherapyBodyPart: "",
//   physiotherapyTreatment: "",
//   physiotherapyEquipment: "",
//   physiotherapyHelping: "",
//   physiotherapyProblems: [],

//   previousPhysiotherapy: "",
//   physiotherapyStoppedDate: "",
//   physiotherapyStoppedReason: "",

//   mobilityLimitation: "",
//   assistiveDevices: "",

//   consultingDoctorId: "",
// });

//   // =====================================================
//   // DOCTORS
//   // =====================================================

//   const [doctors, setDoctors] =
//     useState([]);

//   const [doctorsLoading, setDoctorsLoading] =
//     useState(true);

//   // =====================================================
//   // UI STATE
//   // =====================================================

//   const [loading, setLoading] =
//     useState(false);

//   const [error, setError] =
//     useState("");

//     // =====================================================
// // DOCTOR ASSIGNMENT / CHANGE REQUEST STATE
// // =====================================================

// const [doctorStatusLoading, setDoctorStatusLoading] =
//   useState(true);

// // IMPORTANT:
// // This becomes true only when a doctor assignment already exists
// // in the saved patient record, or after Save & Continue succeeds.
// // Merely selecting a doctor in the dropdown must NOT lock it.
// const [doctorAssignmentSaved, setDoctorAssignmentSaved] =
//   useState(false);

// const [pendingDoctorChangeRequest, setPendingDoctorChangeRequest] =
//   useState(null);

// const [changeRequestModalOpen, setChangeRequestModalOpen] =
//   useState(false);

// const [changeRequestReason, setChangeRequestReason] =
//   useState("");

// const [changeRequestLoading, setChangeRequestLoading] =
//   useState(false);

//   // =====================================================
//   // LOAD APPROVED DOCTORS
//   // =====================================================

//   useEffect(() => {
//     const loadDoctors = async () => {
//       try {
//         setDoctorsLoading(true);

        
//           const response =
//             await api.get(
//               `/hemophilia-details/doctors?language=${language}`
//             );

//         const list =
//           response.data?.doctors || [];

//         setDoctors(
//           Array.isArray(list)
//             ? list
//             : []
//         );
//       } catch (err) {
//         console.error(
//           "Failed to load doctors:",
//           err
//         );

//         setError(
//           txt.errorDoctor
//         );
//       } finally {
//         setDoctorsLoading(false);
//       }
//     };

//     loadDoctors();
//   }, [language]);

//   // =====================================================
// // LOAD CURRENT DOCTOR ASSIGNMENT
// // =====================================================

// useEffect(() => {
//   const loadDoctorStatus = async () => {
//     try {
//       setDoctorStatusLoading(true);

//       const response =
//         await api.get(
//           "/hemophilia-details/doctor-change-status"
//         );

//       const assignedDoctor =
//         response.data?.assignedDoctor || null;

//       const pendingRequest =
//         response.data?.pendingRequest || null;

//       // -----------------------------------------------
//       // RESTORE CURRENT DOCTOR
//       // -----------------------------------------------

//       setForm((prev) => ({
//         ...prev,

//         consultingDoctorId:
//           assignedDoctor?._id || "",
//       }));

//       // Only a doctor that already exists in the saved record
//       // should make the field read-only.
//       setDoctorAssignmentSaved(
//         Boolean(assignedDoctor?._id)
//       );

//       // -----------------------------------------------
//       // RESTORE PENDING REQUEST
//       // -----------------------------------------------

//       setPendingDoctorChangeRequest(
//         pendingRequest
//       );
//     } catch (err) {
//       console.error(
//         "Failed to load doctor assignment status:",
//         err
//       );

//       setError(
//         err.response?.data?.message ||
//           "Unable to load your doctor assignment."
//       );
//     } finally {
//       setDoctorStatusLoading(false);
//     }
//   };

//   loadDoctorStatus();
// }, []);

// // =====================================================
// // DOCTOR ASSIGNMENT HELPERS
// // =====================================================

// // Selecting a doctor in the dropdown changes form.consultingDoctorId
// // immediately, but that does NOT mean the assignment is saved.
// const doctorAssigned =
//   doctorAssignmentSaved;

// const doctorChangePending =
//   Boolean(pendingDoctorChangeRequest);

// // Before the first Save & Continue:
// //   doctorStatusLoading -> false
// //   doctorsLoading -> false
// //   doctorAssignmentSaved -> false
// // therefore the dropdown stays editable.
// //
// // After the first successful Save & Continue, or when an already-saved
// // assignment is loaded from the backend, the field becomes locked.
// const doctorFieldLocked =
//   doctorStatusLoading ||
//   doctorsLoading ||
//   (
//     doctorAssignmentSaved &&
//     pendingDoctorChangeRequest?.status !== "RELEASED"
//   );


//   // =====================================================
// // REQUEST DOCTOR CHANGE
// // =====================================================

// const handleDoctorChangeRequest =
//   async () => {
//     setError("");

//     try {
//       setChangeRequestLoading(true);

//       const response =
//         await api.post(
//           "/hemophilia-details/doctor-change-request",
//           {
//             reason:
//               changeRequestReason.trim(),
//           }
//         );

//       setPendingDoctorChangeRequest(
//         response.data?.request || {
//           status: "PENDING",
//         }
//       );

//       setChangeRequestReason("");

//       setChangeRequestModalOpen(false);
//     } catch (err) {
//       console.error(
//         "Doctor change request failed:",
//         err
//       );

//       setError(
//         err.response?.data?.message ||
//           "Failed to submit doctor change request."
//       );
//     } finally {
//       setChangeRequestLoading(false);
//     }
//   };
//   // =====================================================
//   // UPDATE FIELD
//   // =====================================================

//   const updateField = (
//     field,
//     value
//   ) => {
//     setForm((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   // =====================================================
//   // TOGGLE JOINT
//   // =====================================================

//   const toggleJoint = (
//     joint
//   ) => {
//     setForm((prev) => {
//       const exists =
//         prev.jointsAffected.includes(
//           joint
//         );

//       return {
//         ...prev,

//         jointsAffected: exists
//           ? prev.jointsAffected.filter(
//               (j) => j !== joint
//             )
//           : [
//               ...prev.jointsAffected,
//               joint,
//             ],
//       };
//     });
//   };

//   // =====================================================
//   // TOGGLE PHYSIO PROBLEM
//   // =====================================================

//   const togglePhysioProblem =
//     (problem) => {
//       setForm((prev) => {
//         const exists =
//           prev.physiotherapyProblems.includes(
//             problem
//           );

//         return {
//           ...prev,

//           physiotherapyProblems:
//             exists
//               ? prev.physiotherapyProblems.filter(
//                   (p) => p !== problem
//                 )
//               : [
//                   ...prev.physiotherapyProblems,
//                   problem,
//                 ],
//         };
//       });
//     };

//   // =====================================================
//   // REQUIRED VALIDATION
//   // =====================================================

//   const handleSubmit = async () => {
//     setError("");

//     if (
//       !form.type ||
//       !form.severity ||
//       !form.bleedingPattern ||
//       !form.bleedFrequency ||
//       !form.consultingDoctorId ||
//       form.underPhysiotherapy === ""
//     ) {
//       setError(
//         txt.errorRequired
//       );

//       window.scrollTo({
//         top: 0,
//         behavior: "smooth",
//       });

//       return;
//     }

//     // -----------------------------------------------
//     // IF CURRENTLY IN PHYSIOTHERAPY
//     // -----------------------------------------------

//     if (
//       form.underPhysiotherapy === true
//     ) {
//       if (
//         !form.physiotherapyLocation ||
//         !form.physiotherapySessions ||
//         !form.physiotherapyDuration ||
//         !form.physiotherapyBodyPart ||
//         !form.physiotherapyTreatment ||
//         !form.physiotherapyEquipment ||
//         !form.physiotherapyHelping
//       ) {
//         setError(
//           txt.errorRequired
//         );

//         window.scrollTo({
//           top: 0,
//           behavior: "smooth",
//         });

//         return;
//       }
//     }

//     // -----------------------------------------------
//     // IF NOT CURRENTLY IN PHYSIO
//     // -----------------------------------------------

//     if (
//       form.underPhysiotherapy === false &&
//       form.previousPhysiotherapy === ""
//     ) {
//       setError(
//         txt.errorRequired
//       );

//       window.scrollTo({
//         top: 0,
//         behavior: "smooth",
//       });

//       return;
//     }

//     if (
//       form.underPhysiotherapy === false &&
//       form.previousPhysiotherapy === true &&
//       (
//         !form.physiotherapyStoppedDate ||
//         !form.physiotherapyStoppedReason
//       )
//     ) {
//       setError(
//         txt.errorRequired
//       );

//       window.scrollTo({
//         top: 0,
//         behavior: "smooth",
//       });

//       return;
//     }

//     setLoading(true);

//     try {
//       await api.post(
//         "/hemophilia-details",
//         form
//       );

//       // Generate persistent ML exercise recommendations after the
//       // clinical details have been successfully saved.
//       // A recommendation is only created once and starts as
//       // PENDING_DOCTOR_REVIEW.
//       try {
//         await api.post("/exercise-recommendations/generate");
//       } catch (recommendationError) {
//         console.error(
//           "Exercise recommendation generation failed:",
//           recommendationError
//         );
//         // Clinical details were already saved, so do not block
//         // the patient from continuing through the care flow.
//       }

//       // The assignment is now actually persisted in the database.
//       // Only NOW should the consulting-doctor field become locked.
//       setDoctorAssignmentSaved(
//         Boolean(form.consultingDoctorId)
//       );

//       // =============================================
//       // NEXT STEP
//       // =============================================
//       // After saving the clinical details and generating the
//       // exercise recommendations, take the patient to the
//       // Exercise Recommendation / Exercise Plan screen.
//       // Do NOT send the patient directly to Care Guidance.

//       navigate("/exercise-plan");

//     } catch (err) {
//       console.error(
//         "Failed to save hemophilia details:",
//         err
//       );

//       setError(
//         err.response?.data?.message ||
//           txt.errorSave
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // =====================================================
//   // SECTION STATUS
//   // =====================================================

//   const classificationDone =
//     form.type &&
//     form.severity;

//   const bleedingDone =
//     form.bleedingPattern &&
//     form.bleedFrequency;

//   const physioDone =
//     form.underPhysiotherapy !== "";

//   // =====================================================
//   // JOINTS
//   // =====================================================

//   const joints = [
//     {
//       value: "Knee",
//       label: txt.knee,
//     },
//     {
//       value: "Ankle",
//       label: txt.ankle,
//     },
//     {
//       value: "Elbow",
//       label: txt.elbow,
//     },
//     {
//       value: "Shoulder",
//       label: txt.shoulder,
//     },
//     {
//       value: "Hip",
//       label: txt.hip,
//     },
//     {
//       value: "Wrist",
//       label: txt.wrist,
//     },
//   ];

//   return (
//     <div className="clinical-page">

//       <div className="clinical-container">

//         {/* =================================================
//             HEADER
//         ================================================= */}

//         <div className="clinical-header">

//           <div className="header-icon">
//             +
//           </div>

//           <div className="header-text">

//             <span className="header-eyebrow">
//               {txt.eyebrow}
//             </span>

//             <h1>
//               {txt.title}
//             </h1>

//             <p>
//               {txt.subtitle}
//             </p>

//           </div>

//         </div>


//         {/* =================================================
//             INFO
//         ================================================= */}

//         <div className="info-banner">

//           <div className="info-banner-icon">
//             i
//           </div>

//           <div>

//             <strong>
//               {txt.accurateTitle}
//             </strong>

//             <p>
//               {txt.accurateText}
//             </p>

//           </div>

//         </div>


//         {/* =================================================
//             SECTION 01
//         ================================================= */}

//         <div
//           className={`clinical-section ${
//             classificationDone
//               ? "section-complete"
//               : ""
//           }`}
//         >

//           <div className="section-header">

//             <div className="section-number">
//               01
//             </div>

//             <div>

//               <h2>
//                 {txt.classification}
//               </h2>

//               <p>
//                 {txt.classificationDesc}
//               </p>

//             </div>

//             {classificationDone && (
//               <div className="completion-mark">
//                 ✓
//               </div>
//             )}

//           </div>


//           <div className="form-grid">

//             {/* TYPE */}

//             <div className="field">

//               <label>
//                 {txt.type}
//                 <span className="required">
//                   {txt.required}
//                 </span>
//               </label>

//               <select
//                 value={form.type}
//                 onChange={(e) =>
//                   updateField(
//                     "type",
//                     e.target.value
//                   )
//                 }
//               >

//                 <option value="">
//                   {txt.selectType}
//                 </option>

//                 <option value="A">
//                   {txt.typeA}
//                 </option>

//                 <option value="B">
//                   {txt.typeB}
//                 </option>

//                 <option value="C">
//                   {txt.typeC}
//                 </option>

//               </select>

//             </div>


//             {/* SEVERITY */}

//             <div className="field">

//               <label>
//                 {txt.severity}
//                 <span className="required">
//                   {txt.required}
//                 </span>
//               </label>

//               <select
//                 value={form.severity}
//                 onChange={(e) =>
//                   updateField(
//                     "severity",
//                     e.target.value
//                   )
//                 }
//               >

//                 <option value="">
//                   {txt.selectSeverity}
//                 </option>

//                 <option value="Mild">
//                   {txt.mild}
//                 </option>

//                 <option value="Moderate">
//                   {txt.moderate}
//                 </option>

//                 <option value="Severe">
//                   {txt.severe}
//                 </option>

//               </select>

//             </div>


//             {/* AGE */}

//             <div className="field">

//               <label>
//                 {txt.ageDiagnosis}
//               </label>

//               <input
//                 type="number"
//                 min="0"
//                 max="120"
//                 placeholder={
//                   txt.enterAge
//                 }
//                 value={
//                   form.ageAtDiagnosis
//                 }
//                 onChange={(e) =>
//                   updateField(
//                     "ageAtDiagnosis",
//                     e.target.value
//                   )
//                 }
//               />

//             </div>

//           </div>

//         </div>


//         {/* =================================================
//             SECTION 02 - TREATMENT
//         ================================================= */}

//         <div className="clinical-section">

//           <div className="section-header">

//             <div className="section-number">
//               02
//             </div>

//             <div>

//               <h2>
//                 {txt.treatment}
//               </h2>

//               <p>
//                 {txt.treatmentDesc}
//               </p>

//             </div>

//           </div>


//           <div className="form-grid two-columns">

//             {/* CURRENT HEMOPHILIA TREATMENT */}

//             <div className="field">

//               <label>
//                 {txt.factorTherapy}
//               </label>

//               <select
//                 value={form.currentFactorTherapy}
//                 onChange={(e) => {
//                   updateField(
//                     "currentFactorTherapy",
//                     e.target.value
//                   );

//                   if (e.target.value !== "Other") {
//                     updateField(
//                       "otherCurrentTreatment",
//                       ""
//                     );
//                   }
//                 }}
//               >

//                 <option value="">
//                   {txt.treatmentOptions.placeholder}
//                 </option>

//                 <option value="None">
//                   {txt.treatmentOptions.none}
//                 </option>

//                 <option value="Factor VIII">
//                   {txt.treatmentOptions.factorVIII}
//                 </option>

//                 <option value="Factor IX">
//                   {txt.treatmentOptions.factorIX}
//                 </option>

//                 <option value="Extended half-life Factor VIII">
//                   {txt.treatmentOptions.extendedVIII}
//                 </option>

//                 <option value="Extended half-life Factor IX">
//                   {txt.treatmentOptions.extendedIX}
//                 </option>

//                 <option value="Emicizumab">
//                   {txt.treatmentOptions.emicizumab}
//                 </option>

//                 <option value="Bypassing agent">
//                   {txt.treatmentOptions.bypassingAgent}
//                 </option>

//                 <option value="Other">
//                   {txt.treatmentOptions.other}
//                 </option>

//               </select>

//             </div>


//             {/* OTHER TREATMENT */}

//             {form.currentFactorTherapy === "Other" && (
//               <div className="field">

//                 <label>
//                   {txt.treatmentOptions.other}
//                 </label>

//                 <input
//                   type="text"
//                   placeholder={
//                     txt.treatmentOptions.otherPlaceholder
//                   }
//                   value={
//                     form.otherCurrentTreatment
//                   }
//                   onChange={(e) =>
//                     updateField(
//                       "otherCurrentTreatment",
//                       e.target.value
//                     )
//                   }
//                 />

//               </div>
//             )}


//             {/* OTHER MEDICATIONS */}

//             <div className="field">

//               <label>
//                 {txt.medications}
//               </label>

//               <MedicationDropdown
//                 value={form.otherMedications}
//                 onChange={(values) =>
//                   updateField(
//                     "otherMedications",
//                     values
//                   )
//                 }
//                 txt={txt}
//               />

//             </div>


//             {/* OTHER MEDICATION DETAILS */}

//             {form.otherMedications.includes("Other") && (
//               <div className="field">

//                 <label>
//                   {txt.medicationOptions.other}
//                 </label>

//                 <input
//                   type="text"
//                   placeholder={
//                     txt.medicationOptions.otherPlaceholder
//                   }
//                   value={
//                     form.otherMedicationDetails
//                   }
//                   onChange={(e) =>
//                     updateField(
//                       "otherMedicationDetails",
//                       e.target.value
//                     )
//                   }
//                 />

//               </div>
//             )}

//           </div>

//         </div>


//         {/* =================================================
//             SECTION 03 - BLEEDING
//         ================================================= */}

//         <div
//           className={`clinical-section ${
//             bleedingDone
//               ? "section-complete"
//               : ""
//           }`}
//         >

//           <div className="section-header">

//             <div className="section-number">
//               03
//             </div>

//             <div>

//               <h2>
//                 {txt.bleeding}
//               </h2>

//               <p>
//                 {txt.bleedingDesc}
//               </p>

//             </div>

//             {bleedingDone && (
//               <div className="completion-mark">
//                 ✓
//               </div>
//             )}

//           </div>


//           {/* BLEEDING PATTERN */}

//           <div className="form-grid two-columns">

//             <div className="field">

//               <label>
//                 {txt.bleedingPattern}
//                 <span className="required">
//                   {txt.required}
//                 </span>
//               </label>

//               <select
//                 value={
//                   form.bleedingPattern
//                 }
//                 onChange={(e) =>
//                   updateField(
//                     "bleedingPattern",
//                     e.target.value
//                   )
//                 }
//               >

//                 <option value="">
//                   {txt.selectPattern}
//                 </option>

//                 <option value="Spontaneous">
//                   {txt.spontaneous}
//                 </option>

//                 <option value="Trauma-related">
//                   {txt.trauma}
//                 </option>

//                 <option value="Post-procedure">
//                   {txt.procedure}
//                 </option>

//                 <option value="Mixed">
//                   {txt.mixed}
//                 </option>

//                 <option value="Other">
//                   {txt.other}
//                 </option>

//               </select>

//             </div>


//             {/* FREQUENCY */}

//             <div className="field">

//               <label>
//                 {txt.bleedFrequency}
//                 <span className="required">
//                   {txt.required}
//                 </span>
//               </label>

//               <select
//                 value={
//                   form.bleedFrequency
//                 }
//                 onChange={(e) =>
//                   updateField(
//                     "bleedFrequency",
//                     e.target.value
//                   )
//                 }
//               >

//                 <option value="">
//                   {txt.selectFrequency}
//                 </option>

//                 <option value="Daily">
//                   {txt.daily}
//                 </option>

//                 <option value="Weekly">
//                   {txt.weekly}
//                 </option>

//                 <option value="Monthly">
//                   {txt.monthly}
//                 </option>

//                 <option value="Every few months">
//                   {txt.quarterly}
//                 </option>

//                 <option value="Rare">
//                   {txt.rare}
//                 </option>

//               </select>

//             </div>

//           </div>


//           {/* AFFECTED JOINTS - MULTI SELECT */}

//           <div className="field joint-field">

//             <label>
//               {txt.affectedJoints}
//             </label>

//             <p className="field-help">
//               {txt.affectedJointsHelp}
//             </p>

//             <div className="joint-grid">
//               {joints.map((joint) => {
//                 const selected =
//                   Array.isArray(form.jointsAffected) &&
//                   form.jointsAffected.includes(joint.value);

//                 return (
//                   <button
//                     key={joint.value}
//                     type="button"
//                     className={`joint-chip ${
//                       selected ? "active" : ""
//                     }`}
//                     onClick={() => toggleJoint(joint.value)}
//                     aria-pressed={selected}
//                   >
//                     <span className="joint-check">
//                       {selected ? "✓" : ""}
//                     </span>
//                     {joint.label}
//                   </button>
//                 );
//               })}
//             </div>

//             <p className="field-help selected-joints-help">
//               {Array.isArray(form.jointsAffected) &&
//               form.jointsAffected.length > 0
//                 ? `${txt.selectedJoints}: ${form.jointsAffected
//                     .map(
//                       (value) =>
//                         joints.find((joint) => joint.value === value)?.label ||
//                         value
//                     )
//                     .join(", ")}`
//                 : txt.noJointsSelected}
//             </p>

//           </div>


//           {/* TARGET JOINT + LAST BLEED */}

//           <div className="form-grid two-columns">

//             <div className="field">

//               <label>
//                 {txt.targetJoint}
//               </label>

//               <select
//                 value={
//                   form.targetJoint
//                 }
//                 onChange={(e) =>
//                   updateField(
//                     "targetJoint",
//                     e.target.value
//                   )
//                 }
//               >

//                 <option value="">
//                   {txt.selectTargetJoint}
//                 </option>

//                 <option value="">
//                   {txt.none}
//                 </option>

//                 {joints.map(
//                   (joint) => (
//                     <option
//                       key={joint.value}
//                       value={
//                         joint.value
//                       }
//                     >
//                       {joint.label}
//                     </option>
//                   )
//                 )}

//               </select>

//             </div>


//             <div className="field">

//               <label>
//                 {txt.lastBleed}
//               </label>

//               <input
//                 type="date"
//                 value={
//                   form.lastBleedDate
//                 }
//                 onChange={(e) =>
//                   updateField(
//                     "lastBleedDate",
//                     e.target.value
//                   )
//                 }
//               />

//             </div>

//           </div>


//           {/* OTHER DETAILS */}

//           <div className="field full-width">

//             <label>
//               {txt.otherDetails}
//             </label>

//             <textarea
//               rows="4"
//               placeholder={
//                 txt.otherDetailsPlaceholder
//               }
//               value={
//                 form.otherBleedingDetails
//               }
//               onChange={(e) =>
//                 updateField(
//                   "otherBleedingDetails",
//                   e.target.value
//                 )
//               }
//             />

//           </div>

//         </div>


//         {/* =================================================
//             SECTION 04 - PHYSIOTHERAPY
//         ================================================= */}

//         <div
//           className={`clinical-section ${
//             physioDone
//               ? "section-complete"
//               : ""
//           }`}
//         >

//           <div className="section-header">

//             <div className="section-number">
//               04
//             </div>

//             <div>

//               <h2>
//                 {txt.physiotherapy}
//               </h2>

//               <p>
//                 {txt.physiotherapyDesc}
//               </p>

//             </div>

//             {physioDone && (
//               <div className="completion-mark">
//                 ✓
//               </div>
//             )}

//           </div>


//           {/* CURRENT PHYSIO */}

//           <div className="field">

//             <label>
//               {txt.currentlyPhysio}
//               <span className="required">
//                 {txt.required}
//               </span>
//             </label>

//             <select
//               value={
//                 form.underPhysiotherapy === ""
//                   ? ""
//                   : form.underPhysiotherapy
//                   ? "Yes"
//                   : "No"
//               }
//               onChange={(e) => {

//                 const value =
//                   e.target.value;

//                 updateField(
//                   "underPhysiotherapy",
//                   value === ""
//                     ? ""
//                     : value === "Yes"
//                 );

//                 if (
//                   value === "Yes"
//                 ) {
//                   updateField(
//                     "previousPhysiotherapy",
//                     ""
//                   );
//                 }

//               }}
//             >

//               <option value="">
//                 {txt.selectOption}
//               </option>

//               <option value="Yes">
//                 {txt.yes}
//               </option>

//               <option value="No">
//                 {txt.no}
//               </option>

//             </select>

//           </div>


//           {/* =================================================
//               YES → CURRENT PHYSIO DETAILS
//           ================================================= */}

//           {form.underPhysiotherapy ===
//             true && (

//             <div className="conditional-box">

//               <h3>
//                 {txt.currentPhysioSection}
//               </h3>


//               <div className="form-grid two-columns">

//                 {/* LOCATION */}

//                 <div className="field">

//                   <label>
//                     {txt.wherePhysio}
//                   </label>

//                   <select
//                     value={
//                       form.physiotherapyLocation
//                     }
//                     onChange={(e) =>
//                       updateField(
//                         "physiotherapyLocation",
//                         e.target.value
//                       )
//                     }
//                   >

//                     <option value="">
//                       {txt.selectOption}
//                     </option>

//                     <option value="Hospital">
//                       {txt.hospital}
//                     </option>

//                     <option value="Clinic">
//                       {txt.clinic}
//                     </option>

//                     <option value="Hemophilia Centre">
//                       {txt.hemophiliaCentre}
//                     </option>

//                     <option value="Home">
//                       {txt.home}
//                     </option>

//                   </select>

//                 </div>


//                 {/* SESSIONS */}

//                 <div className="field">

//                   <label>
//                     {txt.sessions}
//                   </label>

//                   <select
//                     value={
//                       form.physiotherapySessions
//                     }
//                     onChange={(e) =>
//                       updateField(
//                         "physiotherapySessions",
//                         e.target.value
//                       )
//                     }
//                   >

//                     <option value="">
//                       {txt.selectOption}
//                     </option>

//                     <option value="Once a week">
//                       {txt.onceWeek}
//                     </option>

//                     <option value="2-3 times a week">
//                       {txt.twoThree}
//                     </option>

//                     <option value="More than 3 sessions a week">
//                       {txt.moreThree}
//                     </option>

//                   </select>

//                 </div>


//                 {/* DURATION */}

//                 <div className="field">

//                   <label>
//                     {txt.sessionDuration}
//                   </label>

//                   <select
//                     value={
//                       form.physiotherapyDuration
//                     }
//                     onChange={(e) =>
//                       updateField(
//                         "physiotherapyDuration",
//                         e.target.value
//                       )
//                     }
//                   >

//                     <option value="">
//                       {txt.selectOption}
//                     </option>

//                     <option value="Less than 10 minutes">
//                       {txt.lessTen}
//                     </option>

//                     <option value="10-20 minutes">
//                       {txt.tenTwenty}
//                     </option>

//                     <option value="20-30 minutes">
//                       {txt.twentyThirty}
//                     </option>

//                     <option value="More than 30 minutes">
//                       {txt.moreThirty}
//                     </option>

//                   </select>

//                 </div>


//                 {/* BODY PART */}

//                 <div className="field">

//                   <label>
//                     {txt.affectedBodyPart}
//                   </label>

//                   <select
//                     value={
//                       form.physiotherapyBodyPart
//                     }
//                     onChange={(e) =>
//                       updateField(
//                         "physiotherapyBodyPart",
//                         e.target.value
//                       )
//                     }
//                   >

//                     <option value="">
//                       {txt.selectOption}
//                     </option>

//                     {joints.map(
//                       (joint) => (
//                         <option
//                           key={joint.value}
//                           value={
//                             joint.value
//                           }
//                         >
//                           {joint.label}
//                         </option>
//                       )
//                     )}

//                   </select>

//                 </div>

//               </div>


//               {/* TREATMENT */}

//               <div className="field">

//                 <label>
//                   {txt.treatmentReceived}
//                 </label>

//                 <select
//                   value={
//                     form.physiotherapyTreatment
//                   }
//                   onChange={(e) =>
//                     updateField(
//                       "physiotherapyTreatment",
//                       e.target.value
//                     )
//                   }
//                 >

//                   <option value="">
//                     {txt.selectOption}
//                   </option>

//                   <option value="Stretching">
//                     {txt.stretching}
//                   </option>

//                   <option value="Strengthening">
//                     {txt.strengthening}
//                   </option>

//                   <option value="Balance exercises">
//                     {txt.balance}
//                   </option>

//                   <option value="General fitness">
//                     {txt.generalFitness}
//                   </option>

//                   <option value="Joint movement exercises">
//                     {txt.jointMovement}
//                   </option>

//                   <option value="Exercises for pain relief">
//                     {txt.painRelief}
//                   </option>

//                 </select>

//               </div>


//               {/* EQUIPMENT */}

//               <div className="field">

//                 <label>
//                   {txt.equipment}
//                 </label>

//                 <select
//                   value={
//                     form.physiotherapyEquipment
//                   }
//                   onChange={(e) =>
//                     updateField(
//                       "physiotherapyEquipment",
//                       e.target.value
//                     )
//                   }
//                 >

//                   <option value="">
//                     {txt.selectOption}
//                   </option>

//                   <option value="None">
//                     {txt.noEquipment}
//                   </option>

//                   <option value="Dumbbells">
//                     {txt.dumbbells}
//                   </option>

//                   <option value="Weight cuffs">
//                     {txt.weightsCuffs}
//                   </option>

//                   <option value="Theraband">
//                     {txt.theraband}
//                   </option>

//                   <option value="Yoga mat">
//                     {txt.yogaMat}
//                   </option>

//                   <option value="Other">
//                     {txt.otherEquipment}
//                   </option>

//                 </select>

//               </div>


//               {/* HELPING */}

//               <div className="field">

//                 <label>
//                   {txt.helping}
//                 </label>

//                 <select
//                   value={
//                     form.physiotherapyHelping
//                   }
//                   onChange={(e) =>
//                     updateField(
//                       "physiotherapyHelping",
//                       e.target.value
//                     )
//                   }
//                 >

//                   <option value="">
//                     {txt.selectOption}
//                   </option>

//                   <option value="Yes">
//                     {txt.yes}
//                   </option>

//                   <option value="No">
//                     {txt.no}
//                   </option>

//                 </select>

//               </div>


//               {/* PROBLEMS */}

//               <div className="field">

//                 <label>
//                   {txt.problems}
//                 </label>

//                 <div className="problem-grid">

//                   {[
//                     {
//                       value: "None",
//                       label: txt.noProblems,
//                     },
//                     {
//                       value: "Pain",
//                       label: txt.pain,
//                     },
//                     {
//                       value: "New bleeding",
//                       label: txt.newBleeding,
//                     },
//                     {
//                       value: "Stiffness",
//                       label: txt.stiffness,
//                     },
//                     {
//                       value: "Increased swelling",
//                       label: txt.increasedSwelling,
//                     },
//                     {
//                       value: "Feeling tired",
//                       label: txt.tired,
//                     },
//                   ].map(
//                     (problem) => {

//                       const active =
//                         form.physiotherapyProblems.includes(
//                           problem.value
//                         );

//                       return (
//                         <button
//                           key={
//                             problem.value
//                           }
//                           type="button"
//                           className={`problem-chip ${
//                             active
//                               ? "active"
//                               : ""
//                           }`}
//                           onClick={() =>
//                             togglePhysioProblem(
//                               problem.value
//                             )
//                           }
//                         >

//                           <span>
//                             {active
//                               ? "✓"
//                               : ""}
//                           </span>

//                           {problem.label}

//                         </button>
//                       );
//                     }
//                   )}

//                 </div>

//               </div>

//             </div>
//           )}


//           {/* =================================================
//               NO → PREVIOUS PHYSIO
//           ================================================= */}

//           {form.underPhysiotherapy ===
//             false && (

//             <div className="conditional-box">

//               <h3>
//                 {txt.previousPhysioSection}
//               </h3>


//               <div className="field">

//                 <label>
//                   {txt.previousPhysio}
//                 </label>

//                 <select
//                   value={
//                     form.previousPhysiotherapy === ""
//                       ? ""
//                       : form.previousPhysiotherapy
//                       ? "Yes"
//                       : "No"
//                   }
//                   onChange={(e) =>
//                     updateField(
//                       "previousPhysiotherapy",
//                       e.target.value ===
//                         "Yes"
//                     )
//                   }
//                 >

//                   <option value="">
//                     {txt.selectOption}
//                   </option>

//                   <option value="Yes">
//                     {txt.yes}
//                   </option>

//                   <option value="No">
//                     {txt.no}
//                   </option>

//                 </select>

//               </div>


//               {form.previousPhysiotherapy ===
//                 true && (

//                 <div className="form-grid two-columns">

//                   <div className="field">

//                     <label>
//                       {txt.stoppedWhen}
//                     </label>

//                     <input
//                       type="date"
//                       value={
//                         form.physiotherapyStoppedDate
//                       }
//                       onChange={(e) =>
//                         updateField(
//                           "physiotherapyStoppedDate",
//                           e.target.value
//                         )
//                       }
//                     />

//                   </div>


//                   <div className="field">

//                     <label>
//                       {txt.stoppedWhy}
//                     </label>

//                     <select
//                       value={
//                         form.physiotherapyStoppedReason
//                       }
//                       onChange={(e) =>
//                         updateField(
//                           "physiotherapyStoppedReason",
//                           e.target.value
//                         )
//                       }
//                     >

//                       <option value="">
//                         {
//                           txt.stoppedWhyPlaceholder
//                         }
//                       </option>

//                       <option value="No longer needed">
//                         {txt.noNeed}
//                       </option>

//                       <option value="Symptoms improved">
//                         {txt.improved}
//                       </option>

//                       <option value="Difficulty accessing physiotherapy">
//                         {txt.access}
//                       </option>

//                       <option value="Cost / financial reasons">
//                         {txt.cost}
//                       </option>

//                       <option value="Time constraints">
//                         {txt.time}
//                       </option>

//                       <option value="Other">
//                         {txt.other}
//                       </option>

//                     </select>

//                   </div>

//                 </div>

//               )}

//             </div>

//           )}

//         </div>


//         {/* =================================================
//             SECTION 05 - MOBILITY
//         ================================================= */}

//         <div className="clinical-section">

//           <div className="section-header">

//             <div className="section-number">
//               05
//             </div>

//             <div>

//               <h2>
//                 {txt.mobility}
//               </h2>

//             </div>

//           </div>


//           <div className="form-grid two-columns">

//             <div className="field">

//               <label>
//                 {txt.mobility}
//               </label>

//               <select
//                 value={
//                   form.mobilityLimitation
//                 }
//                 onChange={(e) =>
//                   updateField(
//                     "mobilityLimitation",
//                     e.target.value
//                   )
//                 }
//               >

//                 <option value="">
//                   {txt.selectMobility}
//                 </option>

//                 <option value="None">
//                   {txt.noLimitation}
//                 </option>

//                 <option value="Mild">
//                   {txt.mild}
//                 </option>

//                 <option value="Moderate">
//                   {txt.moderate}
//                 </option>

//                 <option value="Severe">
//                   {txt.severe}
//                 </option>

//               </select>

//             </div>


//             <div className="field">

//               <label>
//                 {txt.assistive}
//               </label>

//               <select
//                 value={
//                   form.assistiveDevices
//                 }
//                 onChange={(e) =>
//                   updateField(
//                     "assistiveDevices",
//                     e.target.value
//                   )
//                 }
//               >
//                 <option value="">
//                   {txt.assistivePlaceholder}
//                 </option>

//                 <option value="None">
//                   {txt.assistiveOptions.none}
//                 </option>

//                 <option value="Knee Brace">
//                   {txt.assistiveOptions.kneeBrace}
//                 </option>

//                 <option value="Ankle / Foot Brace">
//                   {txt.assistiveOptions.ankleBrace}
//                 </option>

//                 <option value="Elbow Brace">
//                   {txt.assistiveOptions.elbowBrace}
//                 </option>

//                 <option value="Wrist Support">
//                   {txt.assistiveOptions.wristSupport}
//                 </option>

//                 <option value="Cane / Walking Stick">
//                   {txt.assistiveOptions.cane}
//                 </option>

//                 <option value="Crutches">
//                   {txt.assistiveOptions.crutches}
//                 </option>

//                 <option value="Walker">
//                   {txt.assistiveOptions.walker}
//                 </option>

//                 <option value="Wheelchair">
//                   {txt.assistiveOptions.wheelchair}
//                 </option>

//                 <option value="Other">
//                   {txt.assistiveOptions.other}
//                 </option>
//               </select>

//             </div>

//           </div>

//         </div>


//         {/* =================================================
//             SECTION 06 - DOCTOR
//         ================================================= */}

//         <div className="clinical-section">

//           <div className="section-header">

//             <div className="section-number">
//               06
//             </div>

//             <div>

//               <h2>
//                 {txt.doctor}
//               </h2>

//               <p>
//                 {txt.doctorDesc}
//               </p>

//             </div>

//           </div>


//           <div className="field">

//             <label>
//               {txt.doctor}
//               <span className="required">
//                 {txt.required}
//               </span>
//             </label>

//             <select
//               value={
//                 form.consultingDoctorId
//               }
//               onChange={(e) =>
//                 updateField(
//                   "consultingDoctorId",
//                   e.target.value
//                 )
//               }
//               disabled={
//                 doctorFieldLocked
//               }
//             >

//               <option value="">
//                 {doctorsLoading
//                   ? txt.doctorLoading
//                   : txt.selectDoctor}
//               </option>

//               {!doctorsLoading &&
//                 doctors.length ===
//                   0 && (
//                   <option value="">
//                     {txt.noDoctors}
//                   </option>
//                 )}

//               {doctors.map((doctor) => (
//                 <option
//                   key={doctor._id}
//                   value={doctor._id}
//                 >
//                   {doctor.nameTranslations?.[language] ||
//                     doctor.fullName}{" "}
//                   — {doctor.professionalId}
//                 </option>
//               ))}

//             </select>

//             {doctorAssigned && !doctorChangePending && (
//               <button
//                 type="button"
//                 className="doctor-change-button"
//                 onClick={() => {
//                   setChangeRequestReason("");
//                   setChangeRequestModalOpen(true);
//                 }}
//                 disabled={doctorStatusLoading || changeRequestLoading}
//               >
//                 {txt.requestDoctorChange}
//               </button>
//             )}

//             {doctorChangePending && (
//               <div className="doctor-change-pending">
//                 <span className="doctor-change-pending-icon">⏳</span>
//                 <span>{txt.requestPending}</span>
//               </div>
//             )}

//           </div>

//         </div>


//         {/* =================================================
//             DOCTOR CHANGE REQUEST MODAL
//         ================================================= */}

//         {changeRequestModalOpen && (
//           <div
//             className="doctor-change-modal-overlay"
//             onMouseDown={(e) => {
//               if (e.target === e.currentTarget && !changeRequestLoading) {
//                 setChangeRequestModalOpen(false);
//               }
//             }}
//           >
//             <div
//               className="doctor-change-modal"
//               role="dialog"
//               aria-modal="true"
//               aria-labelledby="doctor-change-title"
//             >
//               <div className="doctor-change-modal-header">
//                 <div>
//                   <h3 id="doctor-change-title">
//                     {txt.requestDoctorChangeTitle}
//                   </h3>
//                   <p>{txt.requestDoctorChangeText}</p>
//                 </div>
//                 <button
//                   type="button"
//                   className="doctor-change-close"
//                   onClick={() => setChangeRequestModalOpen(false)}
//                   disabled={changeRequestLoading}
//                   aria-label={txt.cancel}
//                 >
//                   ×
//                 </button>
//               </div>

//               <div className="doctor-change-modal-body">
//                 <label className="doctor-change-reason-label">
//                   {txt.changeReason}
//                 </label>
//                 <textarea
//                   value={changeRequestReason}
//                   onChange={(e) => setChangeRequestReason(e.target.value)}
//                   placeholder={txt.changeReasonPlaceholder}
//                   rows={5}
//                   disabled={changeRequestLoading}
//                   className="doctor-change-reason-input"
//                 />
//               </div>

//               <div className="doctor-change-modal-actions">
//                 <button
//                   type="button"
//                   className="doctor-change-cancel"
//                   onClick={() => setChangeRequestModalOpen(false)}
//                   disabled={changeRequestLoading}
//                 >
//                   {txt.cancel}
//                 </button>

//                 <button
//                   type="button"
//                   className="doctor-change-submit"
//                   onClick={handleDoctorChangeRequest}
//                   disabled={changeRequestLoading}
//                 >
//                   {changeRequestLoading
//                     ? txt.sendingRequest
//                     : txt.sendRequest}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}


//         {/* =================================================
//             ERROR
//         ================================================= */}

//         {error && (

//           <div className="error-box">

//             <span className="error-icon">
//               !
//             </span>

//             <span>
//               {error}
//             </span>

//           </div>

//         )}


//         {/* =================================================
//             ACTIONS
//         ================================================= */}

//         <div className="action-row">

//           <button
//             type="button"
//             className="back-button"
//             onClick={() =>
//               navigate("/awareness")
//             }
//           >
//             ← {txt.back}
//           </button>


//           <button
//             type="button"
//             className="continue-button"
//             onClick={handleSubmit}
//             disabled={loading}
//           >

//             {loading ? (
//               <>
//                 <span className="spinner"></span>
//                 {txt.saving}
//               </>
//             ) : (
//               <>
//                 {txt.save}
//                 <span>→</span>
//               </>
//             )}

//           </button>

//         </div>


//         {/* =================================================
//             FOOTER
//         ================================================= */}

//         <div className="bottom-note">

//           <span className="small-info">
//             i
//           </span>

//           <span>
//             {txt.secure}
//           </span>

//         </div>

//       </div>


//       {/* =================================================
//           STYLES
//       ================================================= */}

//       <style>{`

//         * {
//           box-sizing: border-box;
//         }

//         .clinical-page {
//           min-height: 100vh;
//           width: 100%;
//           padding: 32px 20px;

//           background:
//             linear-gradient(
//               135deg,
//               #eef3fa 0%,
//               #f7f9fd 50%,
//               #edf2f9 100%
//             );

//           display: flex;
//           justify-content: center;
//           align-items: flex-start;

//           font-family:
//             Inter,
//             -apple-system,
//             BlinkMacSystemFont,
//             "Segoe UI",
//             sans-serif;

//           color: #1c2942;
//         }

//         .clinical-container {
//           width: min(960px, 100%);

//           padding: 28px;

//           background: #ffffff;

//           border:
//             1px solid #dce4ef;

//           border-radius: 18px;

//           box-shadow:
//             0 18px 50px
//             rgba(30, 48, 95, 0.09);
//         }

//         .clinical-header {
//           display: flex;
//           align-items: center;
//           gap: 13px;

//           padding-bottom: 22px;

//           border-bottom:
//             1px solid #e1e6ee;
//         }

//         .header-icon {
//           width: 44px;
//           height: 44px;

//           flex-shrink: 0;

//           display: flex;
//           align-items: center;
//           justify-content: center;

//           border-radius: 11px;

//           background:
//             linear-gradient(
//               135deg,
//               #24328f,
//               #4a7dfc
//             );

//           color: white;

//           font-size: 25px;
//           font-weight: 300;
//         }

//         .header-eyebrow {
//           display: block;
//           margin-bottom: 4px;

//           color: #4a7dfc;

//           font-size: 8px;
//           font-weight: 700;

//           letter-spacing: 1px;
//         }

//         .header-text h1 {
//           margin: 0;

//           color: #1d2a47;

//           font-size: 23px;
//           font-weight: 700;
//         }

//         .header-text p {
//           margin: 5px 0 0;

//           color: #78869a;

//           font-size: 10px;
//           line-height: 1.5;
//         }

//         .info-banner {
//           margin-top: 18px;

//           padding: 12px 14px;

//           display: flex;
//           align-items: flex-start;

//           gap: 9px;

//           border:
//             1px solid #cfe3eb;

//           border-radius: 10px;

//           background: #effafd;
//         }

//         .info-banner-icon {
//           width: 21px;
//           height: 21px;

//           flex-shrink: 0;

//           display: flex;
//           align-items: center;
//           justify-content: center;

//           border-radius: 50%;

//           background: #d9f1f6;

//           color: #3b8093;

//           font-size: 10px;
//           font-weight: 700;
//         }

//         .info-banner strong {
//           display: block;

//           color: #315d70;

//           font-size: 9px;
//         }

//         .info-banner p {
//           margin: 3px 0 0;

//           color: #648499;

//           font-size: 8px;

//           line-height: 1.5;
//         }

//         .clinical-section {
//           margin-top: 18px;

//           padding: 19px;

//           border:
//             1px solid #dfe6ef;

//           border-radius: 12px;

//           background: #ffffff;

//           transition:
//             border-color .2s ease,
//             background .2s ease;
//         }

//         .clinical-section.section-complete {
//           border-color: #cdd9ee;
//           background: #fbfcff;
//         }

//         .section-header {
//           display: flex;
//           align-items: center;

//           gap: 10px;

//           margin-bottom: 18px;
//         }

//         .section-number {
//           width: 30px;
//           height: 30px;

//           flex-shrink: 0;

//           display: flex;
//           align-items: center;
//           justify-content: center;

//           border-radius: 8px;

//           background: #eef2ff;

//           color: #24328f;

//           font-size: 8px;
//           font-weight: 700;
//         }

//         .section-header h2 {
//           margin: 0;

//           color: #202d47;

//           font-size: 14px;
//           font-weight: 700;
//         }

//         .section-header p {
//           margin: 3px 0 0;

//           color: #8996a8;

//           font-size: 8px;
//         }

//         .completion-mark {
//           width: 21px;
//           height: 21px;

//           margin-left: auto;

//           display: flex;
//           align-items: center;
//           justify-content: center;

//           border-radius: 50%;

//           background: #edf8f2;

//           color: #2b9660;

//           border:
//             1px solid #d5ebdf;

//           font-size: 10px;
//           font-weight: 700;
//         }

//         .form-grid {
//           display: grid;

//           grid-template-columns:
//             repeat(3, minmax(0, 1fr));

//           gap: 14px;
//         }

//         .form-grid.two-columns {
//           grid-template-columns:
//             repeat(2, minmax(0, 1fr));

//           margin-top: 16px;
//         }

//         .field {
//           min-width: 0;
//           margin-bottom: 14px;
//         }

//         .full-width {
//           grid-column: 1 / -1;
//         }

//         .field label {
//           display: block;

//           margin-bottom: 6px;

//           color: #46556d;

//           font-size: 9px;

//           font-weight: 600;
//         }

//         .required {
//           margin-left: 3px;
//           color: #d34c4c;
//         }

//         .field-help {
//           margin: -1px 0 9px;

//           color: #8a97a9;

//           font-size: 8px;

//           line-height: 1.4;
//         }

//         .field input,
//         .field select,
//         .doctor-change-button {
//           margin-top: 12px;
//           width: 100%;
//           min-height: 35px;
//           border: 1px solid #1890b4;
//           border-radius: 10px;
//           background: #fff;
//           color: black;
//           font-size: 9px;
//           font-weight: 200;
//           cursor: pointer;
//           transition: 0.2s ease;
//         }

//         .doctor-change-button:hover:not(:disabled) {
//           background: #fff5f4;
//         }

//         .doctor-change-button:disabled {
//           opacity: 0.6;
//           cursor: not-allowed;
//         }

//         .doctor-change-pending {
//           display: flex;
//           align-items: flex-start;
//           gap: 9px;
//           margin-top: 12px;
//           padding: 12px 14px;
//           border: 1px solid #f0c36d;
//           border-radius: 10px;
//           background: #fffaf0;
//           color: #7a4b00;
//           font-size: 13px;
//           line-height: 1.5;
//         }

//         .doctor-change-pending-icon {
//           flex: 0 0 auto;
//         }

//         .doctor-change-modal-overlay {
//           position: fixed;
//           inset: 0;
//           z-index: 9999;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           padding: 20px;
//           background: rgba(0, 0, 0, 0.45);
//         }

//         .doctor-change-modal {
//           width: min(560px, 100%);
//           max-height: calc(100vh - 40px);
//           overflow-y: auto;
//           border-radius: 16px;
//           background: #fff;
//           box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
//         }

//         .doctor-change-modal-header {
//           display: flex;
//           align-items: flex-start;
//           justify-content: space-between;
//           gap: 16px;
//           padding: 22px 22px 16px;
//           border-bottom: 1px solid #eee;
//         }

//         .doctor-change-modal-header h3 {
//           margin: 0 0 7px;
//           font-size: 20px;
//           line-height: 1.25;
//         }

//         .doctor-change-modal-header p {
//           margin: 0;
//           color: #666;
//           font-size: 13px;
//           line-height: 1.55;
//         }

//         .doctor-change-close {
//           width: 34px;
//           height: 34px;
//           flex: 0 0 auto;
//           border: 0;
//           border-radius: 8px;
//           background: #f5f5f5;
//           color: #444;
//           font-size: 24px;
//           line-height: 1;
//           cursor: pointer;
//         }

//         .doctor-change-modal-body {
//           padding: 20px 22px;
//         }

//         .doctor-change-reason-label {
//           display: block;
//           margin-bottom: 8px;
//           font-size: 14px;
//           font-weight: 700;
//         }

//         .doctor-change-reason-input {
//           width: 100%;
//           min-height: 120px;
//           box-sizing: border-box;
//           resize: vertical;
//           padding: 12px 13px;
//           border: 1px solid #d6d6d6;
//           border-radius: 10px;
//           outline: none;
//           font: inherit;
//           line-height: 1.5;
//         }

//         .doctor-change-reason-input:focus {
//           border-color: #777;
//           box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06);
//         }

//         .doctor-change-modal-actions {
//           display: flex;
//           justify-content: flex-end;
//           gap: 10px;
//           padding: 0 22px 22px;
//         }

//         .doctor-change-cancel,
//         .doctor-change-submit {
//           min-height: 42px;
//           padding: 0 18px;
//           border-radius: 9px;
//           font-size: 14px;
//           font-weight: 700;
//           cursor: pointer;
//         }

//         .doctor-change-cancel {
//           border: 1px solid #d6d6d6;
//           background: #fff;
//           color: #444;
//         }

//         .doctor-change-submit {
//           border: 1px solid #111;
//           background: #111;
//           color: #fff;
//         }

//         .doctor-change-cancel:disabled,
//         .doctor-change-submit:disabled {
//           opacity: 0.6;
//           cursor: not-allowed;
//         }

//         .field textarea {
//           width: 100%;

//           padding: 10px 12px;

//           border:
//             1px solid #d8e0eb;

//           border-radius: 8px;

//           background: #ffffff;

//           color: #26344d;

//           font-family: inherit;

//           font-size: 10px;

//           outline: none;

//           transition:
//             border-color .15s ease,
//             box-shadow .15s ease,
//             background .15s ease;
//         }

//         .field input,
//         .field select {
//           height: 40px;
//         }

//         .field textarea {
//           resize: vertical;
//           min-height: 85px;
//         }

//         .field input::placeholder,
//         .field textarea::placeholder {
//           color: #a3adbc;
//         }

//         .field input:hover,
//         .field select:hover,
//         .field textarea:hover {
//           border-color: #bcc8da;
//           background: #fcfdff;
//         }

//         .field input:focus,
//         .field select:focus,
//         .field textarea:focus {
//           border-color: #4a7dfc;

//           background: #ffffff;

//           box-shadow:
//             0 0 0 3px
//             rgba(74, 125, 252, .10);
//         }

//         .field select {
//           cursor: pointer;
//         }

//         .field select:disabled {
//           opacity: .65;
//           cursor: not-allowed;
//         }


//         /* ================================================
//            MEDICATION MULTI-SELECT DROPDOWN
//         ================================================= */

//         .medication-dropdown {
//           position: relative;
//           width: 100%;
//         }

//         .medication-dropdown-button {
//           width: 100%;
//           min-height: 38px;

//           padding: 0 11px;

//           display: flex;
//           align-items: center;
//           justify-content: space-between;

//           gap: 8px;

//           border:
//             1px solid #d8e0eb;

//           border-radius: 7px;

//           background: #ffffff;

//           color: #334155;

//           font-family: inherit;
//           font-size: 10px;
//           font-weight: 500;

//           cursor: pointer;

//           text-align: left;

//           transition:
//             border-color .15s ease,
//             box-shadow .15s ease;
//         }

//         .medication-dropdown-button:hover {
//           border-color: #bcc8da;
//           background: #fcfdff;
//         }

//         .medication-dropdown-button:focus {
//           outline: none;

//           border-color: #4a7dfc;

//           box-shadow:
//             0 0 0 3px
//             rgba(74, 125, 252, .10);
//         }

//         .medication-dropdown-value {
//           flex: 1;
//           min-width: 0;

//           overflow: hidden;
//           text-overflow: ellipsis;
//           white-space: nowrap;
//         }

//         .medication-dropdown-arrow {
//           flex-shrink: 0;

//           color: #66758b;

//           font-size: 13px;
//           line-height: 1;
//         }

//         .medication-dropdown-overlay {
//           position: fixed;

//           inset: 0;

//           z-index: 90;

//           width: 100%;
//           height: 100%;

//           padding: 0;

//           border: none;

//           background: transparent;

//           cursor: default;
//         }

//         .medication-dropdown-menu {
//           position: absolute;

//           left: 0;
//           right: 0;
//           top: calc(100% + 4px);

//           z-index: 100;

//           max-height: 220px;

//           overflow-y: auto;

//           padding: 6px;

//           border:
//             1px solid #d8e0eb;

//           border-radius: 8px;

//           background: #ffffff;

//           box-shadow:
//             0 10px 24px
//             rgba(31, 52, 86, .14);
//         }

//         .medication-option {
//           display: flex;

//           align-items: center;

//           gap: 8px;

//           min-height: 32px;

//           padding: 6px 7px;

//           border-radius: 6px;

//           color: #4c5b70;

//           font-size: 9px;
//           font-weight: 600;

//           cursor: pointer;

//           transition:
//             background .15s ease;
//         }

//         .medication-option:hover {
//           background: #f4f7ff;
//         }

//         .medication-option input {
//           width: 14px;
//           height: 14px;

//           flex-shrink: 0;

//           margin: 0;

//           cursor: pointer;

//           accent-color: #4a7dfc;
//         }

//         .joint-field {
//           margin-top: 16px;
//         }

//         .field-help {
//           margin: 6px 0 0;
//           color: #7b8798;
//           font-size: 8px;
//           line-height: 1.5;
//         }

//         .selected-joints-help {
//           margin-top: 9px;
//           font-weight: 600;
//         }

//         .joint-grid {
//           display: flex;
//           flex-wrap: wrap;
//           gap: 7px;
//         }

//         .joint-chip {
//           min-height: 31px;

//           padding: 0 11px;

//           display: flex;
//           align-items: center;

//           gap: 5px;

//           border:
//             1px solid #d8e0eb;

//           border-radius: 999px;

//           background: #ffffff;

//           color: #5c6a7e;

//           font-family: inherit;

//           font-size: 9px;

//           font-weight: 600;

//           cursor: pointer;

//           transition: all .15s ease;
//         }

//         .joint-chip:hover {
//           border-color: #9eb3dc;

//           background: #f5f8ff;

//           color: #24328f;
//         }

//         .joint-chip.active {
//           border-color: #4a7dfc;

//           background: #eef2ff;

//           color: #24328f;
//         }

//         .joint-check {
//           width: 14px;
//           height: 14px;

//           display: flex;
//           align-items: center;
//           justify-content: center;

//           border-radius: 50%;

//           background: #edf0f5;

//           color: transparent;

//           font-size: 8px;
//         }

//         .joint-chip.active
//         .joint-check {
//           background: #4a7dfc;
//           color: #ffffff;
//         }

//         /* ================================================
//            CONDITIONAL PHYSIO BOX
//         ================================================= */

//         .conditional-box {
//           margin-top: 17px;

//           padding: 16px;

//           border:
//             1px solid #dce6f3;

//           border-radius: 10px;

//           background: #f9fbff;
//         }

//         .conditional-box h3 {
//           margin: 0 0 15px;

//           color: #2a3c5d;

//           font-size: 11px;

//           font-weight: 700;
//         }

//         /* ================================================
//            PROBLEM CHIPS
//         ================================================= */

//         .problem-grid {
//           display: flex;

//           flex-wrap: wrap;

//           gap: 7px;
//         }

//         .problem-chip {
//           min-height: 34px;

//           padding: 0 11px;

//           display: flex;

//           align-items: center;

//           gap: 6px;

//           border:
//             1px solid #d8e0eb;

//           border-radius: 8px;

//           background: #ffffff;

//           color: #5c6a7e;

//           font-family: inherit;

//           font-size: 9px;

//           font-weight: 600;

//           cursor: pointer;

//           transition: all .15s ease;
//         }

//         .problem-chip:hover {
//           border-color: #9eb3dc;

//           background: #f5f8ff;
//         }

//         .problem-chip.active {
//           border-color: #4a7dfc;

//           background: #eef2ff;

//           color: #24328f;
//         }

//         .problem-chip span {
//           width: 15px;
//           height: 15px;

//           display: flex;

//           align-items: center;
//           justify-content: center;

//           border-radius: 50%;

//           background: #edf0f5;

//           font-size: 8px;
//         }

//         .problem-chip.active span {
//           background: #4a7dfc;
//           color: #ffffff;
//         }

//         /* ================================================
//            ERROR
//         ================================================= */

//         .error-box {
//           margin-top: 16px;

//           padding: 10px 12px;

//           display: flex;

//           align-items: center;

//           gap: 8px;

//           border:
//             1px solid #f0c9c6;

//           border-radius: 9px;

//           background: #fff6f5;

//           color: #b3261e;

//           font-size: 9px;
//         }

//         .error-icon {
//           width: 19px;
//           height: 19px;

//           flex-shrink: 0;

//           display: flex;

//           align-items: center;
//           justify-content: center;

//           border-radius: 50%;

//           background: #fde4e2;

//           font-size: 9px;

//           font-weight: 700;
//         }

//         /* ================================================
//            ACTIONS
//         ================================================= */

//         .action-row {
//           margin-top: 22px;

//           display: flex;

//           align-items: center;

//           justify-content: space-between;

//           gap: 12px;
//         }

//         .back-button,
//         .continue-button {
//           height: 40px;

//           padding: 0 17px;

//           display: flex;

//           align-items: center;

//           justify-content: center;

//           gap: 7px;

//           border-radius: 8px;

//           font-family: inherit;

//           font-size: 10px;

//           font-weight: 600;

//           cursor: pointer;

//           transition: all .15s ease;
//         }

//         .back-button {
//           min-width: 90px;

//           border:
//             1px solid #d8e0eb;

//           background: #f7f9fc;

//           color: #657388;
//         }

//         .back-button:hover {
//           border-color: #c4cfde;

//           background: #eef2f7;

//           color: #3f4e65;
//         }

//         .continue-button {
//           min-width: 170px;

//           border: none;

//           background:
//             linear-gradient(
//               135deg,
//               #4a7dfc,
//               #5f8dff
//             );

//           color: #ffffff;

//           box-shadow:
//             0 6px 16px
//             rgba(74, 125, 252, .20);
//         }

//         .continue-button:hover:not(:disabled) {
//           transform: translateY(-1px);

//           box-shadow:
//             0 8px 20px
//             rgba(74, 125, 252, .28);
//         }

//         .continue-button:disabled {
//           opacity: .65;

//           cursor: not-allowed;

//           transform: none;

//           box-shadow: none;
//         }

//         .spinner {
//           width: 12px;
//           height: 12px;

//           border:
//             2px solid
//             rgba(255,255,255,.35);

//           border-top-color: #ffffff;

//           border-radius: 50%;

//           animation:
//             spin .7s linear infinite;
//         }

//         @keyframes spin {
//           to {
//             transform: rotate(360deg);
//           }
//         }

//         .bottom-note {
//           margin-top: 18px;

//           padding-top: 12px;

//           display: flex;

//           align-items: center;

//           justify-content: center;

//           gap: 6px;

//           border-top:
//             1px solid #e7ebf1;

//           color: #8a97a8;

//           font-size: 8px;

//           text-align: center;
//         }

//         .small-info {
//           width: 15px;
//           height: 15px;

//           flex-shrink: 0;

//           display: flex;

//           align-items: center;

//           justify-content: center;

//           border-radius: 50%;

//           background: #eef2ff;

//           color: #4a7dfc;

//           font-size: 8px;

//           font-weight: 700;
//         }

//         @media (max-width: 800px) {

//           .clinical-page {
//             padding: 22px 14px;
//           }

//           .clinical-container {
//             padding: 22px;

//             border-radius: 15px;
//           }

//           .form-grid {
//             grid-template-columns:
//               repeat(2, minmax(0, 1fr));
//           }

//         }

//         @media (max-width: 600px) {

//           .clinical-page {
//             padding: 0;

//             background: #f4f7fb;
//           }

//           .clinical-container {
//             width: 100%;

//             padding: 18px 14px;

//             border-radius: 0;

//             border-left: none;
//             border-right: none;

//             box-shadow: none;
//           }

//           .clinical-header {
//             padding-bottom: 17px;
//           }

//           .header-icon {
//             width: 38px;
//             height: 38px;

//             font-size: 22px;
//           }

//           .header-text h1 {
//             font-size: 18px;
//           }

//           .header-text p {
//             font-size: 8px;
//           }

//           .clinical-section {
//             padding: 15px;

//             margin-top: 13px;

//             border-radius: 10px;
//           }

//           .section-header {
//             margin-bottom: 14px;
//           }

//           .section-header h2 {
//             font-size: 12px;
//           }

//           .section-header p {
//             font-size: 7px;
//           }

//           .form-grid,
//           .form-grid.two-columns {
//             grid-template-columns: 1fr;

//             gap: 12px;
//           }

//           .joint-grid,
//           .problem-grid {
//             gap: 6px;
//           }

//           .joint-chip,
//           .problem-chip {
//             font-size: 8px;
//           }

//           .action-row {
//             flex-direction: column-reverse;

//             align-items: stretch;
//           }

//           .back-button,
//           .continue-button {
//             width: 100%;

//             height: 42px;
//           }

//           .bottom-note {
//             align-items: flex-start;

//             font-size: 7px;
//           }

//         }

//         @media (max-width: 380px) {

//           .clinical-container {
//             padding: 15px 11px;
//           }

//           .header-icon {
//             width: 34px;
//             height: 34px;
//           }

//           .header-text h1 {
//             font-size: 16px;
//           }

//           .info-banner {
//             padding: 10px;
//           }

//           .clinical-section {
//             padding: 13px;
//           }

//           .section-number {
//             width: 27px;
//             height: 27px;
//           }

//         }

//         @media (prefers-reduced-motion: reduce) {

//           .spinner {
//             animation: none;
//           }

//           .clinical-section,
//           .joint-chip,
//           .problem-chip,
//           .back-button,
//           .continue-button {
//             transition: none;
//           }

//         }

//       `}</style>

//     </div>
//   );
// };

// export default HemophiliaDetailsScreen;
















import React, { useEffect, useState } from "react";
import api from "../apiClient";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";


// =====================================================
// DOCTOR NAME TRANSLATIONS
// =====================================================
// Doctor names are normally proper names, but the current
// registered doctors are translated here because the UI
// requirement is to display their names in Hindi/Marathi.
//
// The professional ID is used as the stable key so that
// changing the doctor's name in the database does not
// accidentally translate the wrong doctor.
const DOCTOR_NAME_TRANSLATIONS = {
//   hi: {
//     DOC001: "डॉ. सुहानी सूर्यवंशी",
//     DOC002: "डॉ. टेस्ट डॉक्टर",
//     DOC003: "आयुष सोनी",
//   },
//   mr: {
//     DOC001: "डॉ. सुहानी सूर्यवंशी",
//     DOC002: "डॉ. टेस्ट डॉक्टर",
//     DOC003: "आयुष सोनी",
//   },
};

const getDoctorDisplayName = (doctor, language) => {
  if (!doctor) return "";

  if (language === "en") {
    return doctor.fullName || "";
  }

  return (
    DOCTOR_NAME_TRANSLATIONS[language]?.[doctor.professionalId] ||
    doctor.fullName ||
    ""
  );
};

// =====================================================
// MULTI-SELECT MEDICATION DROPDOWN
// =====================================================

const MedicationDropdown = ({ value, onChange, txt }) => {
  const [open, setOpen] = useState(false);

  const selectedValues = Array.isArray(value) ? value : [];

  const options = [
    {
      value: "Tranexamic acid",
      label: txt.medicationOptions.tranexamicAcid,
    },
    {
      value: "Paracetamol / Acetaminophen",
      label: txt.medicationOptions.paracetamol,
    },
    {
      value: "Iron supplement",
      label: txt.medicationOptions.iron,
    },
    {
      value: "Pain medication",
      label: txt.medicationOptions.painMedication,
    },
    {
      value: "Other",
      label: txt.medicationOptions.other,
    },
    {
      value: "None",
      label: txt.medicationOptions.none,
    },
  ];

  const toggleOption = (optionValue) => {
    let updated = [...selectedValues];

    // "None" is mutually exclusive with every medication.
    if (optionValue === "None") {
      onChange(["None"]);
      setOpen(false);
      return;
    }

    // Remove None if a real medication is selected.
    updated = updated.filter((item) => item !== "None");

    if (updated.includes(optionValue)) {
      updated = updated.filter((item) => item !== optionValue);
    } else {
      updated.push(optionValue);
    }

    onChange(updated);
  };

  const selectedLabels = options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label);

  return (
    <div className="medication-dropdown">
      <button
        type="button"
        className="medication-dropdown-button"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="medication-dropdown-value">
          {selectedLabels.length > 0
            ? selectedLabels.join(", ")
            : txt.medicationOptions.placeholder}
        </span>

        <span className="medication-dropdown-arrow">
          {open ? "⌃" : "⌄"}
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="medication-dropdown-overlay"
            aria-label="Close medication dropdown"
            onClick={() => setOpen(false)}
          />

          <div className="medication-dropdown-menu">
            {options.map((option) => (
              <label
                key={option.value}
                className="medication-option"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                />

                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const HemophiliaDetailsScreen = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  // =====================================================
  // LANGUAGE
  // =====================================================

  const currentLanguage =
    (i18n.language || "en").split("-")[0];

  const language = ["en", "hi", "mr"].includes(
    currentLanguage
  )
    ? currentLanguage
    : "en";

  // =====================================================
  // TRANSLATIONS
  // =====================================================

  const TEXT = {
    en: {

      treatmentOptions: {
    title: "Current Hemophilia Treatment",
    label: "Current treatment",
    placeholder: "Select current treatment",
    none: "No current treatment",
    factorVIII: "Factor VIII",
    factorIX: "Factor IX",
    extendedVIII: "Extended half-life Factor VIII",
    extendedIX: "Extended half-life Factor IX",
    emicizumab: "Emicizumab",
    bypassingAgent: "Bypassing agent",
    other: "Other",
    otherPlaceholder: "Please specify other treatment",
  },

  medicationOptions: {
    title: "Other Medications",
    label: "Medications you are currently taking",
    placeholder: "Select medications",
    none: "None",
    tranexamicAcid: "Tranexamic acid",
    paracetamol: "Paracetamol / Acetaminophen",
    iron: "Iron supplement",
    painMedication: "Pain medication",
    other: "Other",
    otherPlaceholder: "Please specify other medication",
  },
      eyebrow: "PATIENT CLINICAL PROFILE",

      title: "Hemophilia Clinical Details",

      subtitle:
        "Provide your existing clinical information to help personalize your care guidance.",

      accurateTitle:
        "Keep your information accurate",

      accurateText:
        "These details help the application understand your current hemophilia profile, bleeding pattern, physiotherapy, and care needs.",

      classification:
        "Clinical Classification",

      classificationDesc:
        "Basic information about your diagnosis",

      type:
        "Type of Hemophilia",

      selectType:
        "Select type",

      typeA:
        "Hemophilia A",

      typeB:
        "Hemophilia B",

      typeC:
        "Hemophilia C",

      severity:
        "Severity",

      selectSeverity:
        "Select severity",

      mild:
        "Mild",

      moderate:
        "Moderate",

      severe:
        "Severe",

      ageDiagnosis:
        "Age at Diagnosis",

      enterAge:
        "Enter age",

      treatment:
        "Treatment Profile",

      treatmentDesc:
        "Your current treatment and medications",

      factorTherapy:
        "Current Hemophilia Treatment",

      factorPlaceholder:
        "e.g. Factor VIII replacement",

      medications:
        "Medications You Are Currently Taking",

      medicationsPlaceholder:
        "Enter medications if any",

      bleeding:
        "Bleeding Pattern",

      bleedingDesc:
        "Information about your bleeding history and affected joints",

      bleedingPattern:
        "Bleeding Pattern",

      selectPattern:
        "Select bleeding pattern",

      spontaneous:
        "Spontaneous bleeding",

      trauma:
        "Bleeding after injury / trauma",

      procedure:
        "Bleeding after medical or dental procedure",

      mixed:
        "Mixed / more than one pattern",

      other:
        "Other",

      affectedJoints:
        "Affected Joints",

      affectedJointsHelp:
        "Select all joints that are currently affected or have experienced bleeding.",

      selectedJoints:
        "Selected joints",

      noJointsSelected:
        "No joints selected",

      targetJoint:
        "Target Joint",

      selectTargetJoint:
        "Select target joint",

      none:
        "None",

      knee:
        "Knee",

      ankle:
        "Ankle",

      hip:
        "Hip",

      bleedFrequency:
        "Bleed Frequency",

      selectFrequency:
        "Select frequency",

      daily:
        "Daily",

      weekly:
        "Weekly",

      monthly:
        "Monthly",

      quarterly:
        "Every few months",

      rare:
        "Rare",

      lastBleed:
        "Last Bleed Date",

      otherDetails:
        "Any Other Detail",

      otherDetailsPlaceholder:
        "Enter any other information you would like your care team to know",

      physiotherapy:
        "Physiotherapy & Exercise",

      physiotherapyDesc:
        "Tell us about your current or previous physiotherapy experience",

      currentlyPhysio:
        "Are you currently undergoing physiotherapy?",

      selectOption:
        "Select option",

      yes:
        "Yes",

      no:
        "No",

      wherePhysio:
        "Where are you taking physiotherapy?",

      hospital:
        "Hospital",

      clinic:
        "Clinic",

      hemophiliaCentre:
        "Hemophilia Centre",

      home:
        "At home",

      sessions:
        "How many sessions a week?",

      onceWeek:
        "Once a week",

      twoThree:
        "2–3 times a week",

      moreThree:
        "More than 3 sessions a week",

      sessionDuration:
        "How many minutes does each session last?",

      lessTen:
        "Less than 10 minutes",

      tenTwenty:
        "10–20 minutes",

      twentyThirty:
        "20–30 minutes",

      moreThirty:
        "More than 30 minutes",

      affectedBodyPart:
        "Which body part is most affected and currently being treated?",

      treatmentReceived:
        "What kind of treatment are you receiving?",

      stretching:
        "Stretching",

      strengthening:
        "Strengthening",

      balance:
        "Balance exercises",

      generalFitness:
        "General fitness",

      jointMovement:
        "Joint movement exercises",

      painRelief:
        "Exercises for pain relief",

      equipment:
        "Are you using any equipment for exercise?",

      noEquipment:
        "No equipment",

      dumbbells:
        "Dumbbells",

      weightsCuffs:
        "Weight cuffs",

      theraband:
        "Theraband",

      yogaMat:
        "Yoga mat",

      otherEquipment:
        "Other equipment",

      helping:
        "Is physiotherapy helping you?",

      problems:
        "Do you have any problem while exercising or after the session?",

      noProblems:
        "No problem",

      pain:
        "Pain",

      newBleeding:
        "New bleeding",

      stiffness:
        "Stiffness",

      increasedSwelling:
        "Increased swelling",

      tired:
        "Feeling tired",

      previousPhysio:
        "Have you used physiotherapy previously?",

      stoppedWhen:
        "When did you stop physiotherapy?",

      stoppedWhy:
        "Why did you stop physiotherapy?",

      stoppedWhyPlaceholder:
        "Select the main reason",

      noNeed:
        "No longer needed",

      improved:
        "Symptoms improved",

      access:
        "Difficulty accessing physiotherapy",

      cost:
        "Cost / financial reasons",

      time:
        "Time constraints",

      doctor:
        "Consulting Doctor",

      doctorDesc:
        "Select the doctor who is currently managing your hemophilia care.",

      requestDoctorChange:
        "Request Doctor Change",

      requestDoctorChangeTitle:
        "Request a Doctor Change",

      requestDoctorChangeText:
        "Your current doctor must release you before you can select another doctor.",

      changeReason:
        "Reason for changing doctor",

      changeReasonPlaceholder:
        "Please tell us why you would like to change your doctor",

      cancel:
        "Cancel",

      sendRequest:
        "Send Request",

      sendingRequest:
        "Sending...",

      requestPending:
        "Doctor change request is pending. Your current doctor needs to release you.",

      selectDoctor:
        "Select doctor",

      noDoctors:
        "No approved doctors available",

      doctorLoading:
        "Loading doctors...",

      doctorId:
        "Professional ID",

      required:
        "*",

      mobility:
        "Mobility Limitation",

      selectMobility:
        "Select mobility limitation",

      noLimitation:
        "None",

      assistive:
        "Assistive Devices",

      assistivePlaceholder:
        "Select an assistive device",

      assistiveOptions: {
        none: "None",
        kneeBrace: "Knee Brace",
        ankleBrace: "Ankle / Foot Brace",
        elbowBrace: "Elbow Brace",
        wristSupport: "Wrist Support",
        cane: "Cane / Walking Stick",
        crutches: "Crutches",
        walker: "Walker",
        wheelchair: "Wheelchair",
        other: "Other",
      },

      errorRequired:
        "Please complete all required fields.",

      errorDoctor:
        "Unable to load doctors. Please try again.",

      errorSave:
        "Failed to save details. Please try again.",

      save:
        "Save & Continue",

      saving:
        "Saving...",

      back:
        "Back",

      secure:
        "Your clinical information is stored securely and used to personalize your care guidance.",

      previousPhysioSection:
        "Previous Physiotherapy",

      currentPhysioSection:
        "Current Physiotherapy Details",
    },

    // ===================================================
    // HINDI
    // ===================================================

    hi: {

      treatmentOptions: {
        title: "वर्तमान हीमोफीलिया उपचार",
        label: "वर्तमान उपचार",
        placeholder: "वर्तमान उपचार चुनें",
        none: "कोई वर्तमान उपचार नहीं",
        factorVIII: "फैक्टर VIII",
        factorIX: "फैक्टर IX",
        extendedVIII: "एक्सटेंडेड हाफ-लाइफ फैक्टर VIII",
        extendedIX: "एक्सटेंडेड हाफ-लाइफ फैक्टर IX",
        emicizumab: "एमिसिज़ुमैब",
        bypassingAgent: "बायपासिंग एजेंट",
        other: "अन्य",
        otherPlaceholder: "अन्य उपचार लिखें",
      },

      medicationOptions: {
        title: "अन्य दवाएँ",
        label: "वर्तमान में ली जा रही दवाएँ",
        placeholder: "दवाएँ चुनें",
        none: "कोई नहीं",
        tranexamicAcid: "ट्रानेक्सामिक एसिड",
        paracetamol: "पैरासिटामोल / एसीटामिनोफेन",
        iron: "आयरन सप्लीमेंट",
        painMedication: "दर्द की दवा",
        other: "अन्य",
        otherPlaceholder: "अन्य दवा का नाम लिखें",
      },

      eyebrow: "रोगी की चिकित्सीय जानकारी",

      title: "हीमोफीलिया चिकित्सीय विवरण",

      subtitle:
        "अपनी मौजूदा चिकित्सीय जानकारी दें ताकि आपकी देखभाल संबंधी मार्गदर्शन को बेहतर बनाया जा सके।",

      accurateTitle:
        "अपनी जानकारी सही रखें",

      accurateText:
        "ये विवरण आपके हीमोफीलिया प्रोफाइल, रक्तस्राव, फिजियोथेरेपी और देखभाल की जरूरतों को समझने में मदद करते हैं।",

      classification:
        "हीमोफीलिया जानकारी",

      classificationDesc:
        "आपके निदान की मूल जानकारी",

      type:
        "हीमोफीलिया का प्रकार",

      selectType:
        "प्रकार चुनें",

      typeA:
        "हीमोफीलिया A",

      typeB:
        "हीमोफीलिया B",

      typeC:
        "हीमोफीलिया C",

      severity:
        "गंभीरता",

      selectSeverity:
        "गंभीरता चुनें",

      mild:
        "हल्का",

      moderate:
        "मध्यम",

      severe:
        "गंभीर",

      ageDiagnosis:
        "निदान के समय उम्र",

      enterAge:
        "उम्र दर्ज करें",

      treatment:
        "उपचार जानकारी",

      treatmentDesc:
        "आपका वर्तमान उपचार और दवाएँ",

      factorTherapy:
        "वर्तमान हीमोफीलिया उपचार",

      factorPlaceholder:
        "जैसे Factor VIII replacement",

      medications:
        "वर्तमान में ली जा रही दवाएँ",

      medicationsPlaceholder:
        "यदि कोई दवा है तो दर्ज करें",

      bleeding:
        "रक्तस्राव का पैटर्न",

      bleedingDesc:
        "आपके रक्तस्राव के इतिहास और प्रभावित जोड़ों की जानकारी",

      bleedingPattern:
        "रक्तस्राव का पैटर्न",

      selectPattern:
        "पैटर्न चुनें",

      spontaneous:
        "बिना स्पष्ट कारण रक्तस्राव",

      trauma:
        "चोट के बाद रक्तस्राव",

      procedure:
        "चिकित्सीय या दंत प्रक्रिया के बाद रक्तस्राव",

      mixed:
        "मिश्रित / एक से अधिक पैटर्न",

      other:
        "अन्य",

      affectedJoints:
        "प्रभावित जोड़",

      affectedJointsHelp:
        "वर्तमान में प्रभावित या पहले रक्तस्राव वाले सभी जोड़ों को चुनें।",

      selectedJoints:
        "चयनित जोड़",

      noJointsSelected:
        "कोई जोड़ चयनित नहीं है",

      targetJoint:
        "टारगेट जोड़",

      selectTargetJoint:
        "टारगेट जोड़ चुनें",

      none:
        "कोई नहीं",

      knee:
        "घुटना",

      ankle:
        "टखना",

      hip:
        "कूल्हा",

      bleedFrequency:
        "रक्तस्राव की आवृत्ति",

      selectFrequency:
        "आवृत्ति चुनें",

      daily:
        "प्रतिदिन",

      weekly:
        "साप्ताहिक",

      monthly:
        "मासिक",

      quarterly:
        "हर कुछ महीनों में",

      rare:
        "बहुत कम",

      lastBleed:
        "अंतिम रक्तस्राव की तारीख",

      otherDetails:
        "अन्य जानकारी",

      otherDetailsPlaceholder:
        "कोई अन्य जानकारी दर्ज करें जो आपकी देखभाल टीम को पता होनी चाहिए",

      physiotherapy:
        "फिजियोथेरेपी और व्यायाम",

      physiotherapyDesc:
        "अपनी वर्तमान या पिछली फिजियोथेरेपी के बारे में बताएं",

      currentlyPhysio:
        "क्या आप वर्तमान में फिजियोथेरेपी करवा रहे हैं?",

      selectOption:
        "विकल्प चुनें",

      yes:
        "हाँ",

      no:
        "नहीं",

      wherePhysio:
        "आप फिजियोथेरेपी कहाँ करवा रहे हैं?",

      hospital:
        "अस्पताल",

      clinic:
        "क्लिनिक",

      hemophiliaCentre:
        "हीमोफीलिया केंद्र",

      home:
        "घर पर",

      sessions:
        "सप्ताह में कितने सत्र?",

      onceWeek:
        "सप्ताह में एक बार",

      twoThree:
        "सप्ताह में 2–3 बार",

      moreThree:
        "सप्ताह में 3 से अधिक बार",

      sessionDuration:
        "प्रत्येक सत्र कितने मिनट का होता है?",

      lessTen:
        "10 मिनट से कम",

      tenTwenty:
        "10–20 मिनट",

      twentyThirty:
        "20–30 मिनट",

      moreThirty:
        "30 मिनट से अधिक",

      affectedBodyPart:
        "सबसे अधिक प्रभावित और वर्तमान में उपचारित शरीर का भाग कौन सा है?",

      treatmentReceived:
        "आप किस प्रकार का उपचार प्राप्त कर रहे हैं?",

      stretching:
        "स्ट्रेचिंग",

      strengthening:
        "मांसपेशियों को मजबूत करने के व्यायाम",

      balance:
        "संतुलन व्यायाम",

      generalFitness:
        "सामान्य फिटनेस",

      jointMovement:
        "जोड़ों की गति के व्यायाम",

      painRelief:
        "दर्द से राहत के व्यायाम",

      equipment:
        "क्या आप व्यायाम के लिए किसी उपकरण का उपयोग करते हैं?",

      noEquipment:
        "कोई उपकरण नहीं",

      dumbbells:
        "डम्बल",

      weightsCuffs:
        "वेट कफ",

      theraband:
        "थेराबैंड",

      yogaMat:
        "योगा मैट",

      otherEquipment:
        "अन्य उपकरण",

      helping:
        "क्या फिजियोथेरेपी से आपको लाभ हो रहा है?",

      problems:
        "व्यायाम करते समय या सत्र के बाद कोई समस्या होती है?",

      noProblems:
        "कोई समस्या नहीं",

      pain:
        "दर्द",

      newBleeding:
        "नया रक्तस्राव",

      stiffness:
        "जकड़न",

      increasedSwelling:
        "सूजन बढ़ना",

      tired:
        "थकान महसूस होना",

      previousPhysio:
        "क्या आपने पहले फिजियोथेरेपी का उपयोग किया है?",

      stoppedWhen:
        "आपने फिजियोथेरेपी कब बंद की?",

      stoppedWhy:
        "आपने फिजियोथेरेपी क्यों बंद की?",

      stoppedWhyPlaceholder:
        "मुख्य कारण चुनें",

      noNeed:
        "अब आवश्यकता नहीं थी",

      improved:
        "लक्षणों में सुधार हुआ",

      access:
        "फिजियोथेरेपी तक पहुँचने में कठिनाई",

      cost:
        "खर्च / आर्थिक कारण",

      time:
        "समय की समस्या",

      doctor:
        "परामर्श देने वाले डॉक्टर",

      doctorDesc:
        "उस डॉक्टर को चुनें जो वर्तमान में आपकी हीमोफीलिया देखभाल कर रहे हैं।",

      requestDoctorChange:
        "डॉक्टर बदलने का अनुरोध करें",

      requestDoctorChangeTitle:
        "डॉक्टर बदलने का अनुरोध",

      requestDoctorChangeText:
        "दूसरे डॉक्टर को चुनने से पहले आपके वर्तमान डॉक्टर को आपको रिलीज़ करना होगा।",

      changeReason:
        "डॉक्टर बदलने का कारण",

      changeReasonPlaceholder:
        "कृपया बताएं कि आप डॉक्टर क्यों बदलना चाहते हैं",

      cancel:
        "रद्द करें",

      sendRequest:
        "अनुरोध भेजें",

      sendingRequest:
        "भेजा जा रहा है...",

      requestPending:
        "डॉक्टर बदलने का अनुरोध लंबित है। आपके वर्तमान डॉक्टर को आपको रिलीज़ करना होगा।",

      selectDoctor:
        "डॉक्टर चुनें",

      noDoctors:
        "कोई स्वीकृत डॉक्टर उपलब्ध नहीं है",

      doctorLoading:
        "डॉक्टर लोड हो रहे हैं...",

      doctorId:
        "प्रोफेशनल आईडी",

      required:
        "*",

      mobility:
        "चलने-फिरने में कठिनाई",

      selectMobility:
        "चलने-फिरने की कठिनाई चुनें",

      noLimitation:
        "कोई कठिनाई नहीं",

      assistive:
        "सहायक उपकरण",

      assistivePlaceholder:
        "सहायक उपकरण चुनें",

      assistiveOptions: {
        none: "कोई उपकरण नहीं",
        kneeBrace: "घुटने का ब्रेस",
        ankleBrace: "टखने / पैर का ब्रेस",
        elbowBrace: "कोहनी का ब्रेस",
        wristSupport: "कलाई का सहारा",
        cane: "छड़ी / चलने की छड़ी",
        crutches: "बैसाखी",
        walker: "वॉकर",
        wheelchair: "व्हीलचेयर",
        other: "अन्य",
      },

      errorRequired:
        "कृपया सभी आवश्यक जानकारी पूरी करें।",

      errorDoctor:
        "डॉक्टरों की सूची लोड नहीं हो सकी। कृपया फिर प्रयास करें।",

      errorSave:
        "जानकारी सेव नहीं हो सकी। कृपया फिर प्रयास करें।",

      save:
        "सेव करें और आगे बढ़ें",

      saving:
        "सेव हो रहा है...",

      back:
        "वापस",

      secure:
        "आपकी चिकित्सीय जानकारी सुरक्षित रूप से संग्रहीत की जाती है और आपकी देखभाल संबंधी मार्गदर्शन को व्यक्तिगत बनाने के लिए उपयोग की जाती है।",

      previousPhysioSection:
        "पिछली फिजियोथेरेपी",

      currentPhysioSection:
        "वर्तमान फिजियोथेरेपी विवरण",
    },

    // ===================================================
    // MARATHI
    // ===================================================

    mr: {

      treatmentOptions: {
        title: "सध्याचा हिमोफिलिया उपचार",
        label: "सध्याचा उपचार",
        placeholder: "सध्याचा उपचार निवडा",
        none: "सध्या कोणताही उपचार नाही",
        factorVIII: "फॅक्टर VIII",
        factorIX: "फॅक्टर IX",
        extendedVIII: "एक्स्टेंडेड हाफ-लाइफ फॅक्टर VIII",
        extendedIX: "एक्स्टेंडेड हाफ-लाइफ फॅक्टर IX",
        emicizumab: "एमिसिझुमॅब",
        bypassingAgent: "बायपासिंग एजंट",
        other: "इतर",
        otherPlaceholder: "इतर उपचार लिहा",
      },

      medicationOptions: {
        title: "इतर औषधे",
        label: "सध्या घेत असलेली औषधे",
        placeholder: "औषधे निवडा",
        none: "एकही नाही",
        tranexamicAcid: "ट्रॅनेक्सॅमिक अॅसिड",
        paracetamol: "पॅरासिटामॉल / अॅसिटामिनोफेन",
        iron: "आयर्न सप्लिमेंट",
        painMedication: "वेदनेवरील औषध",
        other: "इतर",
        otherPlaceholder: "इतर औषधाचे नाव लिहा",
      },

      eyebrow: "रुग्णाची वैद्यकीय माहिती",

      title: "हिमोफिलिया वैद्यकीय तपशील",

      subtitle:
        "तुमच्या काळजीचे मार्गदर्शन वैयक्तिक करण्यासाठी तुमची सध्याची वैद्यकीय माहिती द्या.",

      accurateTitle:
        "तुमची माहिती अचूक ठेवा",

      accurateText:
        "ही माहिती तुमची हिमोफिलिया स्थिती, रक्तस्त्रावाचा नमुना, फिजिओथेरपी आणि काळजीच्या गरजा समजून घेण्यास मदत करते.",

      classification:
        "हिमोफिलिया माहिती",

      classificationDesc:
        "तुमच्या निदानाची मूलभूत माहिती",

      type:
        "हिमोफिलियाचा प्रकार",

      selectType:
        "प्रकार निवडा",

      typeA:
        "हिमोफिलिया A",

      typeB:
        "हिमोफिलिया B",

      typeC:
        "हिमोफिलिया C",

      severity:
        "तीव्रता",

      selectSeverity:
        "तीव्रता निवडा",

      mild:
        "सौम्य",

      moderate:
        "मध्यम",

      severe:
        "गंभीर",

      ageDiagnosis:
        "निदानाच्या वेळी वय",

      enterAge:
        "वय प्रविष्ट करा",

      treatment:
        "उपचाराची माहिती",

      treatmentDesc:
        "तुमचे सध्याचे उपचार आणि औषधे",

      factorTherapy:
        "सध्याचा हिमोफिलिया उपचार",

      factorPlaceholder:
        "उदा. Factor VIII replacement",

      medications:
        "सध्या घेत असलेली औषधे",

      medicationsPlaceholder:
        "औषधे असल्यास प्रविष्ट करा",

      bleeding:
        "रक्तस्त्रावाचा नमुना",

      bleedingDesc:
        "तुमच्या रक्तस्त्रावाचा इतिहास आणि प्रभावित सांध्यांची माहिती",

      bleedingPattern:
        "रक्तस्त्रावाचा नमुना",

      selectPattern:
        "नमुना निवडा",

      spontaneous:
        "स्वतःहून होणारा रक्तस्त्राव",

      trauma:
        "इजा / दुखापतीनंतर रक्तस्त्राव",

      procedure:
        "वैद्यकीय किंवा दंत प्रक्रियेनंतर रक्तस्त्राव",

      mixed:
        "मिश्र / एकापेक्षा जास्त नमुने",

      other:
        "इतर",

      affectedJoints:
        "प्रभावित सांधे",

      affectedJointsHelp:
        "सध्या प्रभावित असलेले किंवा पूर्वी रक्तस्त्राव झालेले सर्व सांधे निवडा.",

      selectedJoints:
        "निवडलेले सांधे",

      noJointsSelected:
        "कोणताही सांधा निवडलेला नाही",

      targetJoint:
        "टार्गेट सांधा",

      selectTargetJoint:
        "टार्गेट सांधा निवडा",

      none:
        "कोणताही नाही",

      knee:
        "गुडघा",

      ankle:
        "घोटा",

      hip:
        "नितंब",

      bleedFrequency:
        "रक्तस्त्रावाची वारंवारता",

      selectFrequency:
        "वारंवारता निवडा",

      daily:
        "दररोज",

      weekly:
        "आठवड्यातून",

      monthly:
        "मासिक",

      quarterly:
        "दर काही महिन्यांनी",

      rare:
        "क्वचित",

      lastBleed:
        "शेवटच्या रक्तस्त्रावाची तारीख",

      otherDetails:
        "इतर माहिती",

      otherDetailsPlaceholder:
        "तुमच्या काळजीच्या टीमला माहीत असावी अशी इतर माहिती प्रविष्ट करा",

      physiotherapy:
        "फिजिओथेरपी आणि व्यायाम",

      physiotherapyDesc:
        "तुमच्या सध्याच्या किंवा पूर्वीच्या फिजिओथेरपीबद्दल माहिती द्या",

      currentlyPhysio:
        "तुम्ही सध्या फिजिओथेरपी घेत आहात का?",

      selectOption:
        "पर्याय निवडा",

      yes:
        "होय",

      no:
        "नाही",

      wherePhysio:
        "तुम्ही फिजिओथेरपी कुठे घेत आहात?",

      hospital:
        "रुग्णालय",

      clinic:
        "क्लिनिक",

      hemophiliaCentre:
        "हिमोफिलिया केंद्र",

      home:
        "घरी",

      sessions:
        "आठवड्यात किती सत्रे?",

      onceWeek:
        "आठवड्यातून एकदा",

      twoThree:
        "आठवड्यातून 2–3 वेळा",

      moreThree:
        "आठवड्यातून 3 पेक्षा जास्त वेळा",

      sessionDuration:
        "प्रत्येक सत्र किती मिनिटांचे असते?",

      lessTen:
        "10 मिनिटांपेक्षा कमी",

      tenTwenty:
        "10–20 मिनिटे",

      twentyThirty:
        "20–30 मिनिटे",

      moreThirty:
        "30 मिनिटांपेक्षा जास्त",

      affectedBodyPart:
        "सध्या उपचार घेत असलेला सर्वाधिक प्रभावित शरीराचा भाग कोणता?",

      treatmentReceived:
        "तुम्ही कोणत्या प्रकारचे उपचार घेत आहात?",

      stretching:
        "स्ट्रेचिंग",

      strengthening:
        "स्नायू मजबूत करण्याचे व्यायाम",

      balance:
        "संतुलन व्यायाम",

      generalFitness:
        "सामान्य फिटनेस",

      jointMovement:
        "सांध्यांच्या हालचालीचे व्यायाम",

      painRelief:
        "वेदना कमी करण्यासाठी व्यायाम",

      equipment:
        "तुम्ही व्यायामासाठी कोणतेही उपकरण वापरता का?",

      noEquipment:
        "कोणतेही उपकरण नाही",

      dumbbells:
        "डम्बेल्स",

      weightsCuffs:
        "वेट कफ",

      theraband:
        "थेराबँड",

      yogaMat:
        "योगा मॅट",

      otherEquipment:
        "इतर उपकरण",

      helping:
        "फिजिओथेरपीमुळे तुम्हाला फायदा होत आहे का?",

      problems:
        "व्यायाम करताना किंवा सत्रानंतर काही समस्या होतात का?",

      noProblems:
        "कोणतीही समस्या नाही",

      pain:
        "वेदना",

      newBleeding:
        "नवीन रक्तस्त्राव",

      stiffness:
        "ताठरपणा",

      increasedSwelling:
        "सूज वाढणे",

      tired:
        "थकवा जाणवणे",

      previousPhysio:
        "तुम्ही यापूर्वी फिजिओथेरपी घेतली आहे का?",

      stoppedWhen:
        "तुम्ही फिजिओथेरपी कधी थांबवली?",

      stoppedWhy:
        "तुम्ही फिजिओथेरपी का थांबवली?",

      stoppedWhyPlaceholder:
        "मुख्य कारण निवडा",

      noNeed:
        "आता गरज नव्हती",

      improved:
        "लक्षणांमध्ये सुधारणा झाली",

      access:
        "फिजिओथेरपी मिळवण्यात अडचण",

      cost:
        "खर्च / आर्थिक कारणे",

      time:
        "वेळेची समस्या",

      doctor:
        "सल्ला देणारे डॉक्टर",

      doctorDesc:
        "सध्या तुमच्या हिमोफिलिया उपचाराचे व्यवस्थापन करणारे डॉक्टर निवडा.",

      requestDoctorChange:
        "डॉक्टर बदलण्याची विनंती करा",

      requestDoctorChangeTitle:
        "डॉक्टर बदलण्याची विनंती",

      requestDoctorChangeText:
        "दुसरा डॉक्टर निवडण्यापूर्वी तुमच्या सध्याच्या डॉक्टरांनी तुम्हाला रिलीज करणे आवश्यक आहे.",

      changeReason:
        "डॉक्टर बदलण्याचे कारण",

      changeReasonPlaceholder:
        "तुम्हाला डॉक्टर का बदलायचे आहेत ते कृपया सांगा",

      cancel:
        "रद्द करा",

      sendRequest:
        "विनंती पाठवा",

      sendingRequest:
        "पाठवत आहे...",

      requestPending:
        "डॉक्टर बदलण्याची विनंती प्रलंबित आहे. तुमच्या सध्याच्या डॉक्टरांनी तुम्हाला रिलीज करणे आवश्यक आहे.",

      selectDoctor:
        "डॉक्टर निवडा",

      noDoctors:
        "कोणतेही मंजूर डॉक्टर उपलब्ध नाहीत",

      doctorLoading:
        "डॉक्टर लोड होत आहेत...",

      doctorId:
        "प्रोफेशनल आयडी",

      required:
        "*",

      mobility:
        "हालचालींमध्ये मर्यादा",

      selectMobility:
        "हालचालींची मर्यादा निवडा",

      noLimitation:
        "कोणतीही मर्यादा नाही",

      assistive:
        "सहाय्यक उपकरणे",

      assistivePlaceholder:
        "सहाय्यक उपकरण निवडा",

      assistiveOptions: {
        none: "कोणतेही उपकरण नाही",
        kneeBrace: "गुडघ्याचा ब्रेस",
        ankleBrace: "घोटा / पायाचा ब्रेस",
        elbowBrace: "कोपराचा ब्रेस",
        wristSupport: "मनगटाचा आधार",
        cane: "काठी / चालण्याची काठी",
        crutches: "कुबड्या",
        walker: "वॉकर",
        wheelchair: "व्हीलचेअर",
        other: "इतर",
      },

      errorRequired:
        "कृपया सर्व आवश्यक माहिती पूर्ण करा.",

      errorDoctor:
        "डॉक्टरांची यादी लोड करता आली नाही. कृपया पुन्हा प्रयत्न करा.",

      errorSave:
        "माहिती सेव्ह करता आली नाही. कृपया पुन्हा प्रयत्न करा.",

      save:
        "सेव्ह करा आणि पुढे जा",

      saving:
        "सेव्ह होत आहे...",

      back:
        "मागे",

      secure:
        "तुमची वैद्यकीय माहिती सुरक्षितपणे साठवली जाते आणि तुमचे काळजी मार्गदर्शन वैयक्तिक करण्यासाठी वापरली जाते.",

      previousPhysioSection:
        "पूर्वीची फिजिओथेरपी",

      currentPhysioSection:
        "सध्याचे फिजिओथेरपी तपशील",
    }
  
  };

  const txt =
    TEXT[language] || TEXT.en;

  // =====================================================
  // FORM
  // =====================================================

  const [form, setForm] = useState({
  type: "",
  severity: "",
  ageAtDiagnosis: "",

  familyHistory: "",
  geneticTestingDone: "",

  currentFactorTherapy: "",
  otherCurrentTreatment: "",

  otherMedications: [],
  otherMedicationDetails: "",

  bleedingPattern: "",
  jointsAffected: [],
  targetJoint: "",
  bleedFrequency: "",
  lastBleedDate: "",
  otherBleedingDetails: "",

  underPhysiotherapy: "",
  physiotherapyLocation: "",
  physiotherapySessions: "",
  physiotherapyDuration: "",
  physiotherapyBodyPart: "",
  physiotherapyTreatment: "",
  physiotherapyEquipment: "",
  physiotherapyHelping: "",
  physiotherapyProblems: [],

  previousPhysiotherapy: "",
  physiotherapyStoppedDate: "",
  physiotherapyStoppedReason: "",

  mobilityLimitation: "",
  assistiveDevices: "",

  consultingDoctorId: "",
});

  // =====================================================
  // DOCTORS
  // =====================================================

  const [doctors, setDoctors] =
    useState([]);

  const [doctorsLoading, setDoctorsLoading] =
    useState(true);

  // =====================================================
  // UI STATE
  // =====================================================

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

    // =====================================================
// DOCTOR ASSIGNMENT / CHANGE REQUEST STATE
// =====================================================

const [doctorStatusLoading, setDoctorStatusLoading] =
  useState(true);

// IMPORTANT:
// This becomes true only when a doctor assignment already exists
// in the saved patient record, or after Save & Continue succeeds.
// Merely selecting a doctor in the dropdown must NOT lock it.
const [doctorAssignmentSaved, setDoctorAssignmentSaved] =
  useState(false);

const [pendingDoctorChangeRequest, setPendingDoctorChangeRequest] =
  useState(null);

const [changeRequestModalOpen, setChangeRequestModalOpen] =
  useState(false);

const [changeRequestReason, setChangeRequestReason] =
  useState("");

const [changeRequestLoading, setChangeRequestLoading] =
  useState(false);

  // =====================================================
  // LOAD APPROVED DOCTORS
  // =====================================================

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setDoctorsLoading(true);

        
          const response =
            await api.get(
              `/hemophilia-details/doctors?language=${language}`
            );

        const list =
          response.data?.doctors || [];

        setDoctors(
          Array.isArray(list)
            ? list
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load doctors:",
          err
        );

        setError(
          txt.errorDoctor
        );
      } finally {
        setDoctorsLoading(false);
      }
    };

    loadDoctors();
  }, [language]);

  // =====================================================
// LOAD CURRENT DOCTOR ASSIGNMENT
// =====================================================

useEffect(() => {
  const loadDoctorStatus = async () => {
    try {
      setDoctorStatusLoading(true);

      const response =
        await api.get(
          "/hemophilia-details/doctor-change-status"
        );

      const assignedDoctor =
        response.data?.assignedDoctor || null;

      const pendingRequest =
        response.data?.pendingRequest || null;

      // -----------------------------------------------
      // RESTORE CURRENT DOCTOR
      // -----------------------------------------------

      setForm((prev) => ({
        ...prev,

        consultingDoctorId:
          assignedDoctor?._id || "",
      }));

      // Only a doctor that already exists in the saved record
      // should make the field read-only.
      setDoctorAssignmentSaved(
        Boolean(assignedDoctor?._id)
      );

      // -----------------------------------------------
      // RESTORE PENDING REQUEST
      // -----------------------------------------------

      setPendingDoctorChangeRequest(
        pendingRequest
      );
    } catch (err) {
      console.error(
        "Failed to load doctor assignment status:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load your doctor assignment."
      );
    } finally {
      setDoctorStatusLoading(false);
    }
  };

  loadDoctorStatus();
}, []);

// =====================================================
// DOCTOR ASSIGNMENT HELPERS
// =====================================================

// Selecting a doctor in the dropdown changes form.consultingDoctorId
// immediately, but that does NOT mean the assignment is saved.
const doctorAssigned =
  doctorAssignmentSaved;

const doctorChangePending =
  Boolean(pendingDoctorChangeRequest);

// Before the first Save & Continue:
//   doctorStatusLoading -> false
//   doctorsLoading -> false
//   doctorAssignmentSaved -> false
// therefore the dropdown stays editable.
//
// After the first successful Save & Continue, or when an already-saved
// assignment is loaded from the backend, the field becomes locked.
const doctorFieldLocked =
  doctorStatusLoading ||
  doctorsLoading ||
  (
    doctorAssignmentSaved &&
    pendingDoctorChangeRequest?.status !== "RELEASED"
  );


  // =====================================================
// REQUEST DOCTOR CHANGE
// =====================================================

const handleDoctorChangeRequest =
  async () => {
    setError("");

    try {
      setChangeRequestLoading(true);

      const response =
        await api.post(
          "/hemophilia-details/doctor-change-request",
          {
            reason:
              changeRequestReason.trim(),
          }
        );

      setPendingDoctorChangeRequest(
        response.data?.request || {
          status: "PENDING",
        }
      );

      setChangeRequestReason("");

      setChangeRequestModalOpen(false);
    } catch (err) {
      console.error(
        "Doctor change request failed:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to submit doctor change request."
      );
    } finally {
      setChangeRequestLoading(false);
    }
  };
  // =====================================================
  // UPDATE FIELD
  // =====================================================

  const updateField = (
    field,
    value
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =====================================================
  // TOGGLE JOINT
  // =====================================================

  const toggleJoint = (
    joint
  ) => {
    setForm((prev) => {
      const exists =
        prev.jointsAffected.includes(
          joint
        );

      return {
        ...prev,

        jointsAffected: exists
          ? prev.jointsAffected.filter(
              (j) => j !== joint
            )
          : [
              ...prev.jointsAffected,
              joint,
            ],
      };
    });
  };

  // =====================================================
  // TOGGLE PHYSIO PROBLEM
  // =====================================================

  const togglePhysioProblem =
    (problem) => {
      setForm((prev) => {
        const exists =
          prev.physiotherapyProblems.includes(
            problem
          );

        return {
          ...prev,

          physiotherapyProblems:
            exists
              ? prev.physiotherapyProblems.filter(
                  (p) => p !== problem
                )
              : [
                  ...prev.physiotherapyProblems,
                  problem,
                ],
        };
      });
    };

  // =====================================================
  // REQUIRED VALIDATION
  // =====================================================

  const handleSubmit = async () => {
    setError("");

    if (
      !form.type ||
      !form.severity ||
      !form.bleedingPattern ||
      !form.bleedFrequency ||
      !form.consultingDoctorId ||
      form.underPhysiotherapy === ""
    ) {
      setError(
        txt.errorRequired
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    // -----------------------------------------------
    // IF CURRENTLY IN PHYSIOTHERAPY
    // -----------------------------------------------

    if (
      form.underPhysiotherapy === true
    ) {
      if (
        !form.physiotherapyLocation ||
        !form.physiotherapySessions ||
        !form.physiotherapyDuration ||
        !form.physiotherapyBodyPart ||
        !form.physiotherapyTreatment ||
        !form.physiotherapyEquipment ||
        !form.physiotherapyHelping
      ) {
        setError(
          txt.errorRequired
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }
    }

    // -----------------------------------------------
    // IF NOT CURRENTLY IN PHYSIO
    // -----------------------------------------------

    if (
      form.underPhysiotherapy === false &&
      form.previousPhysiotherapy === ""
    ) {
      setError(
        txt.errorRequired
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (
      form.underPhysiotherapy === false &&
      form.previousPhysiotherapy === true &&
      (
        !form.physiotherapyStoppedDate ||
        !form.physiotherapyStoppedReason
      )
    ) {
      setError(
        txt.errorRequired
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    setLoading(true);

    try {
      await api.post(
        "/hemophilia-details",
        form
      );

      // Generate persistent ML exercise recommendations after the
      // clinical details have been successfully saved.
      // A recommendation is only created once and starts as
      // PENDING_DOCTOR_REVIEW.
      try {
        await api.post("/exercise-recommendations/generate");
      } catch (recommendationError) {
        console.error(
          "Exercise recommendation generation failed:",
          recommendationError
        );
        // Clinical details were already saved, so do not block
        // the patient from continuing through the care flow.
      }

      // The assignment is now actually persisted in the database.
      // Only NOW should the consulting-doctor field become locked.
      setDoctorAssignmentSaved(
        Boolean(form.consultingDoctorId)
      );

      // =============================================
      // NEXT STEP
      // =============================================
      // After saving the clinical details and generating the
      // exercise recommendations, take the patient to the
      // Exercise Recommendation / Exercise Plan screen.
      // Do NOT send the patient directly to Care Guidance.

      navigate("/exercise-plan");

    } catch (err) {
      console.error(
        "Failed to save hemophilia details:",
        err
      );

      setError(
        err.response?.data?.message ||
          txt.errorSave
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // SECTION STATUS
  // =====================================================

  const classificationDone =
    form.type &&
    form.severity;

  const bleedingDone =
    form.bleedingPattern &&
    form.bleedFrequency;

  const physioDone =
    form.underPhysiotherapy !== "";

  // =====================================================
  // JOINTS
  // =====================================================

  // ponytail: Elbow/Shoulder/Wrist dropped per G2-C2 (D4) — no engine
  // mapping exists for them. Existing DB rows with those joints are
  // handled server-side in exerciseRecommendations.js (G2-C3), not here.
  const joints = [
    {
      value: "Knee",
      label: txt.knee,
    },
    {
      value: "Ankle",
      label: txt.ankle,
    },
    {
      value: "Hip",
      label: txt.hip,
    },
  ];

  return (
    <div className="clinical-page">

      <div className="clinical-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="clinical-header">

          <div className="header-icon">
            +
          </div>

          <div className="header-text">

            <span className="header-eyebrow">
              {txt.eyebrow}
            </span>

            <h1>
              {txt.title}
            </h1>

            <p>
              {txt.subtitle}
            </p>

          </div>

        </div>


        {/* =================================================
            INFO
        ================================================= */}

        <div className="info-banner">

          <div className="info-banner-icon">
            i
          </div>

          <div>

            <strong>
              {txt.accurateTitle}
            </strong>

            <p>
              {txt.accurateText}
            </p>

          </div>

        </div>


        {/* =================================================
            SECTION 01
        ================================================= */}

        <div
          className={`clinical-section ${
            classificationDone
              ? "section-complete"
              : ""
          }`}
        >

          <div className="section-header">

            <div className="section-number">
              01
            </div>

            <div>

              <h2>
                {txt.classification}
              </h2>

              <p>
                {txt.classificationDesc}
              </p>

            </div>

            {classificationDone && (
              <div className="completion-mark">
                ✓
              </div>
            )}

          </div>


          <div className="form-grid">

            {/* TYPE */}

            <div className="field">

              <label>
                {txt.type}
                <span className="required">
                  {txt.required}
                </span>
              </label>

              <select
                value={form.type}
                onChange={(e) =>
                  updateField(
                    "type",
                    e.target.value
                  )
                }
              >

                <option value="">
                  {txt.selectType}
                </option>

                <option value="A">
                  {txt.typeA}
                </option>

                <option value="B">
                  {txt.typeB}
                </option>

                <option value="C">
                  {txt.typeC}
                </option>

              </select>

            </div>


            {/* SEVERITY */}

            <div className="field">

              <label>
                {txt.severity}
                <span className="required">
                  {txt.required}
                </span>
              </label>

              <select
                value={form.severity}
                onChange={(e) =>
                  updateField(
                    "severity",
                    e.target.value
                  )
                }
              >

                <option value="">
                  {txt.selectSeverity}
                </option>

                <option value="Mild">
                  {txt.mild}
                </option>

                <option value="Moderate">
                  {txt.moderate}
                </option>

                <option value="Severe">
                  {txt.severe}
                </option>

              </select>

            </div>


            {/* AGE */}

            <div className="field">

              <label>
                {txt.ageDiagnosis}
              </label>

              <input
                type="number"
                min="0"
                max="120"
                placeholder={
                  txt.enterAge
                }
                value={
                  form.ageAtDiagnosis
                }
                onChange={(e) =>
                  updateField(
                    "ageAtDiagnosis",
                    e.target.value
                  )
                }
              />

            </div>

          </div>

        </div>


        {/* =================================================
            SECTION 02 - TREATMENT
        ================================================= */}

        <div className="clinical-section">

          <div className="section-header">

            <div className="section-number">
              02
            </div>

            <div>

              <h2>
                {txt.treatment}
              </h2>

              <p>
                {txt.treatmentDesc}
              </p>

            </div>

          </div>


          <div className="form-grid two-columns">

            {/* CURRENT HEMOPHILIA TREATMENT */}

            <div className="field">

              <label>
                {txt.factorTherapy}
              </label>

              <select
                value={form.currentFactorTherapy}
                onChange={(e) => {
                  updateField(
                    "currentFactorTherapy",
                    e.target.value
                  );

                  if (e.target.value !== "Other") {
                    updateField(
                      "otherCurrentTreatment",
                      ""
                    );
                  }
                }}
              >

                <option value="">
                  {txt.treatmentOptions.placeholder}
                </option>

                <option value="None">
                  {txt.treatmentOptions.none}
                </option>

                <option value="Factor VIII">
                  {txt.treatmentOptions.factorVIII}
                </option>

                <option value="Factor IX">
                  {txt.treatmentOptions.factorIX}
                </option>

                <option value="Extended half-life Factor VIII">
                  {txt.treatmentOptions.extendedVIII}
                </option>

                <option value="Extended half-life Factor IX">
                  {txt.treatmentOptions.extendedIX}
                </option>

                <option value="Emicizumab">
                  {txt.treatmentOptions.emicizumab}
                </option>

                <option value="Bypassing agent">
                  {txt.treatmentOptions.bypassingAgent}
                </option>

                <option value="Other">
                  {txt.treatmentOptions.other}
                </option>

              </select>

            </div>


            {/* OTHER TREATMENT */}

            {form.currentFactorTherapy === "Other" && (
              <div className="field">

                <label>
                  {txt.treatmentOptions.other}
                </label>

                <input
                  type="text"
                  placeholder={
                    txt.treatmentOptions.otherPlaceholder
                  }
                  value={
                    form.otherCurrentTreatment
                  }
                  onChange={(e) =>
                    updateField(
                      "otherCurrentTreatment",
                      e.target.value
                    )
                  }
                />

              </div>
            )}


            {/* OTHER MEDICATIONS */}

            <div className="field">

              <label>
                {txt.medications}
              </label>

              <MedicationDropdown
                value={form.otherMedications}
                onChange={(values) =>
                  updateField(
                    "otherMedications",
                    values
                  )
                }
                txt={txt}
              />

            </div>


            {/* OTHER MEDICATION DETAILS */}

            {form.otherMedications.includes("Other") && (
              <div className="field">

                <label>
                  {txt.medicationOptions.other}
                </label>

                <input
                  type="text"
                  placeholder={
                    txt.medicationOptions.otherPlaceholder
                  }
                  value={
                    form.otherMedicationDetails
                  }
                  onChange={(e) =>
                    updateField(
                      "otherMedicationDetails",
                      e.target.value
                    )
                  }
                />

              </div>
            )}

          </div>

        </div>


        {/* =================================================
            SECTION 03 - BLEEDING
        ================================================= */}

        <div
          className={`clinical-section ${
            bleedingDone
              ? "section-complete"
              : ""
          }`}
        >

          <div className="section-header">

            <div className="section-number">
              03
            </div>

            <div>

              <h2>
                {txt.bleeding}
              </h2>

              <p>
                {txt.bleedingDesc}
              </p>

            </div>

            {bleedingDone && (
              <div className="completion-mark">
                ✓
              </div>
            )}

          </div>


          {/* BLEEDING PATTERN */}

          <div className="form-grid two-columns">

            <div className="field">

              <label>
                {txt.bleedingPattern}
                <span className="required">
                  {txt.required}
                </span>
              </label>

              <select
                value={
                  form.bleedingPattern
                }
                onChange={(e) =>
                  updateField(
                    "bleedingPattern",
                    e.target.value
                  )
                }
              >

                <option value="">
                  {txt.selectPattern}
                </option>

                <option value="Spontaneous">
                  {txt.spontaneous}
                </option>

                <option value="Trauma-related">
                  {txt.trauma}
                </option>

                <option value="Post-procedure">
                  {txt.procedure}
                </option>

                <option value="Mixed">
                  {txt.mixed}
                </option>

                <option value="Other">
                  {txt.other}
                </option>

              </select>

            </div>


            {/* FREQUENCY */}

            <div className="field">

              <label>
                {txt.bleedFrequency}
                <span className="required">
                  {txt.required}
                </span>
              </label>

              <select
                value={
                  form.bleedFrequency
                }
                onChange={(e) =>
                  updateField(
                    "bleedFrequency",
                    e.target.value
                  )
                }
              >

                <option value="">
                  {txt.selectFrequency}
                </option>

                <option value="Daily">
                  {txt.daily}
                </option>

                <option value="Weekly">
                  {txt.weekly}
                </option>

                <option value="Monthly">
                  {txt.monthly}
                </option>

                <option value="Every few months">
                  {txt.quarterly}
                </option>

                <option value="Rare">
                  {txt.rare}
                </option>

              </select>

            </div>

          </div>


          {/* AFFECTED JOINTS - MULTI SELECT */}

          <div className="field joint-field">

            <label>
              {txt.affectedJoints}
            </label>

            <p className="field-help">
              {txt.affectedJointsHelp}
            </p>

            <div className="joint-grid">
              {joints.map((joint) => {
                const selected =
                  Array.isArray(form.jointsAffected) &&
                  form.jointsAffected.includes(joint.value);

                return (
                  <button
                    key={joint.value}
                    type="button"
                    className={`joint-chip ${
                      selected ? "active" : ""
                    }`}
                    onClick={() => toggleJoint(joint.value)}
                    aria-pressed={selected}
                  >
                    <span className="joint-check">
                      {selected ? "✓" : ""}
                    </span>
                    {joint.label}
                  </button>
                );
              })}
            </div>

            <p className="field-help selected-joints-help">
              {Array.isArray(form.jointsAffected) &&
              form.jointsAffected.length > 0
                ? `${txt.selectedJoints}: ${form.jointsAffected
                    .map(
                      (value) =>
                        joints.find((joint) => joint.value === value)?.label ||
                        value
                    )
                    .join(", ")}`
                : txt.noJointsSelected}
            </p>

          </div>


          {/* TARGET JOINT + LAST BLEED */}

          <div className="form-grid two-columns">

            <div className="field">

              <label>
                {txt.targetJoint}
              </label>

              <select
                value={
                  form.targetJoint
                }
                onChange={(e) =>
                  updateField(
                    "targetJoint",
                    e.target.value
                  )
                }
              >

                <option value="">
                  {txt.selectTargetJoint}
                </option>

                <option value="">
                  {txt.none}
                </option>

                {joints.map(
                  (joint) => (
                    <option
                      key={joint.value}
                      value={
                        joint.value
                      }
                    >
                      {joint.label}
                    </option>
                  )
                )}

              </select>

            </div>


            <div className="field">

              <label>
                {txt.lastBleed}
              </label>

              <input
                type="date"
                value={
                  form.lastBleedDate
                }
                onChange={(e) =>
                  updateField(
                    "lastBleedDate",
                    e.target.value
                  )
                }
              />

            </div>

          </div>


          {/* OTHER DETAILS */}

          <div className="field full-width">

            <label>
              {txt.otherDetails}
            </label>

            <textarea
              rows="4"
              placeholder={
                txt.otherDetailsPlaceholder
              }
              value={
                form.otherBleedingDetails
              }
              onChange={(e) =>
                updateField(
                  "otherBleedingDetails",
                  e.target.value
                )
              }
            />

          </div>

        </div>


        {/* =================================================
            SECTION 04 - PHYSIOTHERAPY
        ================================================= */}

        <div
          className={`clinical-section ${
            physioDone
              ? "section-complete"
              : ""
          }`}
        >

          <div className="section-header">

            <div className="section-number">
              04
            </div>

            <div>

              <h2>
                {txt.physiotherapy}
              </h2>

              <p>
                {txt.physiotherapyDesc}
              </p>

            </div>

            {physioDone && (
              <div className="completion-mark">
                ✓
              </div>
            )}

          </div>


          {/* CURRENT PHYSIO */}

          <div className="field">

            <label>
              {txt.currentlyPhysio}
              <span className="required">
                {txt.required}
              </span>
            </label>

            <select
              value={
                form.underPhysiotherapy === ""
                  ? ""
                  : form.underPhysiotherapy
                  ? "Yes"
                  : "No"
              }
              onChange={(e) => {

                const value =
                  e.target.value;

                updateField(
                  "underPhysiotherapy",
                  value === ""
                    ? ""
                    : value === "Yes"
                );

                if (
                  value === "Yes"
                ) {
                  updateField(
                    "previousPhysiotherapy",
                    ""
                  );
                }

              }}
            >

              <option value="">
                {txt.selectOption}
              </option>

              <option value="Yes">
                {txt.yes}
              </option>

              <option value="No">
                {txt.no}
              </option>

            </select>

          </div>


          {/* =================================================
              YES → CURRENT PHYSIO DETAILS
          ================================================= */}

          {form.underPhysiotherapy ===
            true && (

            <div className="conditional-box">

              <h3>
                {txt.currentPhysioSection}
              </h3>


              <div className="form-grid two-columns">

                {/* LOCATION */}

                <div className="field">

                  <label>
                    {txt.wherePhysio}
                  </label>

                  <select
                    value={
                      form.physiotherapyLocation
                    }
                    onChange={(e) =>
                      updateField(
                        "physiotherapyLocation",
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      {txt.selectOption}
                    </option>

                    <option value="Hospital">
                      {txt.hospital}
                    </option>

                    <option value="Clinic">
                      {txt.clinic}
                    </option>

                    <option value="Hemophilia Centre">
                      {txt.hemophiliaCentre}
                    </option>

                    <option value="Home">
                      {txt.home}
                    </option>

                  </select>

                </div>


                {/* SESSIONS */}

                <div className="field">

                  <label>
                    {txt.sessions}
                  </label>

                  <select
                    value={
                      form.physiotherapySessions
                    }
                    onChange={(e) =>
                      updateField(
                        "physiotherapySessions",
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      {txt.selectOption}
                    </option>

                    <option value="Once a week">
                      {txt.onceWeek}
                    </option>

                    <option value="2-3 times a week">
                      {txt.twoThree}
                    </option>

                    <option value="More than 3 sessions a week">
                      {txt.moreThree}
                    </option>

                  </select>

                </div>


                {/* DURATION */}

                <div className="field">

                  <label>
                    {txt.sessionDuration}
                  </label>

                  <select
                    value={
                      form.physiotherapyDuration
                    }
                    onChange={(e) =>
                      updateField(
                        "physiotherapyDuration",
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      {txt.selectOption}
                    </option>

                    <option value="Less than 10 minutes">
                      {txt.lessTen}
                    </option>

                    <option value="10-20 minutes">
                      {txt.tenTwenty}
                    </option>

                    <option value="20-30 minutes">
                      {txt.twentyThirty}
                    </option>

                    <option value="More than 30 minutes">
                      {txt.moreThirty}
                    </option>

                  </select>

                </div>


                {/* BODY PART */}

                <div className="field">

                  <label>
                    {txt.affectedBodyPart}
                  </label>

                  <select
                    value={
                      form.physiotherapyBodyPart
                    }
                    onChange={(e) =>
                      updateField(
                        "physiotherapyBodyPart",
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      {txt.selectOption}
                    </option>

                    {joints.map(
                      (joint) => (
                        <option
                          key={joint.value}
                          value={
                            joint.value
                          }
                        >
                          {joint.label}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>


              {/* TREATMENT */}

              <div className="field">

                <label>
                  {txt.treatmentReceived}
                </label>

                <select
                  value={
                    form.physiotherapyTreatment
                  }
                  onChange={(e) =>
                    updateField(
                      "physiotherapyTreatment",
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    {txt.selectOption}
                  </option>

                  <option value="Stretching">
                    {txt.stretching}
                  </option>

                  <option value="Strengthening">
                    {txt.strengthening}
                  </option>

                  <option value="Balance exercises">
                    {txt.balance}
                  </option>

                  <option value="General fitness">
                    {txt.generalFitness}
                  </option>

                  <option value="Joint movement exercises">
                    {txt.jointMovement}
                  </option>

                  <option value="Exercises for pain relief">
                    {txt.painRelief}
                  </option>

                </select>

              </div>


              {/* EQUIPMENT */}

              <div className="field">

                <label>
                  {txt.equipment}
                </label>

                <select
                  value={
                    form.physiotherapyEquipment
                  }
                  onChange={(e) =>
                    updateField(
                      "physiotherapyEquipment",
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    {txt.selectOption}
                  </option>

                  <option value="None">
                    {txt.noEquipment}
                  </option>

                  <option value="Dumbbells">
                    {txt.dumbbells}
                  </option>

                  <option value="Weight cuffs">
                    {txt.weightsCuffs}
                  </option>

                  <option value="Theraband">
                    {txt.theraband}
                  </option>

                  <option value="Yoga mat">
                    {txt.yogaMat}
                  </option>

                  <option value="Other">
                    {txt.otherEquipment}
                  </option>

                </select>

              </div>


              {/* HELPING */}

              <div className="field">

                <label>
                  {txt.helping}
                </label>

                <select
                  value={
                    form.physiotherapyHelping
                  }
                  onChange={(e) =>
                    updateField(
                      "physiotherapyHelping",
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    {txt.selectOption}
                  </option>

                  <option value="Yes">
                    {txt.yes}
                  </option>

                  <option value="No">
                    {txt.no}
                  </option>

                </select>

              </div>


              {/* PROBLEMS */}

              <div className="field">

                <label>
                  {txt.problems}
                </label>

                <div className="problem-grid">

                  {[
                    {
                      value: "None",
                      label: txt.noProblems,
                    },
                    {
                      value: "Pain",
                      label: txt.pain,
                    },
                    {
                      value: "New bleeding",
                      label: txt.newBleeding,
                    },
                    {
                      value: "Stiffness",
                      label: txt.stiffness,
                    },
                    {
                      value: "Increased swelling",
                      label: txt.increasedSwelling,
                    },
                    {
                      value: "Feeling tired",
                      label: txt.tired,
                    },
                  ].map(
                    (problem) => {

                      const active =
                        form.physiotherapyProblems.includes(
                          problem.value
                        );

                      return (
                        <button
                          key={
                            problem.value
                          }
                          type="button"
                          className={`problem-chip ${
                            active
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            togglePhysioProblem(
                              problem.value
                            )
                          }
                        >

                          <span>
                            {active
                              ? "✓"
                              : ""}
                          </span>

                          {problem.label}

                        </button>
                      );
                    }
                  )}

                </div>

              </div>

            </div>
          )}


          {/* =================================================
              NO → PREVIOUS PHYSIO
          ================================================= */}

          {form.underPhysiotherapy ===
            false && (

            <div className="conditional-box">

              <h3>
                {txt.previousPhysioSection}
              </h3>


              <div className="field">

                <label>
                  {txt.previousPhysio}
                </label>

                <select
                  value={
                    form.previousPhysiotherapy === ""
                      ? ""
                      : form.previousPhysiotherapy
                      ? "Yes"
                      : "No"
                  }
                  onChange={(e) =>
                    updateField(
                      "previousPhysiotherapy",
                      e.target.value ===
                        "Yes"
                    )
                  }
                >

                  <option value="">
                    {txt.selectOption}
                  </option>

                  <option value="Yes">
                    {txt.yes}
                  </option>

                  <option value="No">
                    {txt.no}
                  </option>

                </select>

              </div>


              {form.previousPhysiotherapy ===
                true && (

                <div className="form-grid two-columns">

                  <div className="field">

                    <label>
                      {txt.stoppedWhen}
                    </label>

                    <input
                      type="date"
                      value={
                        form.physiotherapyStoppedDate
                      }
                      onChange={(e) =>
                        updateField(
                          "physiotherapyStoppedDate",
                          e.target.value
                        )
                      }
                    />

                  </div>


                  <div className="field">

                    <label>
                      {txt.stoppedWhy}
                    </label>

                    <select
                      value={
                        form.physiotherapyStoppedReason
                      }
                      onChange={(e) =>
                        updateField(
                          "physiotherapyStoppedReason",
                          e.target.value
                        )
                      }
                    >

                      <option value="">
                        {
                          txt.stoppedWhyPlaceholder
                        }
                      </option>

                      <option value="No longer needed">
                        {txt.noNeed}
                      </option>

                      <option value="Symptoms improved">
                        {txt.improved}
                      </option>

                      <option value="Difficulty accessing physiotherapy">
                        {txt.access}
                      </option>

                      <option value="Cost / financial reasons">
                        {txt.cost}
                      </option>

                      <option value="Time constraints">
                        {txt.time}
                      </option>

                      <option value="Other">
                        {txt.other}
                      </option>

                    </select>

                  </div>

                </div>

              )}

            </div>

          )}

        </div>


        {/* =================================================
            SECTION 05 - MOBILITY
        ================================================= */}

        <div className="clinical-section">

          <div className="section-header">

            <div className="section-number">
              05
            </div>

            <div>

              <h2>
                {txt.mobility}
              </h2>

            </div>

          </div>


          <div className="form-grid two-columns">

            <div className="field">

              <label>
                {txt.mobility}
              </label>

              <select
                value={
                  form.mobilityLimitation
                }
                onChange={(e) =>
                  updateField(
                    "mobilityLimitation",
                    e.target.value
                  )
                }
              >

                <option value="">
                  {txt.selectMobility}
                </option>

                <option value="None">
                  {txt.noLimitation}
                </option>

                <option value="Mild">
                  {txt.mild}
                </option>

                <option value="Moderate">
                  {txt.moderate}
                </option>

                <option value="Severe">
                  {txt.severe}
                </option>

              </select>

            </div>


            <div className="field">

              <label>
                {txt.assistive}
              </label>

              <select
                value={
                  form.assistiveDevices
                }
                onChange={(e) =>
                  updateField(
                    "assistiveDevices",
                    e.target.value
                  )
                }
              >
                <option value="">
                  {txt.assistivePlaceholder}
                </option>

                <option value="None">
                  {txt.assistiveOptions.none}
                </option>

                <option value="Knee Brace">
                  {txt.assistiveOptions.kneeBrace}
                </option>

                <option value="Ankle / Foot Brace">
                  {txt.assistiveOptions.ankleBrace}
                </option>

                <option value="Elbow Brace">
                  {txt.assistiveOptions.elbowBrace}
                </option>

                <option value="Wrist Support">
                  {txt.assistiveOptions.wristSupport}
                </option>

                <option value="Cane / Walking Stick">
                  {txt.assistiveOptions.cane}
                </option>

                <option value="Crutches">
                  {txt.assistiveOptions.crutches}
                </option>

                <option value="Walker">
                  {txt.assistiveOptions.walker}
                </option>

                <option value="Wheelchair">
                  {txt.assistiveOptions.wheelchair}
                </option>

                <option value="Other">
                  {txt.assistiveOptions.other}
                </option>
              </select>

            </div>

          </div>

        </div>


        {/* =================================================
            SECTION 06 - DOCTOR
        ================================================= */}

        <div className="clinical-section">

          <div className="section-header">

            <div className="section-number">
              06
            </div>

            <div>

              <h2>
                {txt.doctor}
              </h2>

              <p>
                {txt.doctorDesc}
              </p>

            </div>

          </div>


          <div className="field">

            <label>
              {txt.doctor}
              <span className="required">
                {txt.required}
              </span>
            </label>

            <select
              value={
                form.consultingDoctorId
              }
              onChange={(e) =>
                updateField(
                  "consultingDoctorId",
                  e.target.value
                )
              }
              disabled={
                doctorFieldLocked
              }
            >

              <option value="">
                {doctorsLoading
                  ? txt.doctorLoading
                  : txt.selectDoctor}
              </option>

              {!doctorsLoading &&
                doctors.length ===
                  0 && (
                  <option value="">
                    {txt.noDoctors}
                  </option>
                )}

              {doctors.map((doctor) => (
                <option
                  key={doctor._id}
                  value={doctor._id}
                >
                  {doctor.nameTranslations?.[language] ||
                    doctor.fullName}{" "}
                  — {doctor.professionalId}
                </option>
              ))}

            </select>

            {doctorAssigned && !doctorChangePending && (
              <button
                type="button"
                className="doctor-change-button"
                onClick={() => {
                  setChangeRequestReason("");
                  setChangeRequestModalOpen(true);
                }}
                disabled={doctorStatusLoading || changeRequestLoading}
              >
                {txt.requestDoctorChange}
              </button>
            )}

            {doctorChangePending && (
              <div className="doctor-change-pending">
                <span className="doctor-change-pending-icon">⏳</span>
                <span>{txt.requestPending}</span>
              </div>
            )}

          </div>

        </div>


        {/* =================================================
            DOCTOR CHANGE REQUEST MODAL
        ================================================= */}

        {changeRequestModalOpen && (
          <div
            className="doctor-change-modal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !changeRequestLoading) {
                setChangeRequestModalOpen(false);
              }
            }}
          >
            <div
              className="doctor-change-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="doctor-change-title"
            >
              <div className="doctor-change-modal-header">
                <div>
                  <h3 id="doctor-change-title">
                    {txt.requestDoctorChangeTitle}
                  </h3>
                  <p>{txt.requestDoctorChangeText}</p>
                </div>
                <button
                  type="button"
                  className="doctor-change-close"
                  onClick={() => setChangeRequestModalOpen(false)}
                  disabled={changeRequestLoading}
                  aria-label={txt.cancel}
                >
                  ×
                </button>
              </div>

              <div className="doctor-change-modal-body">
                <label className="doctor-change-reason-label">
                  {txt.changeReason}
                </label>
                <textarea
                  value={changeRequestReason}
                  onChange={(e) => setChangeRequestReason(e.target.value)}
                  placeholder={txt.changeReasonPlaceholder}
                  rows={5}
                  disabled={changeRequestLoading}
                  className="doctor-change-reason-input"
                />
              </div>

              <div className="doctor-change-modal-actions">
                <button
                  type="button"
                  className="doctor-change-cancel"
                  onClick={() => setChangeRequestModalOpen(false)}
                  disabled={changeRequestLoading}
                >
                  {txt.cancel}
                </button>

                <button
                  type="button"
                  className="doctor-change-submit"
                  onClick={handleDoctorChangeRequest}
                  disabled={changeRequestLoading}
                >
                  {changeRequestLoading
                    ? txt.sendingRequest
                    : txt.sendRequest}
                </button>
              </div>
            </div>
          </div>
        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="error-box">

            <span className="error-icon">
              !
            </span>

            <span>
              {error}
            </span>

          </div>

        )}


        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="action-row">

          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate("/awareness")
            }
          >
            ← {txt.back}
          </button>


          <button
            type="button"
            className="continue-button"
            onClick={handleSubmit}
            disabled={loading}
          >

            {loading ? (
              <>
                <span className="spinner"></span>
                {txt.saving}
              </>
            ) : (
              <>
                {txt.save}
                <span>→</span>
              </>
            )}

          </button>

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="bottom-note">

          <span className="small-info">
            i
          </span>

          <span>
            {txt.secure}
          </span>

        </div>

      </div>


      {/* =================================================
          STYLES
      ================================================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .clinical-page {
          min-height: 100vh;
          width: 100%;
          padding: 32px 20px;

          background:
            linear-gradient(
              135deg,
              #eef3fa 0%,
              #f7f9fd 50%,
              #edf2f9 100%
            );

          display: flex;
          justify-content: center;
          align-items: flex-start;

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          color: #1c2942;
        }

        .clinical-container {
          width: min(960px, 100%);

          padding: 28px;

          background: #ffffff;

          border:
            1px solid #dce4ef;

          border-radius: 18px;

          box-shadow:
            0 18px 50px
            rgba(30, 48, 95, 0.09);
        }

        .clinical-header {
          display: flex;
          align-items: center;
          gap: 13px;

          padding-bottom: 22px;

          border-bottom:
            1px solid #e1e6ee;
        }

        .header-icon {
          width: 44px;
          height: 44px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;

          background:
            linear-gradient(
              135deg,
              #24328f,
              #4a7dfc
            );

          color: white;

          font-size: 25px;
          font-weight: 300;
        }

        .header-eyebrow {
          display: block;
          margin-bottom: 4px;

          color: #4a7dfc;

          font-size: 8px;
          font-weight: 700;

          letter-spacing: 1px;
        }

        .header-text h1 {
          margin: 0;

          color: #1d2a47;

          font-size: 23px;
          font-weight: 700;
        }

        .header-text p {
          margin: 5px 0 0;

          color: #78869a;

          font-size: 10px;
          line-height: 1.5;
        }

        .info-banner {
          margin-top: 18px;

          padding: 12px 14px;

          display: flex;
          align-items: flex-start;

          gap: 9px;

          border:
            1px solid #cfe3eb;

          border-radius: 10px;

          background: #effafd;
        }

        .info-banner-icon {
          width: 21px;
          height: 21px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #d9f1f6;

          color: #3b8093;

          font-size: 10px;
          font-weight: 700;
        }

        .info-banner strong {
          display: block;

          color: #315d70;

          font-size: 9px;
        }

        .info-banner p {
          margin: 3px 0 0;

          color: #648499;

          font-size: 8px;

          line-height: 1.5;
        }

        .clinical-section {
          margin-top: 18px;

          padding: 19px;

          border:
            1px solid #dfe6ef;

          border-radius: 12px;

          background: #ffffff;

          transition:
            border-color .2s ease,
            background .2s ease;
        }

        .clinical-section.section-complete {
          border-color: #cdd9ee;
          background: #fbfcff;
        }

        .section-header {
          display: flex;
          align-items: center;

          gap: 10px;

          margin-bottom: 18px;
        }

        .section-number {
          width: 30px;
          height: 30px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 8px;

          background: #eef2ff;

          color: #24328f;

          font-size: 8px;
          font-weight: 700;
        }

        .section-header h2 {
          margin: 0;

          color: #202d47;

          font-size: 14px;
          font-weight: 700;
        }

        .section-header p {
          margin: 3px 0 0;

          color: #8996a8;

          font-size: 8px;
        }

        .completion-mark {
          width: 21px;
          height: 21px;

          margin-left: auto;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #edf8f2;

          color: #2b9660;

          border:
            1px solid #d5ebdf;

          font-size: 10px;
          font-weight: 700;
        }

        .form-grid {
          display: grid;

          grid-template-columns:
            repeat(3, minmax(0, 1fr));

          gap: 14px;
        }

        .form-grid.two-columns {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          margin-top: 16px;
        }

        .field {
          min-width: 0;
          margin-bottom: 14px;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .field label {
          display: block;

          margin-bottom: 6px;

          color: #46556d;

          font-size: 9px;

          font-weight: 600;
        }

        .required {
          margin-left: 3px;
          color: #d34c4c;
        }

        .field-help {
          margin: -1px 0 9px;

          color: #8a97a9;

          font-size: 8px;

          line-height: 1.4;
        }

        .field input,
        .field select,
        .doctor-change-button {
          margin-top: 12px;
          width: 100%;
          min-height: 35px;
          border: 1px solid #1890b4;
          border-radius: 10px;
          background: #fff;
          color: black;
          font-size: 9px;
          font-weight: 200;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .doctor-change-button:hover:not(:disabled) {
          background: #fff5f4;
        }

        .doctor-change-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .doctor-change-pending {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-top: 12px;
          padding: 12px 14px;
          border: 1px solid #f0c36d;
          border-radius: 10px;
          background: #fffaf0;
          color: #7a4b00;
          font-size: 13px;
          line-height: 1.5;
        }

        .doctor-change-pending-icon {
          flex: 0 0 auto;
        }

        .doctor-change-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.45);
        }

        .doctor-change-modal {
          width: min(560px, 100%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
        }

        .doctor-change-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 22px 16px;
          border-bottom: 1px solid #eee;
        }

        .doctor-change-modal-header h3 {
          margin: 0 0 7px;
          font-size: 20px;
          line-height: 1.25;
        }

        .doctor-change-modal-header p {
          margin: 0;
          color: #666;
          font-size: 13px;
          line-height: 1.55;
        }

        .doctor-change-close {
          width: 34px;
          height: 34px;
          flex: 0 0 auto;
          border: 0;
          border-radius: 8px;
          background: #f5f5f5;
          color: #444;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
        }

        .doctor-change-modal-body {
          padding: 20px 22px;
        }

        .doctor-change-reason-label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 700;
        }

        .doctor-change-reason-input {
          width: 100%;
          min-height: 120px;
          box-sizing: border-box;
          resize: vertical;
          padding: 12px 13px;
          border: 1px solid #d6d6d6;
          border-radius: 10px;
          outline: none;
          font: inherit;
          line-height: 1.5;
        }

        .doctor-change-reason-input:focus {
          border-color: #777;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06);
        }

        .doctor-change-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 0 22px 22px;
        }

        .doctor-change-cancel,
        .doctor-change-submit {
          min-height: 42px;
          padding: 0 18px;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .doctor-change-cancel {
          border: 1px solid #d6d6d6;
          background: #fff;
          color: #444;
        }

        .doctor-change-submit {
          border: 1px solid #111;
          background: #111;
          color: #fff;
        }

        .doctor-change-cancel:disabled,
        .doctor-change-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .field textarea {
          width: 100%;

          padding: 10px 12px;

          border:
            1px solid #d8e0eb;

          border-radius: 8px;

          background: #ffffff;

          color: #26344d;

          font-family: inherit;

          font-size: 10px;

          outline: none;

          transition:
            border-color .15s ease,
            box-shadow .15s ease,
            background .15s ease;
        }

        .field input,
        .field select {
          height: 40px;
        }

        .field textarea {
          resize: vertical;
          min-height: 85px;
        }

        .field input::placeholder,
        .field textarea::placeholder {
          color: #a3adbc;
        }

        .field input:hover,
        .field select:hover,
        .field textarea:hover {
          border-color: #bcc8da;
          background: #fcfdff;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: #4a7dfc;

          background: #ffffff;

          box-shadow:
            0 0 0 3px
            rgba(74, 125, 252, .10);
        }

        .field select {
          cursor: pointer;
        }

        .field select:disabled {
          opacity: .65;
          cursor: not-allowed;
        }


        /* ================================================
           MEDICATION MULTI-SELECT DROPDOWN
        ================================================= */

        .medication-dropdown {
          position: relative;
          width: 100%;
        }

        .medication-dropdown-button {
          width: 100%;
          min-height: 38px;

          padding: 0 11px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 8px;

          border:
            1px solid #d8e0eb;

          border-radius: 7px;

          background: #ffffff;

          color: #334155;

          font-family: inherit;
          font-size: 10px;
          font-weight: 500;

          cursor: pointer;

          text-align: left;

          transition:
            border-color .15s ease,
            box-shadow .15s ease;
        }

        .medication-dropdown-button:hover {
          border-color: #bcc8da;
          background: #fcfdff;
        }

        .medication-dropdown-button:focus {
          outline: none;

          border-color: #4a7dfc;

          box-shadow:
            0 0 0 3px
            rgba(74, 125, 252, .10);
        }

        .medication-dropdown-value {
          flex: 1;
          min-width: 0;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .medication-dropdown-arrow {
          flex-shrink: 0;

          color: #66758b;

          font-size: 13px;
          line-height: 1;
        }

        .medication-dropdown-overlay {
          position: fixed;

          inset: 0;

          z-index: 90;

          width: 100%;
          height: 100%;

          padding: 0;

          border: none;

          background: transparent;

          cursor: default;
        }

        .medication-dropdown-menu {
          position: absolute;

          left: 0;
          right: 0;
          top: calc(100% + 4px);

          z-index: 100;

          max-height: 220px;

          overflow-y: auto;

          padding: 6px;

          border:
            1px solid #d8e0eb;

          border-radius: 8px;

          background: #ffffff;

          box-shadow:
            0 10px 24px
            rgba(31, 52, 86, .14);
        }

        .medication-option {
          display: flex;

          align-items: center;

          gap: 8px;

          min-height: 32px;

          padding: 6px 7px;

          border-radius: 6px;

          color: #4c5b70;

          font-size: 9px;
          font-weight: 600;

          cursor: pointer;

          transition:
            background .15s ease;
        }

        .medication-option:hover {
          background: #f4f7ff;
        }

        .medication-option input {
          width: 14px;
          height: 14px;

          flex-shrink: 0;

          margin: 0;

          cursor: pointer;

          accent-color: #4a7dfc;
        }

        .joint-field {
          margin-top: 16px;
        }

        .field-help {
          margin: 6px 0 0;
          color: #7b8798;
          font-size: 8px;
          line-height: 1.5;
        }

        .selected-joints-help {
          margin-top: 9px;
          font-weight: 600;
        }

        .joint-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .joint-chip {
          min-height: 31px;

          padding: 0 11px;

          display: flex;
          align-items: center;

          gap: 5px;

          border:
            1px solid #d8e0eb;

          border-radius: 999px;

          background: #ffffff;

          color: #5c6a7e;

          font-family: inherit;

          font-size: 9px;

          font-weight: 600;

          cursor: pointer;

          transition: all .15s ease;
        }

        .joint-chip:hover {
          border-color: #9eb3dc;

          background: #f5f8ff;

          color: #24328f;
        }

        .joint-chip.active {
          border-color: #4a7dfc;

          background: #eef2ff;

          color: #24328f;
        }

        .joint-check {
          width: 14px;
          height: 14px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #edf0f5;

          color: transparent;

          font-size: 8px;
        }

        .joint-chip.active
        .joint-check {
          background: #4a7dfc;
          color: #ffffff;
        }

        /* ================================================
           CONDITIONAL PHYSIO BOX
        ================================================= */

        .conditional-box {
          margin-top: 17px;

          padding: 16px;

          border:
            1px solid #dce6f3;

          border-radius: 10px;

          background: #f9fbff;
        }

        .conditional-box h3 {
          margin: 0 0 15px;

          color: #2a3c5d;

          font-size: 11px;

          font-weight: 700;
        }

        /* ================================================
           PROBLEM CHIPS
        ================================================= */

        .problem-grid {
          display: flex;

          flex-wrap: wrap;

          gap: 7px;
        }

        .problem-chip {
          min-height: 34px;

          padding: 0 11px;

          display: flex;

          align-items: center;

          gap: 6px;

          border:
            1px solid #d8e0eb;

          border-radius: 8px;

          background: #ffffff;

          color: #5c6a7e;

          font-family: inherit;

          font-size: 9px;

          font-weight: 600;

          cursor: pointer;

          transition: all .15s ease;
        }

        .problem-chip:hover {
          border-color: #9eb3dc;

          background: #f5f8ff;
        }

        .problem-chip.active {
          border-color: #4a7dfc;

          background: #eef2ff;

          color: #24328f;
        }

        .problem-chip span {
          width: 15px;
          height: 15px;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #edf0f5;

          font-size: 8px;
        }

        .problem-chip.active span {
          background: #4a7dfc;
          color: #ffffff;
        }

        /* ================================================
           ERROR
        ================================================= */

        .error-box {
          margin-top: 16px;

          padding: 10px 12px;

          display: flex;

          align-items: center;

          gap: 8px;

          border:
            1px solid #f0c9c6;

          border-radius: 9px;

          background: #fff6f5;

          color: #b3261e;

          font-size: 9px;
        }

        .error-icon {
          width: 19px;
          height: 19px;

          flex-shrink: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #fde4e2;

          font-size: 9px;

          font-weight: 700;
        }

        /* ================================================
           ACTIONS
        ================================================= */

        .action-row {
          margin-top: 22px;

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 12px;
        }

        .back-button,
        .continue-button {
          height: 40px;

          padding: 0 17px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 7px;

          border-radius: 8px;

          font-family: inherit;

          font-size: 10px;

          font-weight: 600;

          cursor: pointer;

          transition: all .15s ease;
        }

        .back-button {
          min-width: 90px;

          border:
            1px solid #d8e0eb;

          background: #f7f9fc;

          color: #657388;
        }

        .back-button:hover {
          border-color: #c4cfde;

          background: #eef2f7;

          color: #3f4e65;
        }

        .continue-button {
          min-width: 170px;

          border: none;

          background:
            linear-gradient(
              135deg,
              #4a7dfc,
              #5f8dff
            );

          color: #ffffff;

          box-shadow:
            0 6px 16px
            rgba(74, 125, 252, .20);
        }

        .continue-button:hover:not(:disabled) {
          transform: translateY(-1px);

          box-shadow:
            0 8px 20px
            rgba(74, 125, 252, .28);
        }

        .continue-button:disabled {
          opacity: .65;

          cursor: not-allowed;

          transform: none;

          box-shadow: none;
        }

        .spinner {
          width: 12px;
          height: 12px;

          border:
            2px solid
            rgba(255,255,255,.35);

          border-top-color: #ffffff;

          border-radius: 50%;

          animation:
            spin .7s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .bottom-note {
          margin-top: 18px;

          padding-top: 12px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 6px;

          border-top:
            1px solid #e7ebf1;

          color: #8a97a8;

          font-size: 8px;

          text-align: center;
        }

        .small-info {
          width: 15px;
          height: 15px;

          flex-shrink: 0;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 50%;

          background: #eef2ff;

          color: #4a7dfc;

          font-size: 8px;

          font-weight: 700;
        }

        @media (max-width: 800px) {

          .clinical-page {
            padding: 22px 14px;
          }

          .clinical-container {
            padding: 22px;

            border-radius: 15px;
          }

          .form-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

        }

        @media (max-width: 600px) {

          .clinical-page {
            padding: 0;

            background: #f4f7fb;
          }

          .clinical-container {
            width: 100%;

            padding: 18px 14px;

            border-radius: 0;

            border-left: none;
            border-right: none;

            box-shadow: none;
          }

          .clinical-header {
            padding-bottom: 17px;
          }

          .header-icon {
            width: 38px;
            height: 38px;

            font-size: 22px;
          }

          .header-text h1 {
            font-size: 18px;
          }

          .header-text p {
            font-size: 8px;
          }

          .clinical-section {
            padding: 15px;

            margin-top: 13px;

            border-radius: 10px;
          }

          .section-header {
            margin-bottom: 14px;
          }

          .section-header h2 {
            font-size: 12px;
          }

          .section-header p {
            font-size: 7px;
          }

          .form-grid,
          .form-grid.two-columns {
            grid-template-columns: 1fr;

            gap: 12px;
          }

          .joint-grid,
          .problem-grid {
            gap: 6px;
          }

          .joint-chip,
          .problem-chip {
            font-size: 8px;
          }

          .action-row {
            flex-direction: column-reverse;

            align-items: stretch;
          }

          .back-button,
          .continue-button {
            width: 100%;

            height: 42px;
          }

          .bottom-note {
            align-items: flex-start;

            font-size: 7px;
          }

        }

        @media (max-width: 380px) {

          .clinical-container {
            padding: 15px 11px;
          }

          .header-icon {
            width: 34px;
            height: 34px;
          }

          .header-text h1 {
            font-size: 16px;
          }

          .info-banner {
            padding: 10px;
          }

          .clinical-section {
            padding: 13px;
          }

          .section-number {
            width: 27px;
            height: 27px;
          }

        }

        @media (prefers-reduced-motion: reduce) {

          .spinner {
            animation: none;
          }

          .clinical-section,
          .joint-chip,
          .problem-chip,
          .back-button,
          .continue-button {
            transition: none;
          }

        }

      `}</style>

    </div>
  );
};

export default HemophiliaDetailsScreen;