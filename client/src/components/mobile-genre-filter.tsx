import React, { FC } from 'react';
import { Genre, FilterState } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface MobileGenreFilterProps {
  categories: Genre[];
  filters: FilterState;
  onFilterChange: (name: keyof FilterState, value: any) => void;
  onApplyFilters: () => void;
  isLoading?: boolean;
  className?: string;
}

const MobileGenreFilter: FC<MobileGenreFilterProps> = ({
  categories: genres,
  filters,
  onFilterChange,
  onApplyFilters,
  isLoading = false,
  className = "",
}) => {
  const yearOptions = ["Any", "2023", "2022", "2021", "2020", "2019", "2015", "2010", "2000", "1990", "1980", "1970"];

  const handleGenreToggle = (genreId: string) => {
    const currentCategories = [...filters.categories];
    const index = currentCategories.indexOf(genreId);
    
    let newCategories: string[] = [];
    if (index === -1) {
      newCategories = [...currentCategories, genreId];
    } else {
      newCategories = currentCategories.filter(id => id !== genreId);
    }
    
    onFilterChange('categories', newCategories);
  };

  return (
    <div className={`p-4 ${className}`} style={{
      backgroundColor: '#ffffff',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 50,
      position: 'relative',
    }}>
      <div style={{ backgroundColor: '#ffffff' }}>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Find Your Movie</h2>
      
        {/* Genres */}
        <div className="mb-6" style={{ backgroundColor: '#ffffff' }}>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Genres</h3>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre.id}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filters.categories.includes(genre.id)
                    ? "bg-primary text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                }`}
                onClick={() => handleGenreToggle(genre.id)}
                style={{ zIndex: 10 }}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        {/* Minimum Rating */}
        <div className="mb-6" style={{ backgroundColor: '#ffffff' }}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-700">Minimum Rating</h3>
            <span className="text-sm font-medium w-8 text-center">{filters.minRating.toFixed(1)}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            step="0.1" 
            value={filters.minRating}
            onChange={(e) => onFilterChange('minRating', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Release Year */}
        <div className="mb-6" style={{ backgroundColor: '#ffffff' }}>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Release Year</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">From</label>
              <select 
                value={filters.yearFrom}
                onChange={(e) => onFilterChange('yearFrom', e.target.value)}
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
                onChange={(e) => onFilterChange('yearTo', e.target.value)}
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
            "Apply Filters"
          )}
        </Button>
      </div>
    </div>
  );
};

export default MobileGenreFilter;