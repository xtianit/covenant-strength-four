import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Lightbulb, RotateCcw } from "lucide-react";

type Level = "read" | "easy" | "medium" | "hard";

const LEVELS: { id: Level; label: string; ratio: number }[] = [
    { id: "read", label: "Read", ratio: 0 },
    { id: "easy", label: "Easy", ratio: 0.25 },
    { id: "medium", label: "Medium", ratio: 0.5 },
    { id: "hard", label: "Hard", ratio: 1 },
];

function rng(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const letters = (w: string) => w.replace(/[^a-z]/gi, "").length;

interface Props {
    text: string;
    reference: string;
    darkMode: boolean;
    onOpenReader: () => void;
    onMastered: (level: string) => void;
}

export default function MemoryVerse({ text, reference, darkMode, onOpenReader, onMastered }: Props) {
    const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
    const [level, setLevel] = useState<Level>("read");
    const [seed, setSeed] = useState(1);
    const [revealed, setRevealed] = useState<number[]>([]);
    const fired = useRef("");

    const hidden = useMemo(() => {
        const ratio = LEVELS.find((l) => l.id === level)?.ratio ?? 0;
        if (ratio === 0) return [] as number[];
        const minLen = level === "hard" ? 1 : 4;
        const eligible = words.map((_, i) => i).filter((i) => letters(words[i]) >= minLen);
        const rand = rng(seed * 9973 + words.length);
        for (let i = eligible.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
        }
        return eligible.slice(0, Math.max(1, Math.round(eligible.length * ratio)));
    }, [words, level, seed]);

    const done = hidden.length > 0 && hidden.every((i) => revealed.includes(i));

    useEffect(() => {
        const key = `${level}-${seed}`;
        if (done && fired.current !== key) {
            fired.current = key;
            onMastered(level);
        }
    }, [done, level, seed, onMastered]);

    const choose = (l: Level) => {
        setLevel(l);
        setRevealed([]);
    };
    const reveal = (i: number) => setRevealed((r) => (r.includes(i) ? r : [...r, i]));
    const hint = () => {
        const next = hidden.find((i) => !revealed.includes(i));
        if (next !== undefined) reveal(next);
    };

    return (
        <section
            aria-label="Memory verse"
            className={`ssa-glow relative overflow-hidden rounded-3xl border p-5 sm:p-7 ${
                darkMode ? "border-indigo-500/30 bg-gradient-to-br from-indigo-950/70 via-slate-900/70 to-purple-950/50" : "border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50"
            }`}
        >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                    <BookOpen size={16} aria-hidden="true" /> Memory Verse
                </h2>
                <div role="group" aria-label="Memory challenge difficulty" className="flex gap-1 rounded-xl bg-black/20 p-1">
                    {LEVELS.map((l) => (
                        <button
                            key={l.id}
                            type="button"
                            aria-pressed={level === l.id}
                            onClick={() => choose(l.id)}
                            className={`rounded-lg px-3 py-1 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                                level === l.id ? "bg-indigo-500 text-white shadow" : darkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
            </div>

            <blockquote className="font-serif text-lg italic leading-loose sm:text-2xl">
                “
                {words.map((w, i) => {
                    if (!hidden.includes(i)) return <span key={i}>{w} </span>;
                    if (revealed.includes(i))
                        return (
                            <span key={i} className="ssa-pop inline-block font-semibold text-emerald-400">
                                {w}{" "}
                            </span>
                        );
                    return (
                        <span key={i}>
                            <button
                                type="button"
                                onClick={() => reveal(i)}
                                aria-label="Hidden word. Tap to reveal"
                                className="ssa-blank rounded text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                {"_".repeat(Math.min(Math.max(letters(w), 2), 9))}
                            </button>{" "}
                        </span>
                    );
                })}
                ”
            </blockquote>
            <p className="mt-2 text-sm font-bold text-indigo-400">{reference}</p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={onOpenReader}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                    <BookOpen size={14} aria-hidden="true" /> Read in 6 versions
                </button>
                {hidden.length > 0 && (
                    <>
                        <button type="button" onClick={hint} disabled={done} className="flex items-center gap-1.5 rounded-xl bg-amber-500/90 px-3.5 py-2 text-xs font-semibold text-slate-900 transition hover:bg-amber-400 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
                            <Lightbulb size={14} aria-hidden="true" /> Hint
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSeed((s) => s + 1);
                                setRevealed([]);
                            }}
                            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${darkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-200 text-slate-800 hover:bg-slate-300"}`}
                        >
                            <RotateCcw size={14} aria-hidden="true" /> Shuffle
                        </button>
                        <span className="ml-auto text-xs font-mono opacity-70" aria-live="polite">
                            {revealed.filter((i) => hidden.includes(i)).length}/{hidden.length} revealed
                        </span>
                    </>
                )}
            </div>
            {hidden.length === 0 && <p className="mt-3 text-xs opacity-70">Pick Easy, Medium or Hard, then tap the blanks to recall the verse and earn XP.</p>}
        </section>
    );
}