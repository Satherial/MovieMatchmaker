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
                    <div className="py-12 text-center text-gray-500">
                      <i className="fas fa-spinner fa-spin fa-2x mb-3"></i>
                      <p>Loading movies...</p>
                    </div>
                  ) : movies.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                      <i className="fas fa-film fa-2x mb-3"></i>
                      <p>No movies found matching your filters.</p>
                      <button 
                        onClick={handleClearAllFilters}
                        className="mt-3 text-primary-600 hover:text-primary-800"
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
