import { FC, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import StarRating from "@/components/ui/stars";
import { Movie } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Info, Eye } from "lucide-react";
import placeholderImage from "@/assets/movie-placeholder.svg";
import { motion } from "framer-motion";

interface MovieCardProps {
  movie: Movie;
  onWatchClick: (movie: Movie) => void;
}

const MovieCard: FC<MovieCardProps> = ({ movie, onWatchClick }) => {
  const [imageError, setImageError] = useState(false);
  const [_, navigate] = useLocation();
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  const handleViewDetails = () => {
    navigate(`/movies/${movie.id}`);
  };

  return (
    <motion.div 
      className="h-full flex"
      whileHover={{ 
        scale: 1.02, 
        y: -5,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
    >
      <Card className="movie-card rounded-lg overflow-hidden shadow-sm border border-gray-200 flex flex-col h-full flex-1">
        <motion.div 
          className="relative cursor-pointer" 
          onClick={handleViewDetails}
          whileHover={{ 
            transition: { duration: 0.3 } 
          }}
        >
          <motion.img 
            src={imageError || !movie.imageUrl ? placeholderImage : movie.imageUrl} 
            alt={movie.title} 
            className="w-full h-48 object-cover"
            onError={handleImageError}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5 }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3"
            initial={{ opacity: 0.8 }}
            whileHover={{ opacity: 1 }}
          >
            <div className="flex items-center">
              <motion.span 
                className="text-white font-medium"
                whileHover={{ scale: 1.1 }}
              >
                {movie.rating.toFixed(1)}
              </motion.span>
              <div className="ml-1">
                <StarRating rating={movie.rating} />
              </div>
            </div>
          </motion.div>
        </motion.div>
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2">
            <motion.h3 
              className="font-semibold text-gray-900 cursor-pointer hover:underline" 
              onClick={handleViewDetails}
              whileHover={{ x: 2 }}
            >
              {movie.title}
            </motion.h3>
            <motion.span 
              className="text-xs bg-gray-100 rounded-md px-2 py-1 ml-2 flex-shrink-0"
              whileHover={{ backgroundColor: "#f0f0f0" }}
            >
              {movie.year}
            </motion.span>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {movie.categories.map((category, index) => (
              <motion.span 
                key={index} 
                className="bg-gray-100 text-xs rounded-full px-2 py-0.5"
                whileHover={{ 
                  backgroundColor: "#e0e0e0", 
                  scale: 1.05 
                }}
              >
                {category}
              </motion.span>
            ))}
          </div>
          <motion.p 
            className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow"
            initial={{ opacity: 0.9 }}
            whileHover={{ opacity: 1 }}
          >
            {movie.description}
          </motion.p>
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline"
                className="w-full"
                onClick={handleViewDetails}
              >
                <Info size={16} className="mr-1" /> Details
              </Button>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Button 
                className="w-full"
                onClick={() => onWatchClick(movie)}
              >
                <Eye size={16} className="mr-1" /> Watch
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default MovieCard;
