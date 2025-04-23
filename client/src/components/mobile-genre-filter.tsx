import React, { FC, useState, useEffect } from "react";
import { Genre, FilterState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useGenreTransition } from "@/contexts/genre-transition-context";
import { languageNames } from "@/hooks/use-language";

// Country options with name and ISO code
const countryOptions = [
  { code: "Any", name: "Any Country" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" },
  { code: "CA", name: "Canada" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "IN", name: "India" },
  { code: "CN", name: "China" },
  { code: "AU", name: "Australia" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
];

interface MobileGenreFilterProps {
  categories: Genre[];
  filters: FilterState;
  onFilterChange: (name: keyof FilterState, value: any) => void;
  onApplyFilters: () => void;
  isLoading?: boolean;
  isLoadingGenres?: boolean;
  className?: string;
}

const MobileGenreFilter: FC<MobileGenreFilterProps> = ({
  categories: genres,
  filters,
  onFilterChange,
  onApplyFilters,
  isLoading = false,
  isLoadingGenres = false,
  className = "",
}) => {
  const yearOptions = [
    "Any",
    "2023",
    "2022",
    "2021",
    "2020",
    "2019",
    "2015",
    "2010",
    "2000",
    "1990",
    "1980",
    "1970",
  ];
  const { setGenreTransition } = useGenreTransition();
  const [activeGenreName, setActiveGenreName] = useState<string | null>(null);

  // Update active genre name when filters change
  useEffect(() => {
    if (filters.categories.length === 1) {
      const selectedGenre = genres.find((g) => g.id === filters.categories[0]);
      setActiveGenreName(selectedGenre?.name || null);
    } else {
      setActiveGenreName(null);
    }
  }, [filters.categories, genres]);

  const handleGenreToggle = (genreId: string) => {
    const previousGenreName = activeGenreName;
    const currentCategories = [...filters.categories];
    const index = currentCategories.indexOf(genreId);

    let newCategories: string[] = [];
    if (index === -1) {
      newCategories = [...currentCategories, genreId];
    } else {
      newCategories = currentCategories.filter((id) => id !== genreId);
    }

    // Get the new genre name
    let newGenreName: string | null = null;
    if (newCategories.length === 1) {
      const selectedGenre = genres.find((g) => g.id === newCategories[0]);
      newGenreName = selectedGenre?.name || null;
    }

    // Trigger the genre transition animation
    setGenreTransition(previousGenreName, newGenreName);

    onFilterChange("categories", newCategories);
  };

  // Add immediate language filtering for mobile
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange("language", value);
  };

  // Add country change handler
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange("country", value);
  };

  return (
    <div
      className={`p-4 ${className}`}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "0.5rem",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        zIndex: 50,
        position: "relative",
      }}
    >
      <div style={{ backgroundColor: "#ffffff" }}>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Find Your Movie
        </h2>

        {/* Genres */}
        <div className="mb-6" style={{ backgroundColor: "#ffffff" }}>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Genres</h3>
          {isLoadingGenres ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <span className="text-sm text-gray-600">Loading genres...</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <motion.button
                  key={genre.id}
                  className={`genre-chip px-3 py-1 text-sm rounded-full transition-colors ${
                    filters.categories.includes(genre.id)
                      ? `bg-primary text-white active-${genre.name
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`
                      : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                  }`}
                  onClick={() => handleGenreToggle(genre.id)}
                  style={{ zIndex: 10 }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    scale: filters.categories.includes(genre.id)
                      ? [1, 1.1, 1]
                      : 1,
                    transition: { duration: 0.3 },
                  }}
                >
                  {genre.name}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Minimum Rating */}
        <div className="mb-6" style={{ backgroundColor: "#ffffff" }}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              Minimum Rating
            </h3>
            <span className="text-sm font-medium w-8 text-center">
              {filters.minRating.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={filters.minRating}
            onChange={(e) =>
              onFilterChange("minRating", parseFloat(e.target.value))
            }
            className="w-full"
          />
        </div>

        {/* Language */}
        <div className="mb-6" style={{ backgroundColor: "#ffffff" }}>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Language</h3>
          <select
            value={filters.language}
            onChange={handleLanguageChange}
            className="w-full p-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="all">All Languages</option>
            {Object.entries(languageNames).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Country of Origin */}
        <div className="mb-6" style={{ backgroundColor: "#ffffff" }}>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Country of Origin
          </h3>
          <select
            value={filters.country}
            onChange={handleCountryChange}
            className="w-full p-2 border border-gray-300 rounded-md bg-white"
          >
            {countryOptions.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* Release Year */}
        <div className="mb-6" style={{ backgroundColor: "#ffffff" }}>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Release Year
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">From</label>
              <select
                value={filters.yearFrom}
                onChange={(e) => onFilterChange("yearFrom", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white"
              >
                {yearOptions.map((year) => (
                  <option key={`from-${year}`} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">To</label>
              <select
                value={filters.yearTo}
                onChange={(e) => onFilterChange("yearTo", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white"
              >
                {yearOptions.map((year) => (
                  <option key={`to-${year}`} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            className="w-full"
            onClick={onApplyFilters}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <motion.span
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  Apply Filters
                </motion.span>
                <motion.span
                  className="absolute inset-0 rounded bg-primary opacity-0"
                  whileHover={{ opacity: 0.1 }}
                />
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default MobileGenreFilter;
