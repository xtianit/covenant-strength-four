import React from 'react';
import { Zap } from 'lucide-react';

interface XpToastProps {
  xpGained: number | null;
}

export const XpToast: React.FC<XpToastProps> = ({ xpGained }) => {
  if (!xpGained) return null;

  return (
    <div className="fixed top-5 right-5 z-50 animate-bounce bg-amber-500 text-slate-950 px-4 py-2 rounded-2xl font-black text-xs shadow-xl shadow-amber-500/20 flex items-center gap-2 border border-amber-300">
      <Zap aria-hidden="true" className="fill-current" size="{16}"/>
      <span>+{xpGained} Spiritual XP!</span>
    </div>
  );
};