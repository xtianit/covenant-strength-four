import { useState } from "react";
import { Minus, Plus, Moon, Sun, ChevronDown } from "lucide-react";

type HeaderProps = {
    logo: string;
    contentData: { lessonDate: string };
    fontSize: number;
    adjustFontSize: (delta: number) => void;
    darkMode: boolean;
    toggleTheme: () => void;
};

export default function Header({
    logo,
    contentData,
    fontSize,
    adjustFontSize,
    darkMode,
    toggleTheme,
}: HeaderProps) {
    const [openDropdown, setOpenDropdown] = useState(false);

    return (
        <div className="flex flex-row justify-between p-3 items-center gap-3 md:flex-row sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
            {/* Logo + Lesson Name */}
            <div className="flex flex-row items-center gap-2">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                    <img
                        src={logo}
                        alt="Logo"
                        className="w-10 h-10 object-contain"
                    />
                </div>
                <div className="flex flex-col">
                    <p className="text-base font-semibold">
                        Sunday School Lesson
                    </p>
                    <p className="text-sm opacity-90">
                        {contentData.lessonDate}
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2 items-center">
                {/* Desktop Controls */}
                <div className="hidden md:flex gap-2 items-center">
                    <button
                        onClick={() => adjustFontSize(-2)}
                        className="p-2 hover:bg-white/25 rounded-lg transition active:scale-95"
                        title="Decrease Font Size"
                    >
                        <Minus size={20} />
                    </button>
                    <span className="px-2 text-sm font-mono">{fontSize}px</span>
                    <button
                        onClick={() => adjustFontSize(2)}
                        className="p-2 hover:bg-white/25 rounded-lg transition active:scale-95"
                        title="Increase Font Size"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Mobile Dropdown */}
                <div className="relative md:hidden">
                    <button
                        onClick={() => setOpenDropdown(!openDropdown)}
                        className="flex items-center gap-1 p-2 bg-white/20 rounded-lg active:scale-95"
                    >
                        <span className="font-bold">Aa</span>
                        <ChevronDown size={16} />
                    </button>
                    {openDropdown && (
                        <div className="absolute right-0 mt-2 bg-white text-gray-800 rounded-xl shadow-2xl p-3 flex flex-col gap-2 w-40 border border-gray-100 z-50">
                            <button
                                onClick={() => {
                                    adjustFontSize(-2);
                                    setOpenDropdown(false);
                                }}
                                className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg font-medium text-sm"
                            >
                                <span>Decrease</span>
                                <Minus size={16} />
                            </button>
                            <span className="text-center font-bold text-blue-600 font-mono py-1 bg-gray-50 rounded">
                                {fontSize}px
                            </span>
                            <button
                                onClick={() => {
                                    adjustFontSize(2);
                                    setOpenDropdown(false);
                                }}
                                className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg font-medium text-sm"
                            >
                                <span>Increase</span>
                                <Plus size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 hover:bg-white/20 rounded-lg transition ml-2"
                >
                    {darkMode ? <Sun size={24} /> : <Moon size={24} />}
                </button>
            </div>
        </div>
    );
}