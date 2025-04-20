import { FC } from "react";
import { WatchedMovie } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WatchHistoryProps {
  watchHistory: WatchedMovie[];
  isLoading: boolean;
  className?: string;
}

const WatchHistory: FC<WatchHistoryProps> = ({ 
  watchHistory, 
  isLoading,
  className = "" 
}) => {
  const { toast } = useToast();

  const { mutate: clearHistory } = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', '/api/watch-history', {});
    },
    onSuccess: () => {
      toast({
        title: "History Cleared",
        description: "Your watch history has been cleared successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/watch-history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/movies'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to clear watch history: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800">Watch History</CardTitle>
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
            <div key={item.id} className="flex items-center space-x-3 pb-3 border-b border-gray-100">
              <img 
                src={item.movie?.imageUrl} 
                alt={item.movie?.title || "Movie"} 
                className="w-12 h-16 object-cover rounded-md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.movie?.title || "Unknown Movie"}
                </p>
                <p className="text-xs text-gray-500">
                  Watched on {format(new Date(item.watchedAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default WatchHistory;
