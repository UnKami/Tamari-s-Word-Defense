
import React from 'react';
import { TowerData, TowerType } from '../types';
import { TOWER_STATS } from '../constants';

interface UpgradeMenuProps {
  towers: TowerData[];
  coins: number;
  onUpgrade: (id: string) => void;
  onClose: () => void;
}

const UpgradeMenu: React.FC<UpgradeMenuProps> = ({ towers, coins, onUpgrade, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-2xl bungee tracking-widest text-indigo-400">TOWER ARMORY</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-700 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {towers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 italic">No towers built yet. Deploy some on the map first!</div>
          ) : (
            <div className="grid gap-4">
              {towers.map(tower => {
                const stats = TOWER_STATS[tower.type];
                const upgradeCost = stats.upgradeCost(tower.level);
                const currentEffect = stats.effectValue(tower.level);
                const nextEffect = stats.effectValue(tower.level + 1);
                
                return (
                  <div key={tower.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between group hover:border-slate-500 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-inner
                        ${tower.type === TowerType.SLOW ? 'bg-blue-900/50 text-blue-400' : 'bg-amber-900/50 text-amber-400'}
                      `}>
                        {tower.type === TowerType.SLOW ? '❄️' : '✨'}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-white">
                          {tower.type === TowerType.SLOW ? 'Slow Tower' : 'Autofill Tower'}
                          <span className="ml-2 text-xs text-slate-400 font-normal uppercase tracking-widest">Level {tower.level}</span>
                        </div>
                        <div className="text-sm text-slate-400">
                          {tower.type === TowerType.SLOW 
                            ? `Current Slow: ${(100 - currentEffect * 100).toFixed(0)}% ➔ ${(100 - nextEffect * 100).toFixed(0)}%`
                            : `Cooldown: ${currentEffect.toFixed(0)}s ➔ ${nextEffect.toFixed(0)}s`
                          }
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onUpgrade(tower.id)}
                      disabled={coins < upgradeCost}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md active:scale-95 flex flex-col items-center min-w-[120px]"
                    >
                      <span className="text-sm">UPGRADE</span>
                      <span className="text-xs opacity-80">🪙 {upgradeCost}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-800/50 border-t border-slate-800 flex justify-center">
            <div className="text-lg font-bold text-slate-400">
                Your Funds: <span className="text-amber-400">🪙 {coins}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeMenu;
