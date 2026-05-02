import React from 'react';

interface LogoProps {
  className?: string;
  language?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8", language = "javascript" }) => {
  // Determine accent color based on language mode
  const accentStroke = language === 'c++' 
    ? 'stroke-blue-500' // Blue for C++
    : 'stroke-[#f97316]'; // Saffron orange for JS

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100"
      className={`${className} transform transition-all duration-300 hover:scale-110 hover:-rotate-3`}
    >
      {/* Shadow offset */}
      <rect x="16" y="16" width="76" height="76" rx="10" className="fill-[#0f172a] dark:fill-black" />
      {/* Main bounding box */}
      <rect x="10" y="10" width="76" height="76" rx="10" className="fill-white dark:fill-[#111113] stroke-[#0f172a] dark:stroke-[#333333] stroke-[4px]" strokeLinejoin="round" />

      {/* Subtle Graph Grid Background */}
      <path d="M 10,35 L 86,35 M 10,60 L 86,60 M 35,10 L 35,86 M 60,10 L 60,86" className="stroke-[#0f172a] dark:stroke-white stroke-[1.5px] opacity-15 dark:opacity-10" strokeDasharray="2 4" />

      {/* The "A" (Graph Edges) */}
      <path d="M 22,66 L 36,32 L 50,66" className="fill-none stroke-[#0f172a] dark:stroke-[#f1f5f9] stroke-[8px]" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 27,53 L 45,53" className="fill-none stroke-[#0f172a] dark:stroke-[#f1f5f9] stroke-[8px]" strokeLinecap="round" strokeLinejoin="round" />

      {/* The "V" (Dynamic Accent Edges) */}
      <path d="M 52,32 L 66,66 L 80,32" className={`fill-none ${accentStroke} stroke-[8px] transition-colors duration-300`} strokeLinecap="round" strokeLinejoin="round" />

      {/* Nodes (Vertices) */}
      <circle cx="22" cy="66" r="4.5" className="fill-white dark:fill-[#111113] stroke-[#0f172a] dark:stroke-[#f1f5f9] stroke-[3.5px]" />
      <circle cx="36" cy="32" r="4.5" className="fill-white dark:fill-[#111113] stroke-[#0f172a] dark:stroke-[#f1f5f9] stroke-[3.5px]" />
      <circle cx="50" cy="66" r="4.5" className="fill-white dark:fill-[#111113] stroke-[#0f172a] dark:stroke-[#f1f5f9] stroke-[3.5px]" />

      {/* V Nodes */}
      <circle cx="52" cy="32" r="4.5" className={`fill-white dark:fill-[#111113] ${accentStroke} stroke-[3.5px] transition-colors duration-300`} />
      <circle cx="66" cy="66" r="4.5" className={`fill-white dark:fill-[#111113] ${accentStroke} stroke-[3.5px] transition-colors duration-300`} />
      <circle cx="80" cy="32" r="4.5" className={`fill-white dark:fill-[#111113] ${accentStroke} stroke-[3.5px] transition-colors duration-300`} />
    </svg>
  );
};

export default Logo;
