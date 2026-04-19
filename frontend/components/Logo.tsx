import React from 'react';

interface LogoProps {
  className?: string;
  language?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8", language = "javascript" }) => {
  // Determine dot color based on language mode
  const dotColor = language === 'c++' 
    ? 'fill-blue-500' // Blue for C++
    : 'fill-[#f97316]'; // Saffron orange for JS

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100"
      className={`${className} transform transition-all duration-300 hover:scale-110 hover:-rotate-3`}
    >
      {/* Shadow offset */}
      <rect x="18" y="18" width="74" height="74" rx="8" className="fill-[#0f172a] dark:fill-black" />
      {/* Main bounding box centered at x=50, y=50 */}
      <rect x="13" y="13" width="74" height="74" rx="8" className="fill-white dark:fill-[#111113] stroke-[#0f172a] dark:stroke-[#444444] stroke-[5px]" strokeLinejoin="round" />

      {/* A centered and scaled inside perfectly */}
      <path d="M 21,66 L 31,34 L 41,66 M 26,53 L 36,53" className="fill-none stroke-[#0f172a] dark:stroke-[#f1f5f9] stroke-[7px]" strokeLinecap="round" strokeLinejoin="round" />
      {/* V directly adjacent */}
      <path d="M 45,34 L 55,66 L 65,34" className="fill-none stroke-[#0f172a] dark:stroke-[#f1f5f9] stroke-[7px]" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Dot with dynamic color */}
      <circle cx="74" cy="62" r="4.5" className={`${dotColor} transition-colors duration-300`} />
    </svg>
  );
};

export default Logo;
