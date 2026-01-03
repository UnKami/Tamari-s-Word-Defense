
import React, { useState } from 'react';
import { WordDetail } from '../types';

interface GrimoireProps {
  words: WordDetail[];
  onClose: () => void;
  onClaimReward: (word: string) => void;
}

const Grimoire: React.FC<GrimoireProps> = ({ words, onClose, onClaimReward }) => {
  const [selectedWord, setSelectedWord] = useState<WordDetail | null>(null);

  return (
    <div className="fixed inset-0 z-[100] bg-indigo-950/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
      <div className="relative w-full max-w-7xl h-full sm:h-[90vh] bg-slate-900 sm:border-4 border-indigo-500/50 sm:rounded-[2.5rem] shadow-[0_0_100px_rgba(129,140,248,0.2)] overflow-hidden flex flex-col sm:flex-row">
        
        {/* WORD LIST PANEL */}
        <div className={`transition-all duration-500 h-full flex flex-col bg-slate-950 border-r-2 border-indigo-900/30
          ${selectedWord ? 'hidden sm:flex sm:w-80' : 'w-full flex-1'}
        `}>
          <div className="p-6 bg-indigo-900/20 shrink-0 flex justify-between items-center">
            <div>
              <h2 className="text-2xl bungee text-indigo-400 tracking-tighter">LEXICON ARCHIVE</h2>
              <div className="text-[10px] font-black text-indigo-500 uppercase mt-1">
                Sync Bonus: <span className="text-white">+{words.length * 2}% DMG</span>
              </div>
            </div>
            {!selectedWord && (
               <button 
                onClick={onClose}
                className="text-indigo-400 hover:text-white bg-indigo-950 w-10 h-10 rounded-2xl flex items-center justify-center transition-all border border-indigo-800"
              >✕</button>
            )}
          </div>
          
          <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${!selectedWord ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3' : 'flex flex-col gap-2'}`}>
            {words.length === 0 ? (
              <div className="col-span-full h-full flex flex-col items-center justify-center text-indigo-400/20 py-20 px-4 text-center">
                <span className="text-6xl mb-4 block">📡</span>
                <span className="bungee text-sm tracking-widest uppercase">No Data Extracted</span>
              </div>
            ) : (
              words.sort((a, b) => b.attackPower - a.attackPower).map(wordDetail => (
                <button
                  key={wordDetail.word}
                  onClick={() => setSelectedWord(wordDetail)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border-2 flex flex-col gap-1 group relative overflow-hidden
                    ${selectedWord?.word === wordDetail.word 
                      ? 'bg-indigo-500 border-white text-white shadow-xl scale-[0.98]' 
                      : 'bg-indigo-900/10 border-indigo-900/50 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400/50'}
                  `}
                >
                  <div className="flex justify-between items-center w-full relative z-10">
                    <span className="font-black text-sm tracking-widest uppercase">{wordDetail.word}</span>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-md ${selectedWord?.word === wordDetail.word ? 'bg-white/20' : 'bg-indigo-900/50'}`}>
                      {wordDetail.attackPower} ATK
                    </span>
                  </div>
                  {!selectedWord && (
                    <div className="mt-1 text-[8px] opacity-60 uppercase font-bold">
                      {wordDetail.partOfSpeech} • Rank {wordDetail.defeatCount}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* WORD DETAIL PANEL */}
        {selectedWord && (
          <div className="flex-1 flex flex-col relative bg-slate-900 animate-in slide-in-from-right duration-500 overflow-hidden">
            <div className="p-4 sm:p-8 flex justify-between items-center bg-slate-950/30 border-b border-white/5 shrink-0 z-20">
               <button 
                onClick={() => setSelectedWord(null)}
                className="flex items-center gap-2 text-indigo-400 hover:text-white transition-colors text-xs font-black bungee"
               >
                 ← <span className="hidden sm:inline">BACK TO LIST</span>
               </button>
               <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10"
               >✕</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              <div className="p-6 sm:p-12 max-w-4xl mx-auto">
                
                {/* Header Section */}
                <div className="mb-12 relative">
                  <span className="text-pink-500 text-[10px] font-black uppercase tracking-[0.4em] mb-1 block">Data Extract Entry</span>
                  <h1 className="text-6xl sm:text-8xl bungee text-white mt-1 mb-4 leading-none tracking-tighter drop-shadow-[0_10px_30px_rgba(255,255,255,0.1)]">
                    {selectedWord.word}
                  </h1>
                  <div className="flex flex-wrap gap-3 items-center">
                    <span className="bg-pink-500 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full">{selectedWord.partOfSpeech}</span>
                    <div className="bg-indigo-600/30 border border-indigo-500/50 text-indigo-100 text-[10px] font-black uppercase px-4 py-1.5 rounded-full">
                       Attack Value: {selectedWord.attackPower}
                    </div>
                    <span className="w-px h-4 bg-white/10 mx-1" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Mastery Rank: {selectedWord.defeatCount}</span>
                  </div>
                </div>

                {/* Content Blocks */}
                <div className="space-y-10">
                  
                  {/* Definition Box */}
                  <div className="p-8 bg-indigo-950/30 rounded-[2.5rem] border-2 border-indigo-500/20 relative shadow-2xl">
                    <div className="absolute -top-3 left-8 bg-slate-900 px-3 text-indigo-400 text-[10px] font-black uppercase italic tracking-widest">Primary Scan Result</div>
                    {selectedWord.definition === "Loading..." ? (
                      <div className="flex items-center gap-4 py-4 animate-pulse">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 animate-ping" />
                        <span className="text-indigo-400 italic font-medium">Extracting data records...</span>
                      </div>
                    ) : (
                      <p className="text-2xl sm:text-3xl text-indigo-500 font-medium leading-relaxed italic">
                        "{selectedWord.definition}"
                      </p>
                    )}
                  </div>

                  {selectedWord.definition !== "Loading..." && (
                    <>
                      {/* Real-world Usage Section */}
                      <section className="bg-slate-950/50 p-8 rounded-3xl border border-indigo-900/50 shadow-inner">
                        <h4 className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" /> Real-world Usage
                        </h4>
                        <p className="text-indigo-100 text-lg sm:text-xl leading-relaxed font-semibold">
                          {selectedWord.example}
                        </p>
                      </section>

                      {/* Ancient Records (Etymology) Section */}
                      {selectedWord.etymology && (
                        <section className="px-4">
                          <h4 className="text-pink-500/80 text-[10px] font-black uppercase tracking-[0.4em] mb-3 flex items-center gap-2">
                            <span className="w-6 h-[1px] bg-pink-500/30" /> Ancient Records
                          </h4>
                          <p className="text-slate-400 text-sm sm:text-base leading-relaxed italic max-w-2xl">
                            {selectedWord.etymology}
                          </p>
                        </section>
                      )}

                      {/* SYNC KNOWLEDGE Button */}
                      <section className="pt-12 pb-8 flex flex-col items-center">
                        {!selectedWord.rewardClaimed ? (
                          <button
                            onClick={() => onClaimReward(selectedWord.word)}
                            className="anime-gradient text-white font-black py-6 px-16 rounded-full shadow-[0_20px_50px_rgba(236,72,153,0.4)] transition-all hover:scale-105 active:scale-95 group flex flex-col items-center"
                          >
                            <span className="bungee text-xl tracking-[0.2em]">SYNC KNOWLEDGE</span>
                            <span className="text-[10px] font-black uppercase mt-1 opacity-80">+10 YEN REWARD</span>
                          </button>
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-4 text-emerald-400 bg-emerald-500/10 py-4 px-12 rounded-full border-2 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                              <span className="text-2xl">✔️</span>
                              <span className="bungee text-sm tracking-widest uppercase">KNOWLEDGE SYNCHRONIZED</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Mastery Sync: Complete</span>
                          </div>
                        )}
                      </section>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Grimoire;
