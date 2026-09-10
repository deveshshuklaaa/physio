const {
  IndicTransliterator,
} = require("@cloudrumbles/indic-transliterate");

// =====================================================
// SINGLE SHARED TRANSLITERATOR
// =====================================================
//
// Keep one shared instance so the ONNX model does not
// need to be recreated for every doctor/request.
//
// IMPORTANT:
// rescore is intentionally FALSE.
//
// rescore=true requires a language word-frequency
// dictionary which can trigger a large download on
// first use. Marathi was getting stuck during this
// step.
//
// The normal IndicXlit model still supports Marathi.
// =====================================================

let transliterator = null;

const getTransliterator = () => {
  if (!transliterator) {
    transliterator = new IndicTransliterator({
      rescore: false,
    });
  }

  return transliterator;
};

// =====================================================
// CLEAN DOCTOR NAME
// =====================================================

const cleanDoctorName = (fullName) => {
  if (!fullName) {
    return "";
  }

  return fullName
    .replace(/^Dr\.?\s*/i, "")
    .trim();
};

// =====================================================
// TRANSLITERATE DOCTOR NAME
// =====================================================

const transliterateDoctorName = async (
  fullName,
  language
) => {
  if (!fullName) {
    return "";
  }

  // ---------------------------------------------------
  // ENGLISH
  // ---------------------------------------------------

  if (language === "en") {
    return fullName;
  }

  // ---------------------------------------------------
  // ONLY HINDI AND MARATHI
  // ---------------------------------------------------

  if (!["hi", "mr"].includes(language)) {
    return fullName;
  }

  const cleanedName =
    cleanDoctorName(fullName);

  if (!cleanedName) {
    return fullName;
  }

  try {
    const engine =
      getTransliterator();

    console.log(
      `🔤 Transliteration started: "${cleanedName}" → ${language}`
    );

    const results =
      await engine.transliterate(
        cleanedName,
        language,
        5
      );

    console.log(
      `✅ Transliteration completed: "${cleanedName}" → ${language}`
    );

    const translatedName =
      Array.isArray(results) &&
      results.length > 0
        ? results[0]
        : cleanedName;

    // -------------------------------------------------
    // ADD LOCALIZED DOCTOR TITLE
    // -------------------------------------------------

    if (
      language === "hi" ||
      language === "mr"
    ) {
      return `डॉ. ${translatedName}`;
    }

    return translatedName;

  } catch (error) {

    console.error(
      `❌ Doctor name transliteration failed (${language}):`,
      error
    );

    // -------------------------------------------------
    // NEVER BREAK DOCTOR DROPDOWN
    // -------------------------------------------------

    return fullName;
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  transliterateDoctorName,
};