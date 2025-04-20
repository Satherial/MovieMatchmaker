import { FC, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import StarRating from "@/components/ui/stars";
import { Badge } from "@/components/ui/badge";
import { Movie, CastMember } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, UserRound, PlusCircle, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import placeholderImage from "@/assets/movie-placeholder.svg";
import { MovieReactions } from "@/components/movie-reactions";
import { SocialShare } from "@/components/social-share";
import { AddToPlaylist } from "@/components/add-to-playlist";
import SharedWatchModal from "@/components/shared-watch-modal";
import { useAuth } from "@/hooks/use-auth";

const MovieDetail: FC = () => {
  const [match, params] = useRoute("/movies/:id");
  const [_, navigate] = useLocation();
  const [imageError, setImageError] = useState(false);
  const [isSharedWatchModalOpen, setIsSharedWatchModalOpen] = useState(false);
  const { user } = useAuth();
  
  const { data: movie, isLoading, isError } = useQuery<Movie>({
    queryKey: [`/api/movies/${params?.id}`],
    enabled: !!params?.id,
  });

  const handleWatchClick = async (movie: Movie) => {
    if (!movie) return;
    
    try {
      await apiRequest('POST', '/api/watch-history', { movieId: movie.id });
      
      // Navigate back to home page after adding to watch history
      navigate('/');
    } catch (error) {
      console.error('Error adding movie to watch history:', error);
    }
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-pulse bg-gray-200 h-8 w-64 mb-4 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-60 w-full max-w-lg rounded mb-4"></div>
          <div className="animate-pulse bg-gray-200 h-4 w-full max-w-lg rounded mb-2"></div>
          <div className="animate-pulse bg-gray-200 h-4 w-full max-w-lg rounded mb-2"></div>
          <div className="animate-pulse bg-gray-200 h-4 w-3/4 max-w-lg rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !movie) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
          <Button onClick={handleBackClick} variant="outline" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Movies
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {movie.backdropUrl && (
        <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-background z-10" />
          <img 
            src={movie.backdropUrl} 
            alt={`${movie.title} backdrop`} 
            className="w-full h-full object-cover"
          />
          <div className="container mx-auto px-4 absolute bottom-0 left-0 right-0 z-20 pb-8">
            <Button 
              onClick={handleBackClick} 
              variant="outline" 
              className="mb-4 flex items-center gap-2 bg-background/80 hover:bg-background"
            >
              <ArrowLeft size={16} />
              Back to Movies
            </Button>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-md">
              {movie.title} <span className="text-lg md:text-2xl font-normal ml-2">({movie.year})</span>
            </h1>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center">
                <span className="text-lg font-semibold mr-2 text-white">{movie.rating.toFixed(1)}</span>
                <StarRating rating={movie.rating} size="lg" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-4">
        {!movie.backdropUrl && (
          <>
            <Button 
              onClick={handleBackClick} 
              variant="outline" 
              className="mb-6 flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Movies
            </Button>
            <h1 className="text-3xl font-bold mb-2">{movie.title} <span className="text-lg font-normal ml-2">({movie.year})</span></h1>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                <span className="text-lg font-semibold mr-2">{movie.rating.toFixed(1)}</span>
                <StarRating rating={movie.rating} size="lg" />
              </div>
            </div>
          </>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1">
            <Card className="overflow-hidden border border-gray-200 shadow-sm rounded-lg">
              <div className="aspect-[2/3] relative">
                <img 
                  src={imageError || !movie.imageUrl ? placeholderImage : movie.imageUrl} 
                  alt={movie.title} 
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              </div>
            </Card>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            {!movie.backdropUrl && (
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.categories.map((category, index) => (
                  <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                    {category}
                  </Badge>
                ))}
              </div>
            )}
            
            {movie.backdropUrl && (
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.categories.map((category, index) => (
                  <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                    {category}
                  </Badge>
                ))}
              </div>
            )}
            
            <Separator className="my-4" />
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed">{movie.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
              {movie.director && (
                <div>
                  <h3 className="text-lg font-semibold mb-1">Director</h3>
                  <p className="text-gray-700">{movie.director}</p>
                </div>
              )}
              
              {movie.actors && (
                <div>
                  <h3 className="text-lg font-semibold mb-1">Cast</h3>
                  <p className="text-gray-700">{movie.actors}</p>
                </div>
              )}
              
              {movie.duration && (
                <div>
                  <h3 className="text-lg font-semibold mb-1">Duration</h3>
                  <p className="text-gray-700">{movie.duration} min</p>
                </div>
              )}
              
              {movie.releaseDate && (
                <div>
                  <h3 className="text-lg font-semibold mb-1">Release Date</h3>
                  <p className="text-gray-700">{movie.releaseDate}</p>
                </div>
              )}
              
              {movie.country && (
                <div>
                  <h3 className="text-lg font-semibold mb-1">Country</h3>
                  <p className="text-gray-700">{movie.country}</p>
                </div>
              )}
              
              {movie.language && (
                <div>
                  <h3 className="text-lg font-semibold mb-1">Language</h3>
                  <p className="text-gray-700">{movie.language}</p>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Full Cast</h2>
              {movie.cast && movie.cast.length > 0 ? (
                <ScrollArea className="h-72 w-full rounded-md border p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {movie.cast.map((person) => (
                      <div key={person.id} className="flex flex-col items-center text-center">
                        <Avatar className="h-20 w-20 mb-2">
                          <AvatarImage src={person.profilePath || ''} alt={person.name} />
                          <AvatarFallback className="bg-muted">
                            <UserRound className="h-8 w-8 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm leading-tight">{person.name}</span>
                        <span className="text-xs text-muted-foreground leading-tight">{person.character}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-muted-foreground text-sm p-4 border rounded-md bg-muted/20">
                  <p>Cast information is not available for this movie. This data is only available for movies imported directly from TMDb.</p>
                  <p className="mt-2">Try searching for this movie in the Admin section to import enhanced details.</p>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Gallery</h2>
              {movie.backdropUrl ? (
                <div className="rounded-md overflow-hidden">
                  <img 
                    src={movie.backdropUrl} 
                    alt={`${movie.title} backdrop`} 
                    className="w-full h-auto object-cover"
                  />
                </div>
              ) : (
                <div className="text-muted-foreground text-sm p-4 border rounded-md bg-muted/20">
                  <p>Additional images are not available for this movie. This data is only available for movies imported directly from TMDb.</p>
                  <p className="mt-2">Try searching for this movie in the Admin section to import enhanced details.</p>
                </div>
              )}
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <MovieReactions movieId={movie.id} />
              <SocialShare 
                title={movie.title} 
                description={movie.description} 
              />
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex flex-col md:flex-row gap-3">
              <Button 
                className="w-full md:w-auto px-8 py-6 text-lg"
                onClick={() => handleWatchClick(movie)}
              >
                <Clock className="mr-2 h-5 w-5" /> I'll Watch This
              </Button>
              
              {user && (
                <Button 
                  className="w-full md:w-auto"
                  variant="secondary"
                  onClick={() => setIsSharedWatchModalOpen(true)}
                >
                  <Users className="mr-2 h-5 w-5" /> Watched With Friend
                </Button>
              )}
              
              <AddToPlaylist
                movie={movie}
                variant="outline"
              />
            </div>
            
            {movie && (
              <SharedWatchModal 
                movie={movie}
                isOpen={isSharedWatchModalOpen}
                onClose={() => setIsSharedWatchModalOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;