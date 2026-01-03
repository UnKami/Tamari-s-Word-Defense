
import React from 'react';

interface KeyboardProps {
  onKey: (char: string) => void;
}

const Keyboard: React.FC<KeyboardProps> = ({ onKey }) => {
  const rows = [
    { 
      keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], 
      margin: 'ml-0' 
    },
    { 
      keys: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], 
      margin: 'ml-[5%]' // Row 2 offset by 0.5 units
    },
    { 
      keys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M'], 
      margin: 'ml-[12%]' // Row 3 offset by 1.25 units (standard QWERTY)
    }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-950/90 backdrop-blur-xl p-3 sm:p-5 rounded-[2rem] border border-white/10 flex flex-col gap-2 shadow-2xl relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full px-4 py-1 bg-slate-950 border-x border-t border-white/10 rounded-t-xl text-[8px] font-black text-indigo-400 uppercase tracking-widest">
        Standard QWERTY Practice
      </div>
      
      {rows.map((row, i) => (
        <div 
          key={i} 
          className={`flex gap-1 sm:gap-1.5 w-full ${row.margin}`}
        >
          {row.keys.map(char => (
            <button
              key={char}
              onMouseDown={(e) => {
                e.preventDefault();
                onKey(char);
              }}
              className="flex-1 min-w-0 max-w-[55px] h-12 sm:h-14 bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 rounded-lg sm:rounded-xl font-black text-sm sm:text-xl shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-1 transition-all border border-white/5 text-white flex items-center justify-center touch-manipulation"
            >
              {char}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
