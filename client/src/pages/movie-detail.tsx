import { FC, useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import StarRating from "@/components/ui/stars";
import { Badge } from "@/components/ui/badge";
import { Movie } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock } from "lucide-react";
import placeholderImage from "@/assets/movie-placeholder.svg";

const MovieDetail: FC = () => {
  const [match, params] = useRoute("/movie/:id");
  const [_, navigate] = useLocation();
  const [imageError, setImageError] = useState(false);
  
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
    <div className="container mx-auto px-4 py-8">
      <Button 
        onClick={handleBackClick} 
        variant="outline" 
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft size={16} />
        Back to Movies
      </Button>
      
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
          <h1 className="text-3xl font-bold mb-2">{movie.title} <span className="text-lg font-normal ml-2">({movie.year})</span></h1>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center">
              <span className="text-lg font-semibold mr-2">{movie.rating.toFixed(1)}</span>
              <StarRating rating={movie.rating} size="lg" />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {movie.categories.map((category, index) => (
              <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                {category}
              </Badge>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Description</h2>
            <p className="text-gray-700 leading-relaxed">{movie.description}</p>
          </div>
          
          <Button 
            className="w-full md:w-auto px-8 py-6 text-lg"
            onClick={() => handleWatchClick(movie)}
          >
            <Clock className="mr-2 h-5 w-5" /> I'll Watch This
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;