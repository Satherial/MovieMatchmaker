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

// Animation variants for cinematic transitions
const transitionVariants = {
  initial: {
    opacity: 0,
    scale: 0.8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5
    }
  },
  exit: {
    opacity: 0,
    scale: 1.2,
    transition: {
      duration: 0.3
    }
  }
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

  if (!transitioning) return null;

  const themeFrom = genreThemes[previousGenre || 'default'];
  const themeTo = genreThemes[currentGenre || 'default'];

  return (
    <AnimatePresence>
      {transitioning && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={transitionVariants}
        >
          {/* Film strip transition effect */}
          <motion.div 
            className="absolute inset-0 bg-black opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Movie slate clap animation */}
          <motion.div
            className="bg-black text-white p-6 rounded-lg shadow-2xl"
            style={{ 
              width: '60vw',
              height: '40vh',
              maxWidth: '600px',
              maxHeight: '400px',
              background: `linear-gradient(135deg, ${themeFrom.primary} 0%, ${themeTo.primary} 100%)`
            }}
            initial={{ rotateX: 90 }}
            animate={{ rotateX: 0 }}
            exit={{ rotateX: -90 }}
            transition={{ 
              type: "spring", 
              stiffness: 100, 
              damping: 20
            }}
          >
            <motion.div
              className="h-full w-full flex flex-col items-center justify-center bg-black bg-opacity-70 rounded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Old genre name with fade out */}
              <motion.div
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-2xl font-bold mb-2"
              >
                {previousGenre || ''}
              </motion.div>
              
              {/* Transition animation */}
              <motion.div
                className="my-4 text-4xl"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: [0, 5, -5, 0] }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                →
              </motion.div>
              
              {/* New genre name with fade in */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="text-3xl font-bold mt-2"
                style={{ 
                  background: `linear-gradient(90deg, ${themeTo.primary}, ${themeTo.secondary})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                {currentGenre || ''}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedGenreTransition;