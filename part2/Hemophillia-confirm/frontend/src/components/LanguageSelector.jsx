import React from "react";
import { useTranslation } from "react-i18next";

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (event) => {
    const language = event.target.value;

    i18n.changeLanguage(language);

    localStorage.setItem(
      "preferredLanguage",
      language
    );
  };

  return (
    <div className="language-selector">
      <span className="language-icon">
        Language : 
      </span>

      <select
        value={i18n.language || "en"}
        onChange={handleLanguageChange}
        aria-label="Select language"
      >
        <option value="en">
          English
        </option>

        <option value="hi">
          हिन्दी
        </option>

        <option value="mr">
          मराठी
        </option>
      </select>
    </div>
  );
};

export default LanguageSelector;