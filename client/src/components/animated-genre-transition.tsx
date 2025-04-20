import { FC, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGenreTransition } from '@/contexts/genre-transition-context';

// Map of theme colors for each genre
const genreThemes: Record<string, { primary: string; secondary: string }> = {
  "Action": { primary: "#FF5733", secondary: "#FF8D6B" },
  "Comedy": { primary: "#FFC300", secondary: "#FFD768" },
  "Drama": { primary: "#884EA0", secondary: "#BB8FCE" },
  "Sci-Fi": { primary: "#3498DB", secondary: "#7FB3D5" },
  "Horror": { primary: "#2E4053", secondary: "#566573" },
  "Romance": { primary: "#E91E63", secondary: "#F48FB1" },
  "Thriller": { primary: "#C0392B", secondary: "#E74C3C" },
  "Documentary": { primary: "#16A085", secondary: "#48C9B0" },
  // Default theme when no genre is selected
  "default": { primary: "#3F51B5", secondary: "#7986CB" }
};

interface AnimatedGenreTransitionProps {
  genreName: string | null;
}

const AnimatedGenreTransition: FC<AnimatedGenreTransitionProps> = ({ genreName }) => {
  const { previousGenre, currentGenre, transitioning } = useGenreTransition();
  
  // Set body class for global theme transitions based on current genre
  useEffect(() => {
    if (currentGenre) {
      document.body.className = `theme-${currentGenre.toLowerCase().replace(/\s+/g, '-')}`;
    } else {
      document.body.className = '';
    }
  }, [currentGenre]);

  // If not transitioning, don't render anything
  if (!transitioning) return null;

  // Get theme colors for the current and previous genres
  const themeFrom = genreThemes[previousGenre || 'default'];
  const themeTo = genreThemes[currentGenre || 'default'];

  return (
    <AnimatePresence>
      {transitioning && (
        // This is a subtle floating indicator that appears in the top-right corner
        <motion.div
          className="fixed top-4 right-4 z-50 pointer-events-none"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="bg-white rounded-lg shadow-md p-2 text-sm flex items-center"
            style={{
              borderLeft: `3px solid ${themeTo.primary}`
            }}
          >
            <span className="text-gray-500 mr-1">Switched to</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-semibold"
              style={{ color: themeTo.primary }}
            >
              {currentGenre || 'All Genres'}
            </motion.span>
          </motion.div>
        </motion.div>
      )}
      
      {/* Subtle highlight animation for the active genre buttons */}
      {transitioning && currentGenre && (
        <style dangerouslySetInnerHTML={{ __html: `
          .genre-chip.active-${currentGenre.toLowerCase().replace(/\s+/g, '-')} {
            animation: pulse-border 1s cubic-bezier(0.4, 0, 0.6, 1);
            box-shadow: 0 0 0 2px ${themeTo.primary};
          }
          
          @keyframes pulse-border {
            0%, 100% { box-shadow: 0 0 0 2px ${themeTo.primary}, 0 0 0 4px transparent; }
            50% { box-shadow: 0 0 0 2px ${themeTo.primary}, 0 0 0 4px ${themeTo.secondary}; }
          }
        `}} />
      )}
    </AnimatePresence>
  );
};

export default AnimatedGenreTransition;