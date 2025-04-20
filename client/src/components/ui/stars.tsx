import { FC } from "react";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  color?: string;
}

const StarRating: FC<StarRatingProps> = ({ 
  rating, 
  max = 10, 
  size = "md", 
  color = "text-yellow-500" 
}) => {
  // Convert rating to a 5-star scale
  const normalizedRating = (rating / max) * 5;
  
  // Calculate the number of full and half stars
  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = normalizedRating - fullStars >= 0.5;
  
  const sizeClass = size === "sm" 
    ? "text-xs" 
    : size === "lg" 
      ? "text-xl" 
      : "text-base";

  return (
    <div className={`flex items-center ${sizeClass} ${color}`}>
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < fullStars) {
          return <i key={i} className="fas fa-star"></i>;
        } else if (i === fullStars && hasHalfStar) {
          return <i key={i} className="fas fa-star-half-alt"></i>;
        } else {
          return <i key={i} className="far fa-star"></i>;
        }
      })}
    </div>
  );
};

export default StarRating;
