import { FC } from "react";
import { FilterState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterSummaryProps {
  filters: FilterState;
  categories: { id: string; name: string }[];
  onRemoveFilter: (type: keyof FilterState, value?: string) => void;
  onClearAllFilters: () => void;
}

const FilterSummary: FC<FilterSummaryProps> = ({
  filters,
  categories,
  onRemoveFilter,
  onClearAllFilters,
}) => {
  const hasActiveFilters = 
    filters.categories.length > 0 || 
    filters.minRating > 1 || 
    filters.yearFrom !== "Any" || 
    filters.yearTo !== "Any";

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6 items-center">
      <span className="text-sm text-gray-600">Filters:</span>
      
      {/* Category filters */}
      {filters.categories.map(catId => {
        const category = categories.find(c => c.id === catId);
        return (
          <span key={catId} className="bg-primary-100 text-primary-800 text-xs px-3 py-1 rounded-full flex items-center">
            {category?.name || catId}
            <button 
              className="ml-1 text-primary-600"
              onClick={() => onRemoveFilter('categories', catId)}
            >
              <X size={14} />
            </button>
          </span>
        );
      })}
      
      {/* Rating filter */}
      {filters.minRating > 1 && (
        <span className="bg-primary-100 text-primary-800 text-xs px-3 py-1 rounded-full flex items-center">
          Min Rating: {filters.minRating.toFixed(1)}
          <button 
            className="ml-1 text-primary-600"
            onClick={() => onRemoveFilter('minRating')}
          >
            <X size={14} />
          </button>
        </span>
      )}
      
      {/* Year filter */}
      {(filters.yearFrom !== "Any" || filters.yearTo !== "Any") && (
        <span className="bg-primary-100 text-primary-800 text-xs px-3 py-1 rounded-full flex items-center">
          {filters.yearFrom === "Any" ? "Until" : "From"} {filters.yearFrom === "Any" ? "" : filters.yearFrom}
          {filters.yearFrom !== "Any" && filters.yearTo !== "Any" ? "-" : ""}
          {filters.yearTo === "Any" ? "" : filters.yearTo}
          <button 
            className="ml-1 text-primary-600"
            onClick={() => {
              onRemoveFilter('yearFrom');
              onRemoveFilter('yearTo');
            }}
          >
            <X size={14} />
          </button>
        </span>
      )}
      
      {/* Clear all button */}
      <Button 
        variant="link" 
        className="text-xs text-primary-600 hover:text-primary-800 ml-auto p-0"
        onClick={onClearAllFilters}
      >
        Clear All
      </Button>
    </div>
  );
};

export default FilterSummary;
