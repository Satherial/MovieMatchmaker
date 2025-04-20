import { FC } from "react";
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
import { Category, FilterState } from "@/lib/types";

interface CategoryFilterProps {
  categories: Category[];
  filters: FilterState;
  onFilterChange: (name: keyof FilterState, value: any) => void;
  onApplyFilters: () => void;
  className?: string;
}

const CategoryFilter: FC<CategoryFilterProps> = ({
  categories,
  filters,
  onFilterChange,
  onApplyFilters,
  className = "",
}) => {
  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = ["Any", ...Array.from({ length: 10 }, (_, i) => (currentYear - i * 10).toString())];

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    
    onFilterChange('categories', newCategories);
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-800">Find Your Movie</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Categories */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-chip px-3 py-1 text-sm rounded-full transition-colors ${
                  filters.categories.includes(category.id)
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                }`}
                onClick={() => handleCategoryToggle(category.id)}
              >
                {category.name}
              </button>
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

        <Button
          className="w-full"
          onClick={onApplyFilters}
        >
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
};

export default CategoryFilter;
