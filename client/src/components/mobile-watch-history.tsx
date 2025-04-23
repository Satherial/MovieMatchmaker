import React, { FC, useState } from "react";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { WatchedMovie } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import placeholderImage from "@/assets/movie-placeholder.svg";
import { Trash2, Loader2 } from "lucide-react";

interface MobileWatchHistoryProps {
  watchHistory: WatchedMovie[];
  isLoading: boolean;
  className?: string;
}

const MobileWatchHistory: FC<MobileWatchHistoryProps> = ({
  watchHistory,
  isLoading,
  className = "",
}) => {
  const { toast } = useToast();
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  const { mutate: clearHistory } = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/watch-history", {});
    },
    onSuccess: () => {
      toast({
        title: "History Cleared",
        description: "Your watch history has been cleared successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/watch-history"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to clear history",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add mutation for deleting a single movie from watch history
  const { mutate: deleteMovie } = useMutation({
    mutationFn: async (movieId: number) => {
      setDeletingIds((prev) => [...prev, movieId]);
      try {
        await apiRequest("DELETE", `/api/watch-history/${movieId}`, {});
        return movieId;
      } catch (error) {
        throw error;
      } finally {
        setDeletingIds((prev) => prev.filter((id) => id !== movieId));
      }
    },
    onSuccess: () => {
      toast({
        title: "Movie Removed",
        description: "Movie has been removed from your watch history.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/watch-history"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove movie: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return (
    <div
      className={`p-4 ${className}`}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "0.5rem",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        zIndex: 50,
        position: "relative",
      }}
    >
      <div className="bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Watch History</h2>
          {watchHistory.length > 0 && (
            <Button
              variant="link"
              className="text-xs text-primary-600 hover:text-primary-800 p-0"
              onClick={() => clearHistory()}
            >
              Clear All
            </Button>
          )}
        </div>

        <div className="space-y-3 bg-white">
          {isLoading ? (
            <div className="py-6 text-center text-gray-500">
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Loading history...
            </div>
          ) : watchHistory.length === 0 ? (
            <div className="py-6 text-center text-gray-500">
              No watch history yet.
            </div>
          ) : (
            watchHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-3 pb-3 border-b border-gray-100"
              >
                <img
                  src={
                    imageErrors[item.id] || !item.movie?.imageUrl
                      ? placeholderImage
                      : item.movie.imageUrl
                  }
                  alt={item.movie?.title || "Movie"}
                  className="w-12 h-16 object-cover rounded-md"
                  onError={() =>
                    setImageErrors((prev) => ({ ...prev, [item.id]: true }))
                  }
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.movie?.title || "Unknown Movie"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Watched on {format(new Date(item.watchedAt), "MMM d, yyyy")}
                  </p>
                </div>
                {/* Add delete button for individual movies */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-500 hover:text-red-500 hover:bg-red-50"
                  onClick={() => deleteMovie(item.id)}
                  disabled={deletingIds.includes(item.id)}
                  title="Remove from history"
                >
                  {deletingIds.includes(item.id) ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileWatchHistory;
