import { FC, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Genre, FilterState } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useGenreTransition } from "@/contexts/genre-transition-context";
import { motion } from "framer-motion";

interface GenreFilterProps {
  categories: Genre[];
  filters: FilterState;
  onFilterChange: (name: keyof FilterState, value: any) => void;
  onApplyFilters: () => void;
  isLoading?: boolean;
  className?: string;
}

const GenreFilter: FC<GenreFilterProps> = ({
  categories: genres, // Rename locally for clarity
  filters,
  onFilterChange,
  onApplyFilters,
  isLoading = false,
  className = "",
}) => {
  const { setGenreTransition } = useGenreTransition();
  const [activeGenreName, setActiveGenreName] = useState<string | null>(null);
  
  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = ["Any", ...Array.from({ length: 10 }, (_, i) => (currentYear - i * 10).toString())];

  // Update active genre name when filters change
  useEffect(() => {
    if (filters.categories.length === 1) {
      const selectedGenre = genres.find(g => g.id === filters.categories[0]);
      setActiveGenreName(selectedGenre?.name || null);
    } else {
      setActiveGenreName(null);
    }
  }, [filters.categories, genres]);

  const handleGenreToggle = (genreId: string) => {
    const previousGenreName = activeGenreName;
    
    const newCategories = filters.categories.includes(genreId)
      ? filters.categories.filter(id => id !== genreId)
      : [...filters.categories, genreId];
    
    // Get the new genre name
    let newGenreName: string | null = null;
    if (newCategories.length === 1) {
      const selectedGenre = genres.find(g => g.id === newCategories[0]);
      newGenreName = selectedGenre?.name || null;
    }
    
    // Trigger the genre transition animation
    setGenreTransition(previousGenreName, newGenreName);
    
    onFilterChange('categories', newCategories);
  };

  return (
    <Card className={`${className} !bg-white border-2 border-gray-200`} style={{ backgroundColor: 'white !important' }}>
      <CardHeader className="pb-3" style={{ backgroundColor: 'white' }}>
        <CardTitle className="text-lg font-semibold text-gray-800">Find Your Movie</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6" style={{ backgroundColor: 'white' }}>
        {/* Genres */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Genres</h3>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <motion.button
                key={genre.id}
                className={`genre-chip px-3 py-1 text-sm rounded-full transition-colors ${
                  filters.categories.includes(genre.id)
                    ? `bg-primary text-primary-foreground active-${genre.name.toLowerCase().replace(/\s+/g, '-')}`
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                }`}
                onClick={() => handleGenreToggle(genre.id)}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)" 
                }}
                whileTap={{ scale: 0.95 }}
                animate={{ 
                  scale: filters.categories.includes(genre.id) ? [1, 1.1, 1] : 1,
                  transition: { duration: 0.3 }
                }}
              >
                {genre.name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Minimum Rating */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-700">Minimum Rating</h3>
            <span className="text-sm font-medium w-8 text-center">{filters.minRating.toFixed(1)}</span>
          </div>
          <Slider
            value={[filters.minRating]}
            min={1}
            max={10}
            step={0.1}
            onValueChange={(value) => onFilterChange('minRating', value[0])}
          />
        </div>

        {/* Release Year */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Release Year</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">From</label>
              <Select
                value={filters.yearFrom}
                onValueChange={(value) => onFilterChange('yearFrom', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={`from-${year}`} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500">To</label>
              <Select
                value={filters.yearTo}
                onValueChange={(value) => onFilterChange('yearTo', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={`to-${year}`} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            className="w-full relative overflow-hidden"
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
      </CardContent>
    </Card>
  );
};

export default GenreFilter;
