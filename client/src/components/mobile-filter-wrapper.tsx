import React, { FC, ReactNode } from 'react';

interface MobileFilterWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * A wrapper component specifically designed to handle mobile filter menus
 * with proper stacking context and solid backgrounds.
 */
const MobileFilterWrapper: FC<MobileFilterWrapperProps> = ({ 
  children,
  className = ""
}) => {
  return (
    <div className={`relative md:hidden ${className}`}>
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          borderRadius: '0.5rem',
          zIndex: -1,
        }}
      />
      <div style={{ 
        position: 'relative',
        zIndex: 1,
        backgroundColor: 'transparent' 
      }}>
        {children}
      </div>
    </div>
  );
};

export default MobileFilterWrapper;