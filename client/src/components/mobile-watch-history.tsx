import React, { FC } from 'react';
import { format } from 'date-fns';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { WatchedMovie } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MobileWatchHistoryProps {
  watchHistory: WatchedMovie[];
  isLoading: boolean;
  className?: string;
}

const MobileWatchHistory: FC<MobileWatchHistoryProps> = ({ 
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
        description: "Your watch history has been cleared successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/watch-history'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to clear history",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <div 
      className={`p-4 ${className}`}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 50,
        position: 'relative',
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
        </div>
      </div>
    </div>
  );
};

export default MobileWatchHistory;