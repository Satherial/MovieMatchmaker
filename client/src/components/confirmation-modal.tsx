import { FC, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Movie } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import placeholderImage from "@/assets/movie-placeholder.svg";

interface ConfirmationModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

const ConfirmationModal: FC<ConfirmationModalProps> = ({
  movie,
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!movie) return;
      await apiRequest("POST", "/api/watch-history", {
        movieId: movie.id,
        title: movie.title,
        imageUrl: movie.imageUrl || null,
        description: movie.description || null,
        // Optional fields
        rating: null,
        notes: null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Movie added to your watch history.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/watch-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/movies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add movie to watch history: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleConfirm = () => {
    mutate();
  };

  if (!movie) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Confirm Selection
          </DialogTitle>
        </DialogHeader>

        <div className="py-3">
          <div className="flex items-start mb-4">
            <img
              src={
                imageError || !movie.imageUrl
                  ? placeholderImage
                  : movie.imageUrl
              }
              alt={movie.title}
              className="w-16 h-24 object-cover rounded-md mr-4"
              onError={() => setImageError(true)}
            />
            <div>
              <h3 className="font-medium text-lg">{movie.title}</h3>
              <p className="text-sm text-muted-foreground">
                {movie.year} • {movie.categories?.join(", ")}
              </p>
              {movie.rating && (
                <div className="flex items-center mt-1">
                  <svg
                    className="w-4 h-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 text-sm">
                    {movie.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {user ? (
            <DialogDescription>
              Would you like to add this movie to your watch history? This will
              personalize your future recommendations.
            </DialogDescription>
          ) : (
            <div className="px-4 py-3 bg-primary/5 rounded-md text-sm">
              <p className="font-medium mb-1">
                Sign in to track your watch history
              </p>
              <p className="text-muted-foreground mb-3">
                Create an account to keep track of what you've watched and get
                personalized recommendations.
              </p>
              <Link href="/auth">
                <Button variant="secondary" size="sm" className="w-full">
                  Sign in or Create Account
                </Button>
              </Link>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end space-x-3 mt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPending || !user}>
            {isPending ? "Adding..." : "Yes, I'll Watch This"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;
