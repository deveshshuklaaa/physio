import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../apiClient";

// =====================================================
// DROPDOWNS
// =====================================================

const genderOptions = [
  "Male",
  "Female",
  "Other",
];

const bloodGroupOptions = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

const stateOptions = [
  "Maharashtra",
  "Gujarat",
  "Delhi",
  "Karnataka",
];

const relationshipOptions = [
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Spouse",
  "Daughter",
  "Son"
];

const maritalOptions = [
  "Single",
  "Married",
];

const educationOptions = [
  "Primary",
  "Secondary",
  "Graduate",
  "Postgraduate",
];

const insuranceOptions = [
  "Yes",
  "No",
];

// =====================================================
// EMPTY PROFILE
// =====================================================

const emptyProfile = {
  firstName: "",
  middleName: "",
  lastName: "",
  fullName: "",
  gender: "",
  dob: "",
  age: "",
  bloodGroup: "",

  mobile: "",
  alternateContact: "",
  address: "",
  city: "",
  state: "",
  pinCode: "",

  emergencyName: "",
  emergencyRelationship: "",
  emergencyPhone: "",


  htcName: "",
  hematologistName: "",
  hospitalName: "",
};

// =====================================================
// COMPONENT
// =====================================================

const ProfileStepper = () => {
  const [language, setLanguage] = useState(
    localStorage.getItem("preferredLanguage") || "en"
  );

  const [activeStep, setActiveStep] = useState(0);

  const [profile, setProfile] =
    useState(emptyProfile);

  const [saved, setSaved] = useState(null);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const navigate = useNavigate();

  // =====================================================
  // LOAD EXISTING PROFILE
  // =====================================================

  useEffect(() => {
  const loadProfile = async () => {
    try {
      const res = await api.get(
        "/profile/patient-profile"
      );

      const existing = res.data || {};

      // ==========================================
      // SPLIT STORED fullName INTO 3 UI FIELDS
      // ==========================================

      let firstName = "";
      let middleName = "";
      let lastName = "";

      if (existing.fullName) {
        const nameParts = existing.fullName
          .trim()
          .split(/\s+/);

        // Example:
        // "Ayush Ramji Solanki"
        // ["Ayush", "Ramji", "Solanki"]

        if (nameParts.length === 1) {
          firstName = nameParts[0];
        }

        else if (nameParts.length === 2) {
          firstName = nameParts[0];
          lastName = nameParts[1];
        }

        else if (nameParts.length >= 3) {
          firstName = nameParts[0];

          middleName = nameParts
            .slice(1, -1)
            .join(" ");

          lastName =
            nameParts[nameParts.length - 1];
        }
      }

      // ==========================================
      // SET PROFILE
      // ==========================================

      const next = {
        ...emptyProfile,

        // Load database fields
        ...existing,

        // IMPORTANT:
        // overwrite UI name fields AFTER ...existing
        firstName,
        middleName,
        lastName,

        // Keep original stored full name
        fullName: existing.fullName || "",

        dob: existing.dob
          ? existing.dob.substring(0, 10)
          : "",
      };

      setProfile(next);
      if (existing.fullName) setSaved(next);

    } catch (err) {
      console.log(
        "Profile loading error:",
        err
      );
    }

    setLoading(false);
  };

  setLoading(true);
  loadProfile();
}, []);

  // =====================================================
  // UPDATE FIELD
  // =====================================================

  // =====================================================
  // NAME FORMATTER
  // Automatically capitalizes the first letter of each
  // name/word while the user types.
  // Example: "ayush" → "Ayush"
  //          "ramji" → "Ramji"
  //          "ayush kumar" → "Ayush Kumar"
  // =====================================================

  const capitalizeName = (value) => {
    return value
      .toLowerCase()
      .replace(/(^|\s)\S/g, (char) =>
        char.toUpperCase()
      );
  };

  // =====================================================
  // UPDATE FIELD
  // =====================================================

  const updateField = (field, value) => {
    // First Name / Middle Name / Last Name
    // automatically capitalize the first letter.
    if (
      [
        "firstName",
        "middleName",
        "lastName",
      ].includes(field)
    ) {
      value = capitalizeName(value);
    }

    // Phone fields
    if (
      [
        "mobile",
        "alternateContact",
        "emergencyPhone",
      ].includes(field)
    ) {
      if (!/^\d*$/.test(value)) return;

      if (value.length > 10) return;
    }

    // DOB → automatically calculate age
    if (field === "dob") {
      const birthDate = new Date(value);
      const today = new Date();

      let age =
        today.getFullYear() -
        birthDate.getFullYear();

      const m =
        today.getMonth() -
        birthDate.getMonth();

      if (
        m < 0 ||
        (
          m === 0 &&
          today.getDate() <
            birthDate.getDate()
        )
      ) {
        age--;
      }

      setProfile((prev) => ({
        ...prev,
        dob: value,
        age: age >= 0 ? age : "",
      }));

      return;
    }

    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =====================================================
  // PIN → LOCATION
  // =====================================================

  const fetchLocationFromPin = async (pin) => {
    try {
      const res = await fetch(
        `https://api.postalpincode.in/pincode/${pin}`
      );

      const data = await res.json();

      if (
        data &&
        data[0] &&
        data[0].Status === "Success" &&
        data[0].PostOffice &&
        data[0].PostOffice.length > 0
      ) {
        const postOffice =
          data[0].PostOffice[0];

        setProfile((prev) => ({
          ...prev,
          city:
            postOffice.District || "",
          state:
            postOffice.State || "",
        }));

        setError("");
      } else {
        setError(t.errors.invalidPin);
      }
    } catch (err) {
      console.log(err);
      setError(t.errors.pinService);
    }
  };

  // =====================================================
  // LANGUAGE
  // =====================================================

  const translations = {
    en: {
      language: "Language",
      onboarding: "PATIENT ONBOARDING",
      registration: "Patient Registration",
      subtitle: "Enter your information to create and maintain your clinical profile.",
      patientId: "PATIENT ID",
      steps: [
        "Patient Identification",
        "Contact Information",
        "Emergency Contact",
        "Care Center Linkage",
        "Review & Submit",
      ],
      fields: {
        firstName: "Full Name", middleName: "Middle Name (Optional)", lastName: "Last Name", gender: "Gender", dob: "Date of Birth", age: "Age",
        bloodGroup: "Blood Group", mobile: "Mobile Number", alternateContact: "Alternate Contact",
        address: "Address", state: "State", city: "City", pinCode: "PIN Code",
        emergencyName: "Emergency Name", relationship: "Relationship", emergencyPhone: "Emergency Phone",
        htcName: "Hemophilia Treatment Center (HTC) Name", hematologistName: "Hematologist Full Name", hospitalName: "Hospital Full Name",
      },
      options: {
        Male: "Male", Female: "Female", Other: "Other",
        Father: "Father", Mother: "Mother", Brother: "Brother", Sister: "Sister", Spouse: "Spouse", Daughter : "Daughter", Son : "Son",
      },
      select: "Select",
      autoAge: "Automatically calculated from your date of birth.",
      pinHelp: "City and state can be automatically filled from your PIN code.",
      step: "STEP", of: "OF",
      back: "Back", continue: "Continue", submitting: "Submitting...", submit: "Submit Profile",
      loading: "Loading your profile...",
      review: {
        patientDesc: "Confirm your basic patient information.",
        contactDesc: "Your registered contact and location details.",
        emergencyDesc: "Person to contact during an emergency.",
        careDesc: "Existing healthcare provider information.",
        patientId: "Patient ID", mobile: "Mobile", name: "Name", phone: "Phone", hematologist: "Hematologist",
        hospital: "Hospital", registration: "Registration Number",
      },
      errors: {
        required: "Please fill all required fields.",
        mobile: "Enter a valid 10 digit mobile number.",
        pin: "Enter a valid 6 digit PIN code.",
        location: "City and State are required.",
        emergency: "Enter valid emergency contact details.",
        save: "Failed to save profile.",
        invalidPin: "Invalid PIN Code",
        pinService: "PIN service error",
      },
    },
    hi: {
      language: "भाषा",
      onboarding: "रोगी जानकारी",
      registration: "रोगी पंजीकरण",
      subtitle: "अपनी क्लिनिकल प्रोफ़ाइल बनाने और बनाए रखने के लिए अपनी जानकारी दर्ज करें।",
      patientId: "रोगी आईडी",
      steps: ["रोगी पहचान", "संपर्क जानकारी", "आपातकालीन संपर्क", "देखभाल केंद्र लिंक", "समीक्षा और सबमिट"],
      fields: {
        firstName: "पहला नाम", middleName: "मध्य नाम (वैकल्पिक)", lastName: "उपनाम", gender: "लिंग", dob: "जन्म तिथि", age: "आयु",
        bloodGroup: "रक्त समूह", mobile: "मोबाइल नंबर", alternateContact: "वैकल्पिक संपर्क",
        address: "पता", state: "राज्य", city: "शहर", pinCode: "पिन कोड",
        emergencyName: "आपातकालीन संपर्क का नाम", relationship: "रिश्ता", emergencyPhone: "आपातकालीन फोन",
        htcName: "हीमोफीलिया ट्रीटमेंट सेंटर (HTC) का नाम", hematologistName: "हेमेटोलॉजिस्ट का पूरा नाम", hospitalName: "अस्पताल का पूरा नाम",
      },
      options: {
        Male: "पुरुष", Female: "महिला", Other: "अन्य",
        Father: "पिता", Mother: "माता", Brother: "भाई", Sister: "बहन", Spouse: "पति/पत्नी", Son : "बेटा" ,Daughter : "बेटी",
      },
      select: "चुनें",
      autoAge: "आपकी जन्म तिथि से स्वतः गणना की गई।",
      pinHelp: "आपके पिन कोड से शहर और राज्य अपने आप भरे जा सकते हैं।",
      step: "चरण", of: "में से",
      back: "वापस", continue: "जारी रखें", submitting: "सबमिट किया जा रहा है...", submit: "प्रोफ़ाइल सबमिट करें",
      loading: "आपकी प्रोफ़ाइल लोड हो रही है...",
      review: {
        patientDesc: "अपनी मूल रोगी जानकारी की पुष्टि करें।", contactDesc: "आपकी पंजीकृत संपर्क और स्थान की जानकारी।",
        emergencyDesc: "आपातकाल में संपर्क करने वाला व्यक्ति।",
        careDesc: "मौजूदा स्वास्थ्य सेवा प्रदाता की जानकारी।", patientId: "रोगी आईडी", mobile: "मोबाइल",
        name: "नाम", phone: "फोन", hematologist: "हेमेटोलॉजिस्ट",
        hospital: "अस्पताल", registration: "पंजीकरण संख्या",
      },
      errors: {
        required: "कृपया सभी आवश्यक फ़ील्ड भरें।", mobile: "10 अंकों का मान्य मोबाइल नंबर दर्ज करें।",
        pin: "6 अंकों का मान्य पिन कोड दर्ज करें।", location: "शहर और राज्य आवश्यक हैं।",
        emergency: "मान्य आपातकालीन संपर्क विवरण दर्ज करें।", save: "प्रोफ़ाइल सहेजी नहीं जा सकी।",
        invalidPin: "अमान्य पिन कोड", pinService: "पिन सेवा में त्रुटि",
      },
    },
    mr: {
      language: "भाषा",
      onboarding: "रुग्ण नोंदणी",
      registration: "रुग्ण नोंदणी",
      subtitle: "तुमची क्लिनिकल प्रोफाइल तयार करण्यासाठी आणि अद्ययावत ठेवण्यासाठी तुमची माहिती भरा.",
      patientId: "रुग्ण आयडी",
      steps: ["रुग्ण ओळख", "संपर्क माहिती", "आपत्कालीन संपर्क", "केअर सेंटर लिंक", "पुनरावलोकन आणि सबमिट"],
      fields: {
        firstName: "पहिले नाव", middleName: "मधले नाव (पर्यायी)", lastName: "आडनाव", gender: "लिंग", dob: "जन्मतारीख", age: "वय",
        bloodGroup: "रक्तगट", mobile: "मोबाइल क्रमांक", alternateContact: "पर्यायी संपर्क",
        address: "पत्ता", state: "राज्य", city: "शहर", pinCode: "पिन कोड",
        emergencyName: "आपत्कालीन संपर्काचे नाव", relationship: "नाते", emergencyPhone: "आपत्कालीन फोन",
        htcName: "हिमोफिलिया ट्रीटमेंट सेंटर (HTC) चे नाव", hematologistName: "हेमॅटोलॉजिस्टचे पूर्ण नाव", hospitalName: "रुग्णालयाचे पूर्ण नाव",
      },
      options: {
        Male: "पुरुष", Female: "स्त्री", Other: "इतर",
        Father: "वडील", Mother: "आई", Brother: "भाऊ", Sister: "बहीण", Spouse: "पती/पत्नी",Son : "मुलगा" ,Daughter : "मुलगी",
      },
      select: "निवडा",
      autoAge: "तुमच्या जन्मतारखेवरून आपोआप मोजले जाते.",
      pinHelp: "तुमच्या पिन कोडवरून शहर आणि राज्य आपोआप भरले जाऊ शकते.",
      step: "टप्पा", of: "पैकी",
      back: "मागे", continue: "पुढे जा", submitting: "सबमिट होत आहे...", submit: "प्रोफाइल सबमिट करा",
      loading: "तुमची प्रोफाइल लोड होत आहे...",
      review: {
        patientDesc: "तुमच्या मूलभूत रुग्ण माहितीची पुष्टी करा.", contactDesc: "तुमची नोंदणीकृत संपर्क आणि स्थानाची माहिती.",
        emergencyDesc: "आपत्कालीन परिस्थितीत संपर्क करण्याची व्यक्ती.",
        careDesc: "विद्यमान आरोग्यसेवा प्रदात्याची माहिती.", patientId: "रुग्ण आयडी", mobile: "मोबाइल",
        name: "नाव", phone: "फोन", hematologist: "हेमॅटोलॉजिस्ट",
        hospital: "रुग्णालय", registration: "नोंदणी क्रमांक",
      },
      errors: {
        required: "कृपया सर्व आवश्यक फील्ड भरा.", mobile: "10 अंकी वैध मोबाइल क्रमांक टाका.",
        pin: "6 अंकी वैध पिन कोड टाका.", location: "शहर आणि राज्य आवश्यक आहेत.",
        emergency: "वैध आपत्कालीन संपर्क तपशील टाका.", save: "प्रोफाइल जतन करता आली नाही.",
        invalidPin: "अवैध पिन कोड", pinService: "पिन सेवेमध्ये त्रुटी",
      },
    },
  };

  const t = translations[language] || translations.en;

  const handleLanguageChange = (e) => {
    const nextLanguage = e.target.value;
    setLanguage(nextLanguage);
    localStorage.setItem("preferredLanguage", nextLanguage);
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const handleNext = () => {

    // Step 0
    if (activeStep === 0) {
      if (
        !profile.firstName ||
        !profile.lastName ||
        !profile.gender ||
        !profile.dob ||
        !profile.bloodGroup
      ) {
        setError(
          t.errors.required
        );
        return;
      }
    }

    // Step 1
    if (activeStep === 1) {
      if (
        !profile.mobile ||
        !/^\d{10}$/.test(
          profile.mobile
        )
      ) {
        setError(
          t.errors.mobile
        );
        return;
      }

      if (
        !profile.pinCode ||
        !/^\d{6}$/.test(
          profile.pinCode
        )
      ) {
        setError(
          t.errors.pin
        );
        return;
      }

      if (
        !profile.state ||
        !profile.city
      ) {
        setError(
          t.errors.location
        );
        return;
      }
    }

    // Step 2
    if (activeStep === 2) {
      if (
        !profile.emergencyName ||
        !profile.emergencyRelationship ||
        !/^\d{10}$/.test(
          profile.emergencyPhone
        )
      ) {
        setError(
          t.errors.emergency
        );
        return;
      }
    }

    setError("");

    setActiveStep(
      (s) => s + 1
    );
  };

  // =====================================================
  // BACK
  // =====================================================

  const handleBack = () => {
    setError("");

    setActiveStep(
      (s) => Math.max(0, s - 1)
    );
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async () => {
    setSaving(true);
    setError("");

    try {
      const firstName = profile.firstName.trim();
      const middleName = profile.middleName.trim();
      const lastName = profile.lastName.trim();

      const fullName = [firstName, middleName, lastName]
        .filter(Boolean)
        .join(" ");

      const payload = {
        ...profile,
        firstName,
        middleName,
        lastName,
        fullName,
      };

      const response = await api.post(
        "/profile/patient-profile",
        payload
      );

      const savedProfile = {
        ...payload,
        ...(response.data?.profile || {}),
        patientId:
          response.data?.patientId ||
          profile.patientId,
      };

      localStorage.setItem(
        "profile",
        JSON.stringify(savedProfile)
      );

      navigate("/awareness");

    } catch (err) {
      console.log(
        "Profile save error:",
        err
      );

      setError(
        err.response?.data?.message ||
        t.errors.save
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // INPUT
  // =====================================================

  const renderField = (
    label,
    field,
    type = "text"
  ) => (
    <div className="form-field">

      <label>
        {label}
      </label>

      <input
        type={type}
        value={
          profile[field] || ""
        }
        onChange={(e) =>
          updateField(
            field,
            e.target.value
          )
        }
      />

    </div>
  );

  // =====================================================
  // SELECT
  // =====================================================

  const renderSelect = (
    label,
    field,
    options
  ) => (
    <div className="form-field">

      <label>
        {label}
      </label>

      <select
        value={
          profile[field] || ""
        }
        onChange={(e) =>
          updateField(
            field,
            e.target.value
          )
        }
      >

        <option value="">
          {t.select} {label}
        </option>

        {options.map((opt) => (
          <option
            key={opt}
            value={opt}
          >
            {t.options[opt] || opt}
          </option>
        ))}

      </select>

    </div>
  );

  // =====================================================
  // STEP CONTENT
  // =====================================================

  const renderStepContent = () => {

    switch (activeStep) {

      // =================================================
      // STEP 0
      // =================================================

      case 0:
        return (
          <>
            {renderField(
              t.fields.firstName,
              "firstName"
            )}

            {renderField(
              t.fields.middleName,
              "middleName"
            )}

            {renderField(
              t.fields.lastName,
              "lastName"
            )}

            {renderSelect(
              t.fields.gender,
              "gender",
              genderOptions
            )}

            {renderField(
              t.fields.dob,
              "dob",
              "date"
            )}

            <div className="form-field">

              <label>
                {t.fields.age}
              </label>

              <input
                value={
                  profile.age || ""
                }
                readOnly
              />

              <small className="field-help">
                {t.autoAge}
              </small>

            </div>

            {renderSelect(
              t.fields.bloodGroup,
              "bloodGroup",
              bloodGroupOptions
            )}
          </>
        );

      // =================================================
      // STEP 1
      // =================================================

      case 1:
        return (
          <>
            {renderField(
              t.fields.mobile,
              "mobile"
            )}

            {renderField(
              t.fields.alternateContact,
              "alternateContact"
            )}

            {renderField(
              t.fields.address,
              "address"
            )}

            {renderSelect(
              t.fields.state,
              "state",
              stateOptions
            )}

            {renderField(
              t.fields.city,
              "city"
            )}

            <div className="form-field">

              <label>
                {t.fields.pinCode}
              </label>

              <input
                value={
                  profile.pinCode || ""
                }
                inputMode="numeric"
                maxLength={6}
                onChange={(e) => {

                  const val =
                    e.target.value;

                  if (
                    !/^\d*$/.test(val)
                  ) {
                    return;
                  }

                  if (
                    val.length > 6
                  ) {
                    return;
                  }

                  updateField(
                    "pinCode",
                    val
                  );

                  if (
                    val.length === 6
                  ) {
                    fetchLocationFromPin(
                      val
                    );
                  }
                }}
              />

              <small className="field-help">
                {t.pinHelp}
              </small>

            </div>
          </>
        );

      // =================================================
      // STEP 2
      // =================================================

      case 2:
        return (
          <>
            {renderField(
              t.fields.emergencyName,
              "emergencyName"
            )}

            {renderSelect(
              t.fields.relationship,
              "emergencyRelationship",
              relationshipOptions
            )}

            {renderField(
              t.fields.emergencyPhone,
              "emergencyPhone"
            )}
          </>
        );

      // =================================================
      // STEP 3
      // CARE CENTER LINKAGE
      // =================================================

      case 3:
        return (
          <>
            {renderField(
              t.fields.htcName,
              "htcName"
            )}

            {renderField(
              t.fields.hematologistName,
              "hematologistName"
            )}

            {renderField(
              t.fields.hospitalName,
              "hospitalName"
            )}

          </>
        );

      // =================================================
      // STEP 4
      // REVIEW & SUBMIT
      // =================================================

      case 4:
        return (
          <div className="review-container">

            {/* PATIENT */}

            <div className="review-section">

              <div className="review-section-heading">
                <div className="review-icon">
                  01
                </div>

                <div>
                  <h3>
                    {t.steps[0]}
                  </h3>

                  <p>
                    {t.review.patientDesc}
                  </p>
                </div>
              </div>

              <div className="review-grid">

                <div>
                  <span>
                    {t.review.patientId}
                  </span>

                  <strong>
                    {profile.patientId || "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    {t.fields.firstName}
                  </span>

                  <strong>
                    {[profile.firstName, profile.middleName, profile.lastName]
                      .filter(Boolean)
                      .join(" ") || "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    {t.fields.gender}
                  </span>

                  <strong>
                    {profile.gender || "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    {t.fields.dob}
                  </span>

                  <strong>
                    {profile.dob || "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Age
                  </span>

                  <strong>
                    {profile.age || "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    {t.fields.bloodGroup}
                  </span>

                  <strong>
                    {profile.bloodGroup || "-"}
                  </strong>
                </div>

              </div>

            </div>


            {/* CONTACT */}

            <div className="review-section">

              <div className="review-section-heading">
                <div className="review-icon">
                  02
                </div>

                <div>
                  <h3>
                    {t.steps[1]}
                  </h3>

                  <p>
                    {t.review.contactDesc}
                  </p>
                </div>
              </div>

              <div className="review-grid">

                <div>
                  <span>
                    {t.review.mobile}
                  </span>

                  <strong>
                    {profile.mobile || "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    {t.fields.alternateContact}
                  </span>

                  <strong>
                    {profile.alternateContact || "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    {t.fields.address}
                  </span>

                  <strong>
                    {profile.address || "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    {t.fields.state}
                  </span>

                  <strong>
                    {profile.state || "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    {t.fields.city}
                  </span>

                  <strong>
                    {profile.city || "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    {t.fields.pinCode}
                  </span>

                  <strong>
                    {profile.pinCode || "-"}
                  </strong>
                </div>

              </div>

            </div>


            {/* EMERGENCY */}

            <div className="review-section emergency-review">

              <div className="review-section-heading">

                <div className="review-icon emergency-icon">
                  03
                </div>

                <div>
                  <h3>
                    {t.steps[2]}
                  </h3>

                  <p>
                    {t.review.emergencyDesc}
                  </p>
                </div>

              </div>

              <div className="review-grid">

                <div>
                  <span>
                    {t.review.name}
                  </span>

                  <strong>
                    {profile.emergencyName || "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    {t.fields.relationship}
                  </span>

                  <strong>
                    {profile.emergencyRelationship || "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    {t.review.phone}
                  </span>

                  <strong>
                    {profile.emergencyPhone || "-"}
                  </strong>
                </div>

              </div>

            </div>

            {/* CARE CENTER */}

            <div className="review-section">

              <div className="review-section-heading">

                <div className="review-icon">
                  04
                </div>

                <div>
                  <h3>
                    {t.steps[4]}
                  </h3>

                  <p>
                    {t.review.careDesc}
                  </p>
                </div>

              </div>

              <div className="review-grid">

                <div>
                  <span>
                    Hemophilia Treatment Center (HTC)
                  </span>

                  <strong>
                    {profile.htcName || "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    {t.fields.hematologistName}
                  </span>

                  <strong>
                    {profile.hematologistName || "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    {t.fields.hospitalName}
                  </span>

                  <strong>
                    {profile.hospitalName || "-"}
                  </strong>
                </div>

              </div>

            </div>

          </div>
        );

      default:
        return null;
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>

        <span>
          {t.loading}
        </span>
      </div>
    );
  }

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <div className="profile-page">

      <div className="profile-shell">

        <div className="profile-language-bar">
          <div className="profile-language-label">
            <span>🌐</span>
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

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="profile-header">

          <div>

            <div className="section-label">
              {t.onboarding}
            </div>

            <h1 className="title">
              {t.registration}
            </h1>

            <p className="subtitle">
              {t.subtitle}
            </p>

          </div>

          {profile.patientId && (
            <div className="profile-id-card">

              <span>
                {t.patientId}
              </span>

              <strong>
                {profile.patientId}
              </strong>

            </div>
          )}

        </div>


        {/* =================================================
            STEPPER
        ================================================= */}

        <div className="stepper-wrapper">

          <div className="stepper-line"></div>

          <div className="stepper">

            {t.steps.map(
              (step, index) => {

                const completed =
                  index < activeStep;

                const active =
                  index === activeStep;

                return (
                  <div
                    key={step}
                    className={`
                      step-item
                      ${active ? "active" : ""}
                      ${completed ? "completed" : ""}
                    `}
                  >

                    <div className="step-number">

                      {completed
                        ? "✓"
                        : index + 1}

                    </div>

                    <div className="step-label">
                      {t.steps[index]}
                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>


        {/* =================================================
            FORM CARD
        ================================================= */}

        <div className="form-card">

          <div className="form-card-header">

            <div>

              <div className="current-step">
                {t.step} {activeStep + 1} {t.of}{" "}
                {t.steps.length}
              </div>

              <h2>
                {t.steps[activeStep]}
              </h2>

            </div>

            <div className="step-progress">
              {Math.round(
                ((activeStep + 1) /
                  t.steps.length) *
                  100
              )}
              %
            </div>

          </div>


          <div className="form-area">

            {renderStepContent()}

          </div>


          {/* ERROR */}

          {error && (
            <div className="error">

              <span className="error-icon">
                !
              </span>

              <span>
                {error}
              </span>

            </div>
          )}


          {/* =================================================
              BUTTONS
          ================================================= */}

          <div className="btn-row">

            {saved && (
              <button
                className="secondary"
                onClick={() => {
                  setProfile(saved);
                  setError("");
                  navigate("/awareness");
                }}
              >
                Cancel
              </button>
            )}

            <button
              className="secondary"
              onClick={handleBack}
              disabled={
                activeStep === 0
              }
            >
              ← {t.back}
            </button>


            {activeStep <
            t.steps.length - 1 ? (

              <button
                className="primary"
                onClick={handleNext}
              >
                {t.continue}
                <span>
                  →
                </span>
              </button>

            ) : (

              <button
                className="primary submit-btn"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving
                  ? "Submitting..."
                  : "Submit Profile"}

                {!saving && (
                  <span>
                    ✓
                  </span>
                )}
              </button>

            )}

          </div>

        </div>


        {/* =================================================
            PRIVACY NOTE
        ================================================= */}

        <div className="privacy-note">

          

        </div>

      </div>


      {/* =====================================================
          STYLING
      ===================================================== */}

      <style>{`

        .profile-language-bar {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          margin-bottom: 18px;
        }

        .profile-language-label {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #5e7289;
          font-size: 11px;
          font-weight: 600;
        }

        .profile-language-bar select {
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

        .profile-language-bar select:hover,
        .profile-language-bar select:focus {
          border-color: #6d97df;
          background: #eef5ff;
        }

        @media (max-width: 600px) {
          .profile-language-bar {
            margin-bottom: 14px;
          }

          .profile-language-bar select {
            min-height: 34px;
            font-size: 11px;
          }

          .profile-language-label {
            font-size: 10px;
          }
        }

        /* =====================================================
           RESET
        ===================================================== */

        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100%;
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

        .profile-page {

          width: 100%;
          min-height: calc(100vh - 68px);

          padding:
            clamp(28px, 5vw, 55px)
            clamp(16px, 5vw, 70px);

          background:
            linear-gradient(
              135deg,
              #f5f9ff 0%,
              #edf5ff 48%,
              #f8fbff 100%
            );

          color: #183c64;
        }


        .profile-shell {

          width: 100%;
          max-width: 1120px;

          margin: 0 auto;
        }


        /* =====================================================
           HEADER
        ===================================================== */

        .profile-header {

          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          gap: 25px;

          margin-bottom: 28px;
        }


        .section-label {

          display: flex;
          align-items: center;

          gap: 9px;

          margin-bottom: 9px;

          color: #3f73d2;

          font-size: 10px;
          font-weight: 800;

          letter-spacing: 1.5px;
        }


        .section-label::before {

          content: "";

          width: 28px;
          height: 2px;

          background: #4e82dd;

          border-radius: 5px;
        }


        .title {

          margin: 0;

          color: #173c64;

          font-size:
            clamp(25px, 3vw, 34px);

          font-weight: 750;

          letter-spacing: -0.7px;

          line-height: 1.15;
        }


        .subtitle {

          max-width: 650px;

          margin:
            9px 0 0;

          color: #7288a1;

          font-size: 13px;

          line-height: 1.6;
        }


        /* =====================================================
           PATIENT ID
        ===================================================== */

        .profile-id-card {

          flex-shrink: 0;

          min-width: 155px;

          padding:
            12px 15px;

          border:
            1px solid #d5e2f1;

          border-radius: 11px;

          background: #ffffff;

          box-shadow:
            0 5px 18px
            rgba(39, 77, 118, 0.06);
        }


        .profile-id-card span {

          display: block;

          margin-bottom: 4px;

          color: #8195aa;

          font-size: 8px;
          font-weight: 800;

          letter-spacing: 1px;
        }


        .profile-id-card strong {

          color: #3168c8;

          font-size: 13px;
        }


        /* =====================================================
           STEPPER
        ===================================================== */

        .stepper-wrapper {

          position: relative;

          width: 100%;

          margin-bottom: 18px;

          overflow-x: auto;

          scrollbar-width: thin;
        }


        .stepper {

          position: relative;
          z-index: 2;

          min-width: 620px;

          display: grid;

          grid-template-columns:
            repeat(5, 1fr);

          gap: 8px;
        }


        .stepper-line {

          position: absolute;

          top: 17px;
          left: 6%;
          right: 6%;

          height: 1px;

          background: #d7e3f1;

          z-index: 1;
        }


        .step-item {

          display: flex;

          flex-direction: column;

          align-items: center;

          gap: 7px;

          min-width: 0;
        }


        .step-number {

          width: 35px;
          height: 35px;

          display: flex;

          align-items: center;
          justify-content: center;

          border:
            1px solid #d5e2f0;

          border-radius: 50%;

          background: #ffffff;

          color: #8da0b5;

          font-size: 11px;
          font-weight: 750;

          box-shadow:
            0 2px 8px
            rgba(38, 77, 119, 0.04);

          transition:
            all 0.2s ease;
        }


        .step-label {

          max-width: 145px;

          color: #8294a9;

          font-size: 9px;
          font-weight: 600;

          text-align: center;

          line-height: 1.3;
        }


        .step-item.active
        .step-number {

          border-color: #4c80dc;

          background:
            linear-gradient(
              135deg,
              #3e75d6,
              #628fe5
            );

          color: #ffffff;

          box-shadow:
            0 5px 15px
            rgba(61, 116, 211, 0.22);
        }


        .step-item.active
        .step-label {

          color: #3267c7;

          font-weight: 750;
        }


        .step-item.completed
        .step-number {

          border-color: #78a1df;

          background: #eaf2ff;

          color: #3b72cf;
        }


        .step-item.completed
        .step-label {

          color: #557ba9;
        }


        /* =====================================================
           FORM CARD
        ===================================================== */

        .form-card {

          width: 100%;

          padding:
            clamp(22px, 4vw, 34px);

          border:
            1px solid #d8e4f1;

          border-radius: 17px;

          background: #ffffff;

          box-shadow:
            0 10px 30px
            rgba(42, 79, 119, 0.08);
        }


        .form-card-header {

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 15px;

          padding-bottom: 20px;

          margin-bottom: 24px;

          border-bottom:
            1px solid #e4ebf4;
        }


        .current-step {

          margin-bottom: 5px;

          color: #4d7bd0;

          font-size: 9px;
          font-weight: 800;

          letter-spacing: 1.2px;
        }


        .form-card-header h2 {

          margin: 0;

          color: #1c426b;

          font-size: 20px;
          font-weight: 700;
        }


        .step-progress {

          width: 48px;
          height: 48px;

          flex-shrink: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          border:
            1px solid #cbdcf1;

          border-radius: 50%;

          background: #f2f7ff;

          color: #376dce;

          font-size: 11px;
          font-weight: 800;
        }


        /* =====================================================
           FORM AREA
        ===================================================== */

        .form-area {

          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap:
            18px 22px;
        }


        .form-field {

          display: flex;

          flex-direction: column;

          min-width: 0;
        }


        .form-field label {

          margin-bottom: 7px;

          color: #496681;

          font-size: 11px;
          font-weight: 700;

          letter-spacing: 0.15px;
        }


        .form-field input,
        .form-field select {

          width: 100%;

          min-height: 46px;

          padding:
            11px
            13px;

          border:
            1px solid #d4e0ed;

          border-radius: 9px;

          outline: none;

          background: #fbfdff;

          color: #294b6d;

          font-size: 13px;

          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease;
        }


        .form-field input:hover,
        .form-field select:hover {

          border-color: #b9cde5;

          background: #ffffff;
        }


        .form-field input:focus,
        .form-field select:focus {

          border-color: #5d89dc;

          background: #ffffff;

          box-shadow:
            0 0 0 3px
            rgba(77, 126, 215, 0.10);
        }


        .form-field input:read-only {

          background: #f2f6fb;

          color: #607994;

          cursor: default;
        }


        .form-field select {

          cursor: pointer;
        }


        .field-help {

          margin-top: 5px;

          color: #8b9daf;

          font-size: 9px;

          line-height: 1.4;
        }


        /* =====================================================
           REVIEW
        ===================================================== */

        .review-container {

          display: flex;

          flex-direction: column;

          gap: 13px;

          grid-column: 1 / -1;
        }


        .review-section {

          padding: 17px;

          border:
            1px solid #dce6f1;

          border-radius: 12px;

          background: #fbfdff;
        }


        .review-section-heading {

          display: flex;

          align-items: center;

          gap: 10px;

          margin-bottom: 15px;
        }


        .review-icon {

          width: 32px;
          height: 32px;

          flex-shrink: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          border:
            1px solid #cdddf1;

          border-radius: 8px;

          background: #edf4ff;

          color: #3d72cf;

          font-size: 9px;
          font-weight: 800;
        }


        .review-section-heading h3 {

          margin: 0;

          color: #294e73;

          font-size: 13px;
          font-weight: 750;
        }


        .review-section-heading p {

          margin:
            3px 0 0;

          color: #8799ad;

          font-size: 9px;
        }


        .review-grid {

          display: grid;

          grid-template-columns:
            repeat(3, minmax(0, 1fr));

          gap: 10px;
        }


        .review-grid > div {

          min-width: 0;

          padding:
            10px 11px;

          border:
            1px solid #e1e9f2;

          border-radius: 8px;

          background: #ffffff;
        }


        .review-grid span {

          display: block;

          margin-bottom: 4px;

          color: #8b9caf;

          font-size: 8px;
          font-weight: 700;

          text-transform: uppercase;

          letter-spacing: 0.65px;
        }


        .review-grid strong {

          display: block;

          overflow-wrap: anywhere;

          color: #355574;

          font-size: 11px;
          font-weight: 650;

          line-height: 1.4;
        }


        /* =====================================================
           EMERGENCY
        ===================================================== */

        .emergency-review {

          border-color: #efdada;

          background:
            linear-gradient(
              135deg,
              #fffafa,
              #ffffff
            );
        }


        .emergency-review
        .emergency-icon {

          border-color: #f0d2d2;

          background: #fff1f1;

          color: #c65c5c;
        }


        /* =====================================================
           ERROR
        ===================================================== */

        .error {

          margin-top: 20px;

          padding:
            10px 12px;

          display: flex;

          align-items: center;

          gap: 8px;

          border:
            1px solid #efcaca;

          border-radius: 9px;

          background: #fff5f5;

          color: #bb4f4f;

          font-size: 11px;

          line-height: 1.4;
        }


        .error-icon {

          width: 20px;
          height: 20px;

          flex-shrink: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #f7dede;

          color: #b94b4b;

          font-weight: 800;
        }


        /* =====================================================
           BUTTONS
        ===================================================== */

        .btn-row {

          margin-top: 28px;

          padding-top: 20px;

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 12px;

          border-top:
            1px solid #e4ebf3;
        }


        .btn-row button {

          min-width: 125px;

          min-height: 42px;

          padding:
            9px 17px;

          display: flex;

          align-items: center;
          justify-content: center;

          gap: 8px;

          border-radius: 9px;

          font-size: 11.5px;
          font-weight: 700;

          cursor: pointer;

          transition:
            all 0.18s ease;
        }


        .primary {

          border:
            1px solid #3f73d2;

          background:
            linear-gradient(
              135deg,
              #3e75d6,
              #5d8de1
            );

          color: #ffffff;

          box-shadow:
            0 5px 14px
            rgba(58, 111, 207, 0.18);
        }


        .primary:hover:not(:disabled) {

          border-color: #315fae;

          transform:
            translateY(-1px);

          box-shadow:
            0 7px 18px
            rgba(58, 111, 207, 0.24);
        }


        .secondary {

          border:
            1px solid #d2dfed;

          background: #ffffff;

          color: #607993;
        }


        .secondary:hover:not(:disabled) {

          border-color: #91add1;

          background: #f3f7fd;

          color: #3c6fc7;
        }


        .btn-row button:disabled {

          opacity: 0.45;

          cursor: not-allowed;

          transform: none;
        }


        .submit-btn {

          min-width: 145px;
        }


        /* =====================================================
           PRIVACY
        ===================================================== */

        .privacy-note {

          margin-top: 13px;

          padding:
            9px 12px;

          display: flex;

          align-items: center;
          justify-content: center;

          gap: 7px;

          border:
            1px solid #dce7f2;

          border-radius: 8px;

          background: rgba(
            255,
            255,
            255,
            0.65
          );

          color: #8093a8;

          font-size: 9px;

          text-align: center;

          line-height: 1.4;
        }


        .privacy-icon {

          color: #4d7fd3;

          font-size: 10px;
        }


        /* =====================================================
           LOADING
        ===================================================== */

        .profile-loading {

          width: 100%;

          min-height: 70vh;

          display: flex;

          flex-direction: column;

          align-items: center;
          justify-content: center;

          gap: 10px;

          background: #f4f8fd;

          color: #70869e;

          font-size: 12px;
        }


        .loading-spinner {

          width: 30px;
          height: 30px;

          border:
            3px solid #dce7f4;

          border-top-color: #4c80d9;

          border-radius: 50%;

          animation:
            profile-spin 0.8s linear infinite;
        }


        @keyframes profile-spin {

          to {
            transform: rotate(360deg);
          }

        }


        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 850px) {

          .profile-page {

            padding:
              30px
              22px;
          }


          .profile-header {

            align-items: flex-start;
          }


          .form-area {

            grid-template-columns:
              1fr;
          }


          .review-grid {

            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

        }


        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 600px) {

          .profile-page {

            min-height: calc(100vh - 62px);

            padding:
              22px
              12px
              28px;
          }


          .profile-header {

            flex-direction: column;

            align-items: stretch;

            gap: 14px;

            margin-bottom: 22px;
          }


          .section-label {

            font-size: 9px;

            letter-spacing: 1.2px;
          }


          .title {

            font-size: 25px;
          }


          .subtitle {

            font-size: 11.5px;

            line-height: 1.55;
          }


          .profile-id-card {

            width: 100%;

            min-width: 0;
          }


          /* STEPPER */

          .stepper-wrapper {

            margin-bottom: 14px;
          }


          .stepper {

            min-width: 580px;
          }


          .step-number {

            width: 32px;
            height: 32px;
          }


          .step-label {

            font-size: 8px;
          }


          .stepper-line {

            top: 15px;
          }


          /* FORM CARD */

          .form-card {

            padding:
              18px 15px;

            border-radius: 14px;
          }


          .form-card-header {

            padding-bottom: 16px;

            margin-bottom: 20px;
          }


          .form-card-header h2 {

            font-size: 17px;
          }


          .current-step {

            font-size: 8px;
          }


          .step-progress {

            width: 42px;
            height: 42px;

            font-size: 10px;
          }


          /* FORM */

          .form-area {

            grid-template-columns:
              1fr;

            gap: 14px;
          }


          .form-field label {

            font-size: 10.5px;
          }


          .form-field input,
          .form-field select {

            min-height: 42px;

            padding:
              9px
              11px;

            font-size: 12px;

            border-radius: 8px;
          }


          /* REVIEW */

          .review-container {

            gap: 10px;
          }


          .review-section {

            padding: 13px;

            border-radius: 10px;
          }


          .review-section-heading {

            margin-bottom: 11px;
          }


          .review-grid {

            grid-template-columns:
              1fr;

            gap: 7px;
          }


          .review-grid > div {

            padding:
              9px 10px;
          }


          .review-grid span {

            font-size: 7.5px;
          }


          .review-grid strong {

            font-size: 10.5px;
          }


          /* BUTTONS */

          .btn-row {

            margin-top: 20px;

            padding-top: 16px;

            flex-direction: column-reverse;

            align-items: stretch;
          }


          .btn-row button {

            width: 100%;

            min-height: 44px;
          }


          /* PRIVACY */

          .privacy-note {

            align-items: flex-start;

            text-align: left;

            font-size: 8.5px;
          }

        }


        /* =====================================================
           SMALL MOBILE
        ===================================================== */

        @media (max-width: 380px) {

          .profile-page {

            padding-left: 9px;
            padding-right: 9px;
          }


          .title {

            font-size: 23px;
          }


          .form-card {

            padding:
              15px 12px;
          }


          .stepper {

            min-width: 550px;
          }


          .form-card-header h2 {

            font-size: 16px;
          }

        }

      `}</style>

    </div>
  );
};

export default ProfileStepper;