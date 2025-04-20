import React, { createContext, useContext, useState } from 'react';

type GenreTransitionContextType = {
  previousGenre: string | null;
  currentGenre: string | null;
  setGenreTransition: (prev: string | null, current: string | null) => void;
  transitioning: boolean;
  setTransitioning: (value: boolean) => void;
};

const GenreTransitionContext = createContext<GenreTransitionContextType | null>(null);

export function GenreTransitionProvider({ children }: { children: React.ReactNode }) {
  const [previousGenre, setPreviousGenre] = useState<string | null>(null);
  const [currentGenre, setCurrentGenre] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const setGenreTransition = (prev: string | null, current: string | null) => {
    setPreviousGenre(prev);
    setCurrentGenre(current);
    setTransitioning(true);

    // Auto-reset transitioning after animation completes
    setTimeout(() => {
      setTransitioning(false);
    }, 1000); // Adjust this to match your animation duration
  };

  return (
    <GenreTransitionContext.Provider value={{
      previousGenre,
      currentGenre,
      setGenreTransition,
      transitioning,
      setTransitioning
    }}>
      {children}
    </GenreTransitionContext.Provider>
  );
}

export function useGenreTransition() {
  const context = useContext(GenreTransitionContext);
  if (!context) {
    throw new Error('useGenreTransition must be used within a GenreTransitionProvider');
  }
  return context;
}