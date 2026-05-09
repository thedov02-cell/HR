import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'draw' | 'group'>('draw');

  // Draw State
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [drawHistory, setDrawHistory] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<string | null>(null);
  const [rollingName, setRollingName] = useState<string>('');

  // Group State
  const [groupSize, setGroupSize] = useState<number>(3);
  const [groups, setGroups] = useState<string[][]>([]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nameCounts = participants.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const duplicateNames = Object.keys(nameCounts).filter(name => nameCounts[name] > 1);
  const hasDuplicates = duplicateNames.length > 0;

  const handleRemoveDuplicates = () => {
    const unique = Array.from(new Set(participants));
    setInputText(unique.join('\n'));
  };

  const handleLoadMockData = () => {
    const mockData = "陳偉\n李娜\n張三\n王五\n劉七\n趙八\n孫九\n周十\n吳迪\n鄭和\n孫月\n林超\n張三\n李娜";
    setInputText(mockData);
  };

  const handleExportGroupsCSV = () => {
    if (groups.length === 0) return;
    
    let csvContent = "\uFEFFTeam,Member\n";
    groups.forEach((group, index) => {
      const groupName = `Team ${String.fromCharCode(65 + index)}`;
      group.forEach(member => {
        const safeMember = member.includes(',') || member.includes('"') 
          ? `"${member.replace(/"/g, '""')}"` 
          : member;
        csvContent += `${groupName},${safeMember}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "groups_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse Input Text to Participants
  useEffect(() => {
    const names = inputText
      .split(/[\r\n,]+/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
    setParticipants(names); 
  }, [inputText]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const names = results.data
          .flat()
          .map(item => String(item).trim())
          .filter(name => name.length > 0);
        
        const newText = names.join('\n');
        setInputText(prev => prev ? prev + '\n' + newText : newText);
      },
      error: (err: any) => {
        alert('解析 CSV 檔案失敗：' + err.message);
      }
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDraw = () => {
    const availableParticipants = allowDuplicates
      ? participants
      : participants.filter(p => !drawHistory.includes(p));

    if (availableParticipants.length === 0) {
      alert('名單已抽完！請重設歷史紀錄或允許重複中獎。');
      return;
    }

    setIsDrawing(true);
    setCurrentWinner(null);

    let rolls = 0;
    const maxRolls = 30; 
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * availableParticipants.length);
      setRollingName(availableParticipants[randomIndex]);
      rolls++;

      if (rolls >= maxRolls) {
        clearInterval(interval);
        const winnerIndex = Math.floor(Math.random() * availableParticipants.length);
        const winner = availableParticipants[winnerIndex];
        setCurrentWinner(winner);
        setDrawHistory(prev => [winner, ...prev]);
        setIsDrawing(false);
        triggerConfetti();
      }
    }, 80);
  };

  const handleClearHistory = () => {
    if (confirm('確定要清除所有抽籤紀錄嗎？')) {
      setDrawHistory([]);
      setCurrentWinner(null);
    }
  };

  const handleGenerateGroups = () => {
    if (participants.length === 0) {
      alert('請先輸入名單！');
      return;
    }
    if (groupSize < 1) {
      alert('分組人數必須大於 0！');
      return;
    }

    const shuffled = [...participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const newGroups: string[][] = [];
    for (let i = 0; i < shuffled.length; i += groupSize) {
      newGroups.push(shuffled.slice(i, i + groupSize));
    }
    setGroups(newGroups);
  };

  const handleResetApp = () => {
    if (confirm('確定要重設系統嗎？所有名單與紀錄將會清空。')) {
      setInputText('');
      setParticipants([]);
      setGroups([]);
      setDrawHistory([]);
      setCurrentWinner(null);
    }
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 100,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      {/* Sidebar Navigation & Inputs */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">H</div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">
              HR Synergy <span className="text-indigo-600">Hub</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Administrative Suite</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Input Source Section */}
          <section>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Name List Source</label>
            <div className="flex gap-2 mb-3">
              <button 
                onClick={() => document.getElementById('name-input-area')?.focus()}
                className="flex-1 py-2 px-1 text-xs font-semibold rounded-md border border-indigo-600 bg-indigo-50 text-indigo-700 transition-colors">
                Manual
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-1 text-xs font-semibold rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                CSV Import
              </button>
              <button 
                onClick={handleLoadMockData}
                className="flex-1 py-2 px-1 text-xs font-semibold rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                Sample
              </button>
               <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
            </div>
            <textarea
              id="name-input-area"
              className="w-full h-32 p-3 text-sm border border-slate-200 rounded-lg bg-slate-50 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none custom-scrollbar"
              placeholder="Chen Wei&#10;Li Na&#10;Zhang San..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            
            <div className="flex justify-between items-center mt-2">
              <p className="text-[10px] text-slate-400 italic">Count: {participants.length} names</p>
              {hasDuplicates && (
                <button 
                  onClick={handleRemoveDuplicates}
                  className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-1 rounded border border-red-200 hover:bg-red-100 transition-colors"
                >
                  Remove Duplicates ({duplicateNames.length})
                </button>
              )}
            </div>

            {participants.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar p-1.5 border border-slate-100 rounded-lg bg-slate-50/50">
                {participants.map((name, idx) => {
                  const isDuplicate = nameCounts[name] > 1;
                  return (
                    <span 
                      key={`${name}-${idx}`} 
                      className={`text-[10px] px-1.5 py-0.5 rounded ${isDuplicate ? 'bg-red-100 text-red-700 border border-red-200 font-semibold' : 'bg-white text-slate-600 border border-slate-200 shadow-sm'}`}
                      title={isDuplicate ? '重複的名字' : ''}
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            )}
          </section>

          {/* Configuration Section */}
          <section className="space-y-4">
            <label className="block text-xs font-bold text-slate-500 uppercase">Tool Settings</label>
            
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p className="text-sm font-semibold mb-2">Prize Draw Mode</p>
              <label className="flex items-center justify-between text-xs cursor-pointer group">
                <span>Allow Duplicate Wins</span>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only"
                    checked={allowDuplicates}
                    onChange={(e) => setAllowDuplicates(e.target.checked)}
                  />
                  <div className={`block w-8 h-4 rounded-full transition-colors ${allowDuplicates ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                  <div className={`absolute left-1 top-1 w-2 h-2 bg-white rounded-full transition-transform ${allowDuplicates ? 'transform translate-x-4' : ''}`}></div>
                </div>
              </label>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p className="text-sm font-semibold mb-2">Grouping Logic</p>
              <div className="flex items-center justify-between text-xs mb-2">
                <span>People per Group</span>
                <span className="font-bold text-indigo-600">{groupSize}</span>
              </div>
              <input 
                type="range" 
                className="w-full accent-indigo-600" 
                min="2" 
                max="20" 
                value={groupSize}
                onChange={(e) => setGroupSize(parseInt(e.target.value) || 2)}
              />
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-100">
          <button 
            onClick={handleResetApp}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors">
            Reset Application
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Tab Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shrink-0">
          <nav className="flex gap-8 h-full">
            <button 
              onClick={() => setActiveTab('draw')}
              className={`h-16 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'draw' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path></svg>
              Prize Draw
            </button>
            <button 
              onClick={() => setActiveTab('group')}
              className={`h-16 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'group' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              Automatic Grouping
            </button>
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-xs text-slate-400 font-medium italic">
              {participants.length > 0 ? "Ready for action" : "Awaiting input"}
            </span>
          </div>
        </header>

        {/* Workspace Stage */}
        <div className="flex-1 p-8 overflow-hidden h-full flex flex-col">
          
          {activeTab === 'draw' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full flex-1">
              
              {/* Left Area: Drawing Visualization */}
              <div className="md:col-span-8 flex flex-col gap-6 h-full min-h-0">
                <div className="flex-1 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 min-h-0 relative overflow-hidden">
                  
                  {(!isDrawing && !currentWinner) && (
                    <>
                      <div className="text-slate-300 mb-4 focus:outline-none">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                      </div>
                      <h2 className="text-slate-400 text-xl font-medium">Ready to select winner</h2>
                      <p className="text-slate-400 text-sm mb-8">Press the button below to start the animation</p>
                    </>
                  )}

                  <div className="relative flex items-center justify-center my-4 h-64 w-64 shrink-0">
                    {/* Ring background */}
                     <div className={`absolute w-full h-full bg-indigo-50 rounded-full ${isDrawing ? 'animate-pulse scale-110' : ''} transition-all duration-300`}></div>
                     
                     {/* Center content */}
                     <div className="relative w-48 h-48 bg-white border-4 border-indigo-600 rounded-full flex flex-col items-center justify-center shadow-xl z-10 overflow-hidden p-4">
                        <AnimatePresence mode="wait">
                          {isDrawing ? (
                            <motion.div
                              key="rolling"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="w-full text-center"
                            >
                              <div className="text-3xl font-bold text-indigo-600 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis px-2">
                                {rollingName || '?'}
                              </div>
                            </motion.div>
                          ) : currentWinner ? (
                             <motion.div
                              key="winner"
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="w-full text-center"
                            >
                              <div className="text-4xl font-black text-slate-800 tracking-tight leading-tight line-clamp-3 overflow-hidden text-ellipsis">
                                {currentWinner}
                              </div>
                            </motion.div>
                          ) : (
                             <motion.div
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                             >
                                <span className="text-indigo-600 font-bold text-5xl">?</span>
                             </motion.div>
                          )}
                        </AnimatePresence>
                     </div>
                  </div>

                  <button 
                    onClick={handleDraw}
                    disabled={isDrawing || participants.length === 0}
                    className="mt-8 px-10 py-4 bg-indigo-600 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none text-white rounded-full font-black text-lg shadow-xl shadow-indigo-200 active:scale-95 transition-all outline-none">
                    {isDrawing ? 'DRAWING...' : 'SPIN TO WIN'}
                  </button>
                </div>
              </div>

              {/* Right Area: Results Side Panel */}
              <div className="md:col-span-4 flex flex-col gap-6 h-full min-h-0">
                <div className="flex-1 bg-slate-900 rounded-2xl p-6 text-white overflow-hidden flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-6 shrink-0">
                    <h3 className="font-bold text-lg">Recent Winners</h3>
                    <span className="bg-indigo-500 text-[10px] px-2 py-0.5 rounded uppercase">
                      {drawHistory.length} Total
                    </span>
                  </div>
                  
                  <div className="space-y-3 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                    {drawHistory.length === 0 ? (
                       <div className="py-12 flex flex-col items-center border border-dashed border-white/10 rounded-xl">
                          <p className="text-white/20 text-xs">Waiting for more winners...</p>
                       </div>
                    ) : (
                      drawHistory.map((winner, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={`win-${idx}`} 
                          className={`flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10 ${idx !== 0 ? 'opacity-60' : ''}`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-slate-900 font-bold text-xs shrink-0 ${idx === 0 ? 'bg-amber-400' : 'bg-slate-400'}`}>
                            {String(drawHistory.length - idx).padStart(2, '0')}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{winner}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest truncate">
                              {idx === 0 ? 'Latest Winner' : 'Previous Winner'}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                  
                  {drawHistory.length > 0 && (
                    <div className="mt-4 pt-4 shrink-0">
                      <button 
                        onClick={handleClearHistory}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors text-white">
                        Clear Hall of Fame
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'group' && (
            <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 p-6 overflow-hidden">
               <div className="flex justify-between items-center mb-6 shrink-0">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Automatic Grouping</h2>
                    <p className="text-slate-500 text-sm">Organize members into dynamic teams</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {groups.length > 0 && (
                      <button
                        onClick={handleExportGroupsCSV}
                        className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Export CSV
                      </button>
                    )}
                    <button
                      onClick={handleGenerateGroups}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg font-bold text-sm shadow-md transition-colors"
                    >
                      Generate Groups
                    </button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 rounded-xl border border-slate-100 p-6 min-h-0">
                 {groups.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                      <p className="text-sm font-medium text-slate-500">Configure group size and click Generate</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
                      {groups.map((group, groupIndex) => (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: groupIndex * 0.05 }}
                          key={`group-${groupIndex}`}
                          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col"
                        >
                          <div className="bg-indigo-50/50 px-5 py-3 border-b border-indigo-100/50 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                              Team {String.fromCharCode(65 + groupIndex)}
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded uppercase">
                              {group.length} Members
                            </span>
                          </div>
                          <ul className="divide-y divide-slate-50 flex-1 overflow-y-auto max-h-[250px] p-2 custom-scrollbar">
                            {group.map((member, memberIndex) => (
                              <li key={`member-${memberIndex}`} className="px-3 py-2 text-sm font-medium text-slate-700 flex items-center gap-3">
                                <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {memberIndex + 1}
                                </div>
                                <span className="truncate">{member}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      ))}
                    </div>
                  )}
               </div>
            </div>
          )}

        </div>
        
        {/* Status Bar */}
        <footer className="h-10 bg-white border-t border-slate-200 px-8 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
           <div className="flex items-center gap-4">
             <span>Status: <span className="text-emerald-500 font-bold">Active System</span></span>
             <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
             <span>Database: {participants.length} Records</span>
           </div>
           <div>v2.4.0 HR Synergy Hub</div>
        </footer>
      </main>

      <style>{`
        /* Custom UI Scrollbar styling */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
}


