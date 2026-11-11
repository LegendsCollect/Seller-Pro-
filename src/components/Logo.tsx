import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', theme = 'light', showTagline = false }) => {
  const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Recognizable brand symbol: Diamond hex shield with upward profit step */}
      <div
        className={`${iconSize} rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950'
            : 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4/6 h-4/6"
        >
          {/* Stylized 'S' merged with upward profit growth trend */}
          <path d="M16 4h4v4" />
          <path d="M20 4l-7.5 7.5-3-3L3 15" />
          <path d="M19 12v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-2" strokeWidth="2" />
        </svg>
      </div>

      <div className="flex flex-col">
        <span
          className={`font-extrabold tracking-tight leading-none ${textSize} ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}
        >
          Seller<span className="text-emerald-500">Pro</span>
        </span>
        {showTagline && (
          <span
            className={`text-[10px] tracking-wide font-medium mt-0.5 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Sell smarter. Keep more profit.
          </span>
        )}
      </div>
    </div>
  );
};
