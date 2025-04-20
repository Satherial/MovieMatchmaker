import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { MovieWithCategories } from '@/lib/types';

interface TMDbSearchProps {
  onMovieImported?: (movie: any) => void;
}

export const TMDbSearch = ({ onMovieImported }: TMDbSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search TMDb
  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
  } = useQuery({
    queryKey: ['/api/tmdb/search', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return { movies: [], totalPages: 0, totalResults: 0, page: 1 };
      const res = await apiRequest('GET', `/api/tmdb/search?q=${encodeURIComponent(searchTerm)}`);
      return await res.json();
    },
    enabled: !!searchTerm,
  });

  // Import movie mutation
  const importMutation = useMutation({
    mutationFn: async (movieId: number) => {
      const res = await apiRequest('POST', '/api/tmdb/import', { movieId });
      return await res.json();
    },
    onSuccess: (importedMovie) => {
      toast({
        title: 'Movie imported successfully',
        description: `${importedMovie.title} has been added to your database.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/movies'] });
      if (onMovieImported) {
        onMovieImported(importedMovie);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchQuery);
  };

  const handleImport = (movieId: number) => {
    importMutation.mutate(movieId);
  };

  return (
    <div className="space-y-6">
      <form className="flex gap-2" onSubmit={handleSearch}>
        <Input
          type="text"
          placeholder="Search for movies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isSearching || !searchQuery}>
          {isSearching ? <Spinner className="mr-2 h-4 w-4" /> : 'Search'}
        </Button>
      </form>

      {searchError && (
        <div className="p-4 border border-destructive rounded-md text-destructive bg-destructive/10">
          Error searching for movies. Please try again.
        </div>
      )}

      {searchTerm && !isSearching && searchResults?.movies?.length === 0 && (
        <div className="p-4 border rounded-md">No movies found for "{searchTerm}".</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {searchResults?.movies?.map((movie: MovieWithCategories) => (
          <Card key={movie.id} className="overflow-hidden h-full flex flex-col">
            <div className="flex h-[200px]">
              <img
                src={movie.imageUrl}
                alt={movie.title}
                className="h-full w-1/3 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500x750?text=No+Image+Available';
                }}
              />
              <CardHeader className="w-2/3 p-4">
                <CardTitle className="text-lg">{movie.title}</CardTitle>
                <CardDescription>
                  {movie.year} • {movie.rating}/10
                </CardDescription>
                <div className="flex flex-wrap gap-1 mt-1">
                  {movie.categories?.map((category, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-4 flex-grow">
              <p className="text-sm line-clamp-3">{movie.description}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImport(movie.id)}
                disabled={importMutation.isPending}
                className="ml-auto"
              >
                {importMutation.isPending && importMutation.variables === movie.id ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  'Import'
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {searchResults?.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="text-sm text-muted-foreground">
            Showing page {searchResults.page} of {searchResults.totalPages}
          </div>
        </div>
      )}
    </div>
  );
};