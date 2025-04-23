import { FC, useEffect } from "react";
import { useLanguage, languageNames } from "@/hooks/use-language";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

interface LanguageSelectorProps {
  className?: string;
  selectedLanguage?: string;
  onLanguageChange?: (language: string) => void;
}

const LanguageSelector: FC<LanguageSelectorProps> = ({
  className = "",
  selectedLanguage,
  onLanguageChange,
}) => {
  const { language, setPreferredLanguage, browserLanguage } = useLanguage();

  useEffect(() => {
    if (selectedLanguage && selectedLanguage !== language) {
      setPreferredLanguage(selectedLanguage);
    }
  }, [selectedLanguage, language, setPreferredLanguage]);

  const handleLanguageChange = (value: string) => {
    setPreferredLanguage(value);
    if (onLanguageChange) {
      onLanguageChange(value);
    }
  };

  const getDisplayName = (code: string) => {
    if (code === browserLanguage) {
      return `${languageNames[code]} (Default)`;
    }
    return languageNames[code] || code;
  };

  const currentLanguage = selectedLanguage || language;

  return (
    <div className={`flex items-center ${className}`}>
      <Globe className="h-4 w-4 mr-2 text-gray-600" />
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[140px] text-sm border rounded-md p-1 h-8">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(languageNames).map(([code, name]) => (
            <SelectItem key={code} value={code}>
              {code === browserLanguage ? `${name} (Default)` : name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;
