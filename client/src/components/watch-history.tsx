import { FC, useState } from "react";
import { WatchedMovie } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import placeholderImage from "@/assets/movie-placeholder.svg";
import { Trash2, Loader2 } from "lucide-react";

interface WatchHistoryProps {
  watchHistory: WatchedMovie[];
  isLoading: boolean;
  className?: string;
}

const WatchHistory: FC<WatchHistoryProps> = ({
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
      queryClient.invalidateQueries({ queryKey: ["/api/movies"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to clear watch history: ${error.message}`,
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
      queryClient.invalidateQueries({ queryKey: ["/api/movies"] });
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
    <Card className={`${className} !bg-white`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800">
            Watch History
          </CardTitle>
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
      </CardHeader>
      <CardContent className="space-y-3">
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
      </CardContent>
    </Card>
  );
};

export default WatchHistory;
