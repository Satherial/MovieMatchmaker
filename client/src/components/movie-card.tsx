import { FC } from "react";
import { Card } from "@/components/ui/card";
import StarRating from "@/components/ui/stars";
import { Movie } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface MovieCardProps {
  movie: Movie;
  onWatchClick: (movie: Movie) => void;
}

const MovieCard: FC<MovieCardProps> = ({ movie, onWatchClick }) => {
  return (
    <Card className="movie-card rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all hover:-translate-y-1">
      <div className="relative">
        <img 
          src={movie.imageUrl} 
          alt={movie.title} 
          className="w-full h-48 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
          <div className="flex items-center">
            <span className="text-white font-medium">{movie.rating.toFixed(1)}</span>
            <div className="ml-1">
              <StarRating rating={movie.rating} />
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900">{movie.title}</h3>
          <span className="text-xs bg-gray-100 rounded-md px-2 py-1">{movie.year}</span>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {movie.categories.map((category, index) => (
            <span key={index} className="bg-gray-100 text-xs rounded-full px-2 py-0.5">
              {category}
            </span>
          ))}
        </div>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{movie.description}</p>
        <Button 
          className="w-full"
          onClick={() => onWatchClick(movie)}
        >
          I'll Watch This
        </Button>
      </div>
    </Card>
  );
};

export default MovieCard;
