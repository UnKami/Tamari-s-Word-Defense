
import React from 'react';

interface UIOverlayProps {
  health: number;
  coins: number;
  wave: number;
  isWaveActive: boolean;
  onStartWave: () => void;
  onOpenUpgrades: () => void;
  onOpenGrimoire: () => void;
  onLogout?: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  health,
  coins,
  wave,
  isWaveActive,
  onStartWave,
  onOpenUpgrades,
  onOpenGrimoire,
  onLogout
}) => {
  return (
    <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 z-50">
      {/* Anime Stats HUD */}
      <div className="flex items-center gap-2">
        <div className="bg-indigo-950/80 backdrop-blur-xl border-2 border-indigo-400/50 rounded-2xl p-2 sm:p-3 shadow-[0_0_20px_rgba(129,140,248,0.2)] flex gap-4 sm:gap-6 items-center">
          <div className="flex flex-col">
            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest italic">HP</span>
            <div className="flex items-center gap-2">
               <div className="w-32 h-3 bg-slate-900 rounded-full overflow-hidden border border-indigo-800">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 to-red-500 transition-all duration-500"
                    style={{ width: `${(health / 10) * 100}%` }}
                  />
               </div>
               <span className="text-sm font-black text-pink-400 bungee">{health}</span>
            </div>
          </div>
          <div className="h-8 w-px bg-indigo-800/50" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest italic">YEN</span>
            <span className="text-lg font-black text-amber-400 bungee">
              ¥ {coins}
            </span>
          </div>
          <div className="h-8 w-px bg-indigo-800/50" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-indigo-300 font-black uppercase tracking-widest italic">STAGE</span>
            <span className="text-lg font-black text-white bungee">
              #{wave}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 w-full sm:w-auto">
        {!isWaveActive ? (
          <>
            <button
              onClick={onOpenGrimoire}
              className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2 sm:py-3 px-5 rounded-2xl shadow-lg transition-all active:scale-95 border-b-4 border-indigo-800 text-[10px] sm:text-xs flex items-center justify-center gap-2 group"
            >
              <span className="text-lg group-hover:rotate-12 transition-transform">📚</span>
              <span>LEXICON</span>
            </button>
            <button
              onClick={onOpenUpgrades}
              className="flex-1 sm:flex-none bg-pink-600 hover:bg-pink-500 text-white font-black py-2 sm:py-3 px-5 rounded-2xl shadow-lg transition-all active:scale-95 border-b-4 border-pink-800 text-[10px] sm:text-xs flex items-center justify-center gap-2"
            >
              <span className="text-lg">⚙️</span>
              <span>GEAR</span>
            </button>
            <button
              onClick={onStartWave}
              className="flex-1 sm:flex-none bg-indigo-100 hover:bg-white text-indigo-900 font-black py-2 sm:py-3 px-8 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all active:scale-95 border-b-4 border-indigo-300 bungee text-sm sm:text-lg group"
            >
              READY!
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-500 text-white font-black py-2 sm:py-3 px-4 rounded-2xl shadow-lg transition-all active:scale-95 border-b-4 border-red-800 text-[10px] sm:text-xs"
              >
                LOGOUT
              </button>
            )}
          </>
        ) : (
          <div className="w-full sm:w-auto bg-pink-500/20 backdrop-blur-md border-2 border-pink-500/50 rounded-2xl px-6 py-3 shadow-xl text-center flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
             <span className="text-pink-400 font-black tracking-widest uppercase text-xs sm:text-sm bungee">BATTLE START!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UIOverlay;
