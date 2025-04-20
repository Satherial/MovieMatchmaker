import { FC } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Movie } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface ConfirmationModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

const ConfirmationModal: FC<ConfirmationModalProps> = ({ 
  movie, 
  isOpen,
  onClose 
}) => {
  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!movie) return;
      await apiRequest('POST', '/api/watch-history', { movieId: movie.id });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Movie added to your watch history.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/watch-history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/movies'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add movie to watch history: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleConfirm = () => {
    mutate();
  };

  if (!movie) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <i className="fas fa-check-circle text-green-500 text-xl mr-2"></i>
            Confirm Selection
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          You've selected <span className="font-medium text-gray-900">{movie.title}</span>. 
          Would you like to add this to your watch history?
        </DialogDescription>
        <DialogFooter className="flex justify-end space-x-3 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Adding..." : "Yes, I'll Watch This"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;
