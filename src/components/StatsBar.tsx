import React from 'react';
import { Zap, CheckSquare } from 'lucide-react';

interface StatsBarProps {
  userXp: number;
  isCheckedIn: boolean;
  onOpenAchievements: () => void;
  onOpenAttendance: () => void;
  darkMode: boolean;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  userXp,
  isCheckedIn,
  onOpenAchievements,
  onOpenAttendance,
  darkMode
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      <button
        onClick={onOpenAchievements}
        className={`group p-4 rounded-2xl border flex items-center gap-3.5 text-left transition-all duration-300 hover:scale-[1.02] hover:border-amber-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm ${
          darkMode ? "bg-slate-900/50 border-slate-800/80 text-slate-100" : "bg-white border-slate-200 text-slate-900"
        }`}
        aria-label={`Spiritual XP: ${userXp}. Click to view achievements.`}
      >
        <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl shrink-0 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors duration-300">
          <Zap size={20} aria-hidden="true" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">Spiritual XP</span>
          <span className="font-black text-base text-amber-500 tracking-tight">{userXp} XP</span>
        </div>
      </button>
      
      <button
        onClick={onOpenAttendance}
        className={`group p-4 rounded-2xl border flex items-center gap-3.5 text-left transition-all duration-300 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm ${
          isCheckedIn 
            ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300" 
            : darkMode ? "bg-slate-900/50 border-slate-800/80 text-slate-100" : "bg-white border-slate-200 text-slate-900"
        }`}
        aria-label={isCheckedIn ? "Attendance Checked In" : "Click to mark attendance"}
      >
        <div className={`p-2.5 rounded-xl shrink-0 transition-colors duration-300 ${isCheckedIn ? "bg-emerald-500 text-white" : "bg-blue-500/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white"}`}>
          <CheckSquare size={20} aria-hidden="true" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">Attendance</span>
          <span className="font-black text-xs sm:text-sm tracking-tight">{isCheckedIn ? "Checked In ✓" : "Mark Attendance"}</span>
        </div>
      </button>
    </div>
  );
};