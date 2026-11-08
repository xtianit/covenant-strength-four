import React from 'react';
import { Compass, BookOpen, Shield, Award, Flame } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const tabs: TabItem[] = [
  { id: 'intro', label: 'Intro', icon: Compass },
  { id: 'lesson', label: 'Lesson', icon: BookOpen },
  { id: 'conclusion', label: 'Summary', icon: Shield },
  { id: 'quiz', label: 'Quiz', icon: Award },
  { id: 'chat', label: 'Prayer', icon: Flame },
];

interface MobileNavProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 px-2 py-2"
    >
      <div className="flex justify-around items-center" role="tablist">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
                isActive
                  ? 'text-blue-400 scale-110'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon aria-hidden="true" size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};