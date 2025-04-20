import { FC, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import GenreFilter from "@/components/genre-filter";
import WatchHistory from "@/components/watch-history";
import MovieCard from "@/components/movie-card";
import ConfirmationModal from "@/components/confirmation-modal";
import FilterSummary from "@/components/filter-summary";
import { Movie, WatchedMovie, Genre, FilterState } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Home: FC = () => {
  const isMobile = useIsMobile();
  const [showHistory, setShowHistory] = useState(!isMobile);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [sortOrder, setSortOrder] = useState<string>("rating_desc");
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    minRating: 1,
    yearFrom: "Any",
    yearTo: "Any",
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(filters);

  // Reset show history when screen size changes
  useEffect(() => {
    setShowHistory(!isMobile);
  }, [isMobile]);

  // Fetch genres (still called "categories" in API)
  const { data: categories = [] } = useQuery<Genre[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch watch history
  const { data: watchHistory = [], isLoading: isHistoryLoading } = useQuery<WatchedMovie[]>({
    queryKey: ['/api/watch-history'],
  });

  // Fetch movies with filters
  const { data: movies = [], isLoading: isMoviesLoading } = useQuery<Movie[]>({
    queryKey: [
      '/api/movies', 
      {
        categories: appliedFilters.categories.length > 0 ? JSON.stringify(appliedFilters.categories) : undefined,
        minRating: appliedFilters.minRating,
        yearFrom: appliedFilters.yearFrom !== "Any" ? appliedFilters.yearFrom : undefined,
        yearTo: appliedFilters.yearTo !== "Any" ? appliedFilters.yearTo : undefined,
        sort: sortOrder,
      }
    ],
  });

  const handleFilterChange = (name: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleRemoveFilter = (type: keyof FilterState, value?: string) => {
    if (type === 'categories' && value) {
      const newCategories = filters.categories.filter(c => c !== value);
      setFilters(prev => ({ ...prev, categories: newCategories }));
      setAppliedFilters(prev => ({ ...prev, categories: newCategories }));
    } else if (type === 'minRating') {
      setFilters(prev => ({ ...prev, minRating: 1 }));
      setAppliedFilters(prev => ({ ...prev, minRating: 1 }));
    } else if (type === 'yearFrom' || type === 'yearTo') {
      setFilters(prev => ({ ...prev, [type]: "Any" }));
      setAppliedFilters(prev => ({ ...prev, [type]: "Any" }));
    }
  };

  const handleClearAllFilters = () => {
    const resetFilters = {
      categories: [],
      minRating: 1,
      yearFrom: "Any",
      yearTo: "Any",
    };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const handleWatchClick = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isMobile && (
            <div className="mb-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-center py-2 px-4 border border-primary rounded-md text-primary hover:bg-primary hover:text-white transition-colors"
              >
                {showHistory ? 'Hide Watch History' : 'Show Watch History'}
              </button>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="md:w-1/4 md:pr-8 mb-6 md:mb-0">
              <GenreFilter
                categories={categories}
                filters={filters}
                onFilterChange={handleFilterChange}
                onApplyFilters={handleApplyFilters}
                isLoading={isMoviesLoading}
                className="sticky top-4 mb-6"
              />

              <WatchHistory
                watchHistory={watchHistory}
                isLoading={isHistoryLoading}
                className={`md:block ${showHistory ? 'block' : 'hidden'}`}
              />
            </div>

            {/* Main Content */}
            <div className="md:w-3/4">
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-semibold text-gray-800">
                      Recommended Movies
                    </CardTitle>
                    <div className="flex items-center">
                      <span className="mr-2 text-sm text-gray-600">Sort by:</span>
                      <Select
                        value={sortOrder}
                        onValueChange={(value) => setSortOrder(value)}
                      >
                        <SelectTrigger className="text-sm border rounded-md p-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rating_desc">Rating (High to Low)</SelectItem>
                          <SelectItem value="year_desc">Recently Released</SelectItem>
                          <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <FilterSummary 
                    filters={appliedFilters}
                    categories={categories}
                    onRemoveFilter={handleRemoveFilter}
                    onClearAllFilters={handleClearAllFilters}
                  />

                  {isMoviesLoading ? (
                    <div className="py-12 text-center text-gray-500 flex flex-col items-center">
                      <Loader2 className="h-12 w-12 animate-spin mb-3" />
                      <p>Loading movies...</p>
                    </div>
                  ) : movies.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 flex flex-col items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-12 w-12 mb-3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 4.996 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 4.996 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5"
                        />
                      </svg>
                      <p>No movies found matching your filters.</p>
                      <button 
                        onClick={handleClearAllFilters}
                        className="mt-3 text-primary hover:text-primary/80 font-medium"
                      >
                        Clear all filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {movies.map((movie) => (
                        <MovieCard
                          key={movie.id}
                          movie={movie}
                          onWatchClick={handleWatchClick}
                        />
                      ))}
                    </div>
                  )}

                  {/* Pagination - Simplified for this implementation */}
                  {movies.length > 0 && (
                    <div className="mt-8 flex justify-center">
                      <nav className="flex items-center space-x-1">
                        <a href="#" className="px-3 py-1 rounded-md text-sm border border-gray-300 text-gray-500 hover:bg-gray-50">
                          <i className="fas fa-chevron-left"></i>
                        </a>
                        <a href="#" className="px-3 py-1 rounded-md text-sm border border-primary-600 bg-primary-600 text-white">1</a>
                        <a href="#" className="px-3 py-1 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-50">2</a>
                        <a href="#" className="px-3 py-1 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-50">3</a>
                        <span className="px-3 py-1 text-sm text-gray-500">...</span>
                        <a href="#" className="px-3 py-1 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-50">10</a>
                        <a href="#" className="px-3 py-1 rounded-md text-sm border border-gray-300 text-gray-500 hover:bg-gray-50">
                          <i className="fas fa-chevron-right"></i>
                        </a>
                      </nav>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Confirmation Modal */}
      <ConfirmationModal
        movie={selectedMovie}
        isOpen={selectedMovie !== null}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Home;
