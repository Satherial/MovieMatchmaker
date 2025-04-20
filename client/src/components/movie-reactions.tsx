import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Reaction = {
  emoji: string;
  label: string;
  count: number;
};

type MovieReactionsProps = {
  movieId: number;
  initialReactions?: Reaction[];
  className?: string;
};

const defaultReactions: Reaction[] = [
  { emoji: "😍", label: "Love it", count: 0 },
  { emoji: "😢", label: "Made me cry", count: 0 },
  { emoji: "😱", label: "Scary", count: 0 },
  { emoji: "🤣", label: "Hilarious", count: 0 },
  { emoji: "🤔", label: "Thought-provoking", count: 0 },
  { emoji: "😴", label: "Boring", count: 0 },
];

export function MovieReactions({
  movieId,
  initialReactions = defaultReactions,
  className,
}: MovieReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);

  const handleReaction = (emoji: string) => {
    // If user already selected this reaction, remove it
    if (selectedReaction === emoji) {
      setReactions(
        reactions.map((reaction) =>
          reaction.emoji === emoji
            ? { ...reaction, count: Math.max(0, reaction.count - 1) }
            : reaction
        )
      );
      setSelectedReaction(null);
    } else {
      // If user had a previous reaction, decrement it
      let updatedReactions = reactions.map((reaction) =>
        reaction.emoji === selectedReaction
          ? { ...reaction, count: Math.max(0, reaction.count - 1) }
          : reaction
      );

      // Then increment the new reaction
      updatedReactions = updatedReactions.map((reaction) =>
        reaction.emoji === emoji
          ? { ...reaction, count: reaction.count + 1 }
          : reaction
      );

      setReactions(updatedReactions);
      setSelectedReaction(emoji);
      
      // Here you would typically send this data to your backend
      // Example: apiRequest('POST', '/api/movie-reactions', { movieId, reaction: emoji });
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <h3 className="text-lg font-medium mb-2">What did you think?</h3>
      <div className="flex flex-wrap gap-2 justify-center">
        <TooltipProvider>
          {reactions.map((reaction) => (
            <Tooltip key={reaction.emoji}>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedReaction === reaction.emoji ? "default" : "outline"}
                  size="lg"
                  className={cn(
                    "text-2xl h-12 w-12 p-0 rounded-full",
                    selectedReaction === reaction.emoji && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleReaction(reaction.emoji)}
                >
                  {reaction.emoji}
                  {reaction.count > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {reaction.count}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{reaction.label}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}