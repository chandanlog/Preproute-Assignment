import React from 'react';

interface PrepRouteLogoProps {
  className?: string;
  height?: number | string;
  width?: number | string;
}

export const PrepRouteLogo: React.FC<PrepRouteLogoProps> = ({ className = '', height = 36, width = 'auto' }) => {
  return (
    <div className={`preproute-logo-wrapper ${className}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <svg 
        viewBox="0 0 160 48" 
        height={height} 
        width={width} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        {/* Road Ribbon Base (Blue) */}
        <path 
          d="M 16 34 C 16 12, 64 6, 96 16 C 112 21, 136 24, 146 16" 
          stroke="#3b82f6" 
          strokeWidth="6" 
          strokeLinecap="round" 
          fill="none" 
        />
        
        {/* Road Ribbon Center Line (White Dashed) */}
        <path 
          d="M 16 34 C 16 12, 64 6, 96 16 C 112 21, 136 24, 146 16" 
          stroke="#ffffff" 
          strokeWidth="1.5" 
          strokeDasharray="3,3" 
          strokeLinecap="round" 
          fill="none" 
        />

        {/* Text */}
        <text 
          x="12" 
          y="40" 
          fontFamily="'Outfit', 'Inter', system-ui, sans-serif" 
          fontWeight="800" 
          fontSize="30" 
          letterSpacing="-0.5px"
        >
          <tspan fill="#1e3a8a">Prep</tspan>
          <tspan fill="#3b82f6" fontWeight="600">route</tspan>
        </text>
      </svg>
    </div>
  );
};

export default PrepRouteLogo;
