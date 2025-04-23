import { useState, useEffect } from "react";

// Define the available language options
export type MovieLanguage =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "ja"
  | "ko"
  | "pt"
  | "ru"
  | "zh"
  | "all";

// A map of language codes to their display names
export const languageNames: Record<MovieLanguage | string, string> = {
  all: "All Languages",
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  pt: "Portuguese",
  ru: "Russian",
  zh: "Chinese",
};

// Hook to get and set the preferred movie language
export function useLanguage() {
  // Try to get the saved language from localStorage, or null if not found
  const savedLanguage =
    typeof window !== "undefined"
      ? localStorage.getItem("preferredLanguage")
      : null;

  // Get browser language for default and for resetting
  const [browserLanguage] = useState<string>(() => {
    if (typeof navigator !== "undefined") {
      const browserLang = navigator.language.split("-")[0]; // Get the language code part (e.g., 'en' from 'en-US')
      // Check if browser language is in our supported languages
      if (browserLang && browserLang in languageNames) {
        return browserLang;
      }
    }
    // Default to English if browser language not supported
    return "en";
  });

  // Initialize with the saved language, browser language, or default to English
  const [language, setLanguage] = useState<string>(() => {
    if (savedLanguage) return savedLanguage;
    return browserLanguage; // Use the detected browser language
  });

  // Update language and save to localStorage
  const setPreferredLanguage = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferredLanguage", newLanguage);
    }
  };

  // Return both the current language, the setter function, and the browser language
  return { language, setPreferredLanguage, browserLanguage };
}
