import React from 'react';
import { Compass, BookOpen, Shield, Award, Flame } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const tabs: TabItem[] = [
  { id: 'intro', label: 'Introduction', icon: Compass },
  { id: 'lesson', label: 'Core Lesson', icon: BookOpen },
  { id: 'conclusion', label: 'Summary', icon: Shield },
  { id: 'application', label: 'Application', icon: Shield },
  { id: 'quiz', label: 'Speed Quiz', icon: Award },
  { id: 'chat', label: 'Intercession', icon: Flame },
];

interface NavigationTabsProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  darkMode: boolean;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, onTabChange, darkMode }) => {
  return (
    <div 
      role="tablist"
      aria-label="Sunday School Sections"
      className="flex gap-2.5 mb-8 overflow-x-auto pb-3 scrollbar-none justify-start md:justify-center px-1"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`group relative px-5 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center gap-2.5 text-xs sm:text-sm shrink-0 border backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isActive
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400/50 shadow-lg shadow-blue-600/25 scale-105 ring-1 ring-blue-400/30"
                : darkMode
                ? "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:border-slate-700"
                : "bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
            }`}
          >
            <Icon size={16} aria-hidden="true" className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};