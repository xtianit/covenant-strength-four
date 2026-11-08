import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode, TouchEvent as ReactTouchEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import {
    ArrowLeft,
    ArrowRight,
    Award,
    BookOpen,
    Check,
    CheckSquare,
    ChevronDown,
    Columns,
    Compass,
    Copy,
    Cpu,
    Crown,
    Download,
    Flame,
    Heart,
    Lightbulb,
    Loader2,
    MessageCircle,
    RotateCcw,
    Send,
    Share2,
    Shield,
    Sparkles,
    Trophy,
    Volume2,
    VolumeX,
    X,
    Zap,
} from "lucide-react";
import logo from "./assets/logo.png";
import Header from "./components/Header";
import MemoryVerse from "./components/MemoryVerse";
import { scriptureDB } from "./data/scripture";
import { lesson, quickQuestions, quizQuestions, tutorReply } from "./data/lesson";
import { BADGES, bumpStreak, emptyStats, levelInfo, load, save } from "./lib/gamify";
import type { Stats } from "./lib/gamify";
import { CARD_THEMES, burstConfetti, prefersReducedMotion, renderVerseCard, shareOrDownload } from "./lib/effects";
import type { BibleVersion, LeaderboardEntry } from "./appTypes";
import "./styles/wow.css";

// Types used to live in this file; re-exported so existing imports keep working.
export type { BibleVersion, BibleVersions, ScriptureDB, LeaderboardEntry, QuizQuestion } from "./appTypes";

// Supabase client lives at module level to keep Vite HMR Fast Refresh happy.
const SUPABASE_URL = "https://oypggoucddfkoabkgfql.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mY3mE66Qnkuuq2xSeVm_OQ_QTvzLN1W";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PAYSTACK_PUBLIC_KEY = "pk_test_bed97038ebcf74b30219ed0500cfffc6e80948f1";
const PAYMENT_AMOUNT = 500000; // kobo = ₦5,000
const QUESTION_SECONDS = 15;
const VERSIONS: BibleVersion[] = ["KJV", "NKJV", "NIV", "ESV", "AMP", "NLT"];
const LESSON_KEY = lesson.lessonDate;
const LESSON_SLUG = LESSON_KEY.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
const PRAYER_TOTAL = lesson.prayerPoints.length;
const CARD_REFS = Object.keys(scriptureDB).filter((k) => !k.includes("-"));

const KEYS = {
    xp: "sunday_school_xp",
    name: "sunday_school_name",
    checkin: "sunday_school_checkin_lesson",
    badges: "sunday_school_badges",
    paid: "sunday_school_paid",
    dark: "sunday_school_dark",
    font: "sunday_school_font",
    stats: `sunday_school_stats_${LESSON_SLUG}`,
    notes: `sunday_school_notes_${LESSON_SLUG}`,
};

const TABS = [
    { id: "intro", label: "Intro", icon: Compass },
    { id: "lesson", label: "Lesson", icon: BookOpen },
    { id: "conclusion", label: "Conclusion", icon: Shield },
    { id: "application", label: "Application", icon: Lightbulb },
    { id: "quiz", label: "Quiz", icon: Award },
    { id: "chat", label: "Prayer", icon: Flame },
] as const;
type TabId = (typeof TABS)[number]["id"];

interface PaystackPopApi {
    setup: (opts: Record<string, unknown>) => { openIframe: () => void };
}

interface Toast {
    id: number;
    text: string;
    tone: "success" | "info" | "badge";
}

/* ------------------------------ small helpers ----------------------------- */

const stripVerseNumbers = (text: string) => text.replace(/(^|\s)\d+(?=\s)/g, " ").replace(/\s+/g, " ").trim();

function shuffledOrder(n: number): number[] {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function useCountUp(target: number, ms = 700): number {
    const [val, setVal] = useState(target);
    const from = useRef(target);
    useEffect(() => {
        if (from.current === target) return;
        if (prefersReducedMotion()) {
            from.current = target;
            setVal(target);
            return;
        }
        const start = performance.now();
        const origin = from.current;
        let raf = 0;
        const tick = (now: number) => {
            const p = Math.min(1, (now - start) / ms);
            const eased = 1 - Math.pow(1 - p, 3);
            const v = Math.round(origin + (target - origin) * eased);
            from.current = v;
            setVal(v);
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, ms]);
    return val;
}

/* -------------------------- small presentational parts -------------------- */

function Ring({ pct, size = 44, stroke = 5, className = "text-blue-500", children }: { pct: number; size?: number; stroke?: number; className?: string; children?: ReactNode }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={stroke} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={c * (1 - Math.min(100, Math.max(0, pct)) / 100)}
                    className={`ssa-ring-track ${className}`}
                />
            </svg>
            {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
        </div>
    );
}

function Modal({ titleId, onClose, panelClass, children }: { titleId: string; onClose: () => void; panelClass: string; children: ReactNode }) {
    const panel = useRef<HTMLDivElement>(null);
    const closeRef = useRef(onClose);
    useEffect(() => {
        closeRef.current = onClose;
    });
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        const node = panel.current;
        node?.focus();
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeRef.current();
            if (e.key === "Tab" && node) {
                const f = node.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (f.length === 0) return;
                const first = f[0];
                const last = f[f.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
            previous?.focus?.();
        };
    }, []);
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
            <div
                ref={panel}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
                className={`ssa-sheet max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border shadow-2xl outline-none sm:rounded-3xl ${panelClass}`}
            >
                {children}
            </div>
        </div>
    );
}

function VerseChip({ reference, read, onOpen }: { reference: string; read: boolean; onOpen: (r: string) => void }) {
    return (
        <button
            type="button"
            onClick={() => onOpen(reference)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                read ? "bg-emerald-600 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-500"
            }`}
        >
            {read ? <Check size={14} aria-hidden="true" /> : <BookOpen size={14} aria-hidden="true" />} {reference}
            {read && <span className="sr-only">(read)</span>}
        </button>
    );
}

function Scripture({ text, darkMode }: { text: string; darkMode: boolean }) {
    return (
        <p className="leading-loose">
            {text.split(/(\d+)/).map((part, i) =>
                /^\d+$/.test(part) ? (
                    <sup key={i} className={`mx-0.5 font-bold ${darkMode ? "text-amber-400" : "text-amber-600"}`}>
                        {part}
                    </sup>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </p>
    );
}

function Leaderboard({ entries, status, me, darkMode }: { entries: LeaderboardEntry[]; status: "loading" | "ready" | "error"; me: string; darkMode: boolean }) {
    const medals = ["🥇", "🥈", "🥉"];
    return (
        <div className={`space-y-1.5 rounded-2xl border p-3 ${darkMode ? "border-slate-800 bg-slate-950/50" : "border-slate-200 bg-slate-50"}`}>
            {status === "loading" && <p className="py-3 text-center text-xs italic opacity-60">Loading scores…</p>}
            {status === "error" && <p className="py-3 text-center text-xs italic opacity-60">Can't reach the leaderboard right now. Check your connection.</p>}
            {status === "ready" && entries.length === 0 && <p className="py-3 text-center text-xs italic opacity-60">No scores yet. Be the first!</p>}
            {status === "ready" &&
                entries.map((e, i) => {
                    const mine = e.user_name === me;
                    return (
                        <div key={`${e.user_name}-${i}`} className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${mine ? "bg-blue-600/20 ring-1 ring-blue-500/50" : ""}`}>
                            <span className="flex items-center gap-2 font-semibold">
                                <span className="w-5 text-center">{medals[i] ?? <span className="opacity-50">{i + 1}</span>}</span>
                                {e.user_name}
                                {mine && <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">You</span>}
                            </span>
                            <span className="font-mono font-bold text-blue-400">{e.score} pts</span>
                        </div>
                    );
                })}
        </div>
    );
}

/* --------------------------------- the app -------------------------------- */

const SundaySchoolApp = () => {
    const [showPaymentGate, setShowPaymentGate] = useState(() => !load<boolean>(KEYS.paid, false));
    const [payEmail, setPayEmail] = useState("");
    const [activeTab, setActiveTab] = useState<TabId>("intro");
    const [darkMode, setDarkMode] = useState<boolean>(() => load(KEYS.dark, true));
    const [fontSize, setFontSize] = useState<number>(() => load(KEYS.font, 16));
    const [appLoading, setAppLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);

    // Scripture reader
    const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
    const [bibleVersion, setBibleVersion] = useState<BibleVersion>("KJV");
    const [compareVersion, setCompareVersion] = useState<BibleVersion | null>(null);
    const [copied, setCopied] = useState(false);

    // Progress, XP, badges
    const [userXp, setUserXp] = useState<number>(() => {
        const v = load<number>(KEYS.xp, 0);
        return Number.isFinite(v) ? v : 0;
    });
    const [xpFlash, setXpFlash] = useState<{ id: number; amount: number } | null>(null);
    const [stats, setStats] = useState<Stats>(() => ({ ...emptyStats, ...load<Partial<Stats>>(KEYS.stats, {}) }));
    const statsRef = useRef<Stats>(stats);
    const [badges, setBadges] = useState<string[]>(() => load<string[]>(KEYS.badges, []));
    const [streak] = useState(() => bumpStreak());
    const [showAchievements, setShowAchievements] = useState(false);

    // Attendance
    const [checkedLesson, setCheckedLesson] = useState<string>(() => load<string>(KEYS.checkin, ""));
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [checkingIn, setCheckingIn] = useState(false);
    const [userName, setUserName] = useState<string>(() => {
        const saved = load<string>(KEYS.name, "");
        return saved || "Guest_" + Math.floor(Math.random() * 1000);
    });

    // Lesson interaction
    const [openPoints, setOpenPoints] = useState<number[]>([0]);
    const [notes, setNotes] = useState<string>(() => load<string>(KEYS.notes, ""));

    // Quiz
    const [quizPhase, setQuizPhase] = useState<"idle" | "playing" | "done">("idle");
    const [qIndex, setQIndex] = useState(0);
    const [quizOrder, setQuizOrder] = useState<number[][]>([]);
    const [picked, setPicked] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [answers, setAnswers] = useState<{ correct: boolean; pts: number }[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [lbStatus, setLbStatus] = useState<"loading" | "ready" | "error">("loading");

    // Audio
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState("");
    const [speechRate, setSpeechRate] = useState(1);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Tutor
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiQuery, setAiQuery] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiChatLog, setAiChatLog] = useState<{ sender: "ai" | "user"; text: string }[]>([
        { sender: "ai", text: "Blessings! I am your Covenant Tutor. Ask me about today's lesson, the Gibeonites, 2 Samuel 21, or the types of covenants." },
    ]);
    const chatEnd = useRef<HTMLDivElement>(null);

    // Verse card
    const [showCardModal, setShowCardModal] = useState(false);
    const [cardRef, setCardRef] = useState(lesson.memoryVerseRef);
    const [cardVersion, setCardVersion] = useState<BibleVersion>("KJV");
    const [cardThemeId, setCardThemeId] = useState(CARD_THEMES[0].id);
    const [cardUrl, setCardUrl] = useState("");
    const cardBlob = useRef<Blob | null>(null);
    const cardUrlRef = useRef("");

    // Toasts
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastId = useRef(0);
    const flashId = useRef(0);

    const progressBar = useRef<HTMLDivElement>(null);
    const tabsRef = useRef<HTMLDivElement>(null);
    const touchStart = useRef<{ x: number; y: number } | null>(null);
    const prevLevel = useRef(levelInfo(userXp).index);

    const isCheckedIn = checkedLesson === LESSON_KEY;
    const lvl = levelInfo(userXp);
    const shownXp = useCountUp(userXp);
    const visitedPct = Math.round((stats.visited.length / TABS.length) * 100);

    /* ---------------------------- core helpers ---------------------------- */

    const pushToast = useCallback((text: string, tone: Toast["tone"] = "success") => {
        const id = ++toastId.current;
        setToasts((t) => [...t.slice(-2), { id, text, tone }]);
        window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
    }, []);

    const addXp = useCallback((amount: number) => {
        setUserXp((p) => p + amount);
        setXpFlash({ id: ++flashId.current, amount });
    }, []);

    const mutate = useCallback((fn: (s: Stats) => Stats) => {
        const next = fn(statsRef.current);
        statsRef.current = next;
        setStats(next);
    }, []);

    const markString = useCallback(
        (key: "visited" | "verses" | "listenedTabs", value: string, xp: number) => {
            if (statsRef.current[key].includes(value)) return false;
            mutate((s) => ({ ...s, [key]: [...s[key], value] }));
            if (xp) addXp(xp);
            return true;
        },
        [mutate, addXp]
    );

    const markNumber = useCallback(
        (key: "points" | "prayers", value: number, xp: number) => {
            if (statsRef.current[key].includes(value)) return false;
            mutate((s) => ({ ...s, [key]: [...s[key], value] }));
            if (xp) addXp(xp);
            return true;
        },
        [mutate, addXp]
    );

    const fetchLeaderboard = useCallback(async () => {
        try {
            const { data, error } = await supabase.from("leaderboard").select("*").order("score", { ascending: false }).limit(10);
            if (error || !data) throw error ?? new Error("no data");
            setLeaderboard(data as LeaderboardEntry[]);
            setLbStatus("ready");
        } catch {
            setLbStatus("error");
        }
    }, []);

    /* ------------------------------- effects ------------------------------ */

    useEffect(() => {
        document.title = `${lesson.lessonTitle} · Life Gate Sunday School`;
    }, []);
    useEffect(() => save(KEYS.xp, userXp), [userXp]);
    useEffect(() => save(KEYS.stats, stats), [stats]);
    useEffect(() => save(KEYS.badges, badges), [badges]);
    useEffect(() => save(KEYS.dark, darkMode), [darkMode]);
    useEffect(() => save(KEYS.font, fontSize), [fontSize]);
    useEffect(() => save(KEYS.name, userName), [userName]);
    useEffect(() => save(KEYS.notes, notes), [notes]);

    useEffect(() => {
        if (!xpFlash) return;
        const t = window.setTimeout(() => setXpFlash(null), 1300);
        return () => window.clearTimeout(t);
    }, [xpFlash]);

    // Splash screen
    useEffect(() => {
        const id = window.setInterval(() => setLoadingProgress((p) => Math.min(100, p + 20)), 90);
        return () => window.clearInterval(id);
    }, []);
    useEffect(() => {
        if (loadingProgress < 100) return;
        const t = window.setTimeout(() => setAppLoading(false), 250);
        return () => window.clearTimeout(t);
    }, [loadingProgress]);

    // Scroll progress bar (updated through the DOM to avoid re-rendering on scroll)
    useEffect(() => {
        const onScroll = () => {
            const h = document.documentElement.scrollHeight - window.innerHeight;
            const pct = h > 0 ? Math.min(1, window.scrollY / h) : 0;
            if (progressBar.current) progressBar.current.style.transform = `scaleX(${pct})`;
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Speech voices
    useEffect(() => {
        if (!("speechSynthesis" in window)) return;
        const synth = window.speechSynthesis;
        const loadVoices = () => {
            const all = synth.getVoices();
            const english = all.filter((v) => v.lang.toLowerCase().startsWith("en"));
            const list = english.length > 0 ? english : all;
            setVoices(list);
            setSelectedVoice((prev) => prev || list.find((v) => v.localService)?.name || list[0]?.name || "");
        };
        loadVoices();
        synth.onvoiceschanged = loadVoices;
        return () => {
            synth.onvoiceschanged = null;
            synth.cancel();
        };
    }, []);

    useEffect(() => {
        void fetchLeaderboard();
    }, [fetchLeaderboard]);

    // First visit to each section earns XP
    useEffect(() => {
        if (appLoading || showPaymentGate) return;
        markString("visited", activeTab, 5);
    }, [activeTab, appLoading, showPaymentGate, markString]);

    // Level-ups
    useEffect(() => {
        if (lvl.index > prevLevel.current) {
            pushToast(`Level up! You are now a ${lvl.title}`, "badge");
            burstConfetti();
        }
        prevLevel.current = lvl.index;
    }, [lvl.index, lvl.title, pushToast]);

    // Badges
    useEffect(() => {
        if (appLoading || showPaymentGate) return;
        const ctx = { checkedIn: isCheckedIn, streak, prayerTotal: PRAYER_TOTAL, tabTotal: TABS.length };
        const fresh = BADGES.filter((b) => b.test(stats, ctx) && !badges.includes(b.id));
        if (fresh.length === 0) return;
        setBadges((prev) => [...prev, ...fresh.map((b) => b.id)]);
        pushToast(`Badge unlocked: ${fresh[0].emoji} ${fresh[0].title}`, "badge");
        burstConfetti(1800);
    }, [stats, isCheckedIn, streak, badges, appLoading, showPaymentGate, pushToast]);

    // Quiz timer: the interval only ticks; running out of time is handled below.
    useEffect(() => {
        if (quizPhase !== "playing" || picked !== null) return;
        const id = window.setInterval(() => setTimeLeft((v) => v - 1), 1000);
        return () => window.clearInterval(id);
    }, [quizPhase, picked, qIndex]);

    useEffect(() => {
        chatEnd.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "end" });
    }, [aiChatLog, aiLoading]);

    // Verse card preview
    useEffect(() => {
        if (!showCardModal) return;
        let cancelled = false;
        const raw = scriptureDB[cardRef]?.[cardVersion] ?? lesson.memoryVerse;
        const theme = CARD_THEMES.find((t) => t.id === cardThemeId) ?? CARD_THEMES[0];
        renderVerseCard({ reference: cardRef, version: cardVersion, text: stripVerseNumbers(raw), theme })
            .then((blob) => {
                if (cancelled) return;
                cardBlob.current = blob;
                const url = URL.createObjectURL(blob);
                if (cardUrlRef.current) URL.revokeObjectURL(cardUrlRef.current);
                cardUrlRef.current = url;
                setCardUrl(url);
            })
            .catch(() => pushToast("Could not build the card on this device", "info"));
        return () => {
            cancelled = true;
        };
    }, [showCardModal, cardRef, cardVersion, cardThemeId, pushToast]);

    useEffect(
        () => () => {
            if (cardUrlRef.current) URL.revokeObjectURL(cardUrlRef.current);
        },
        []
    );

    /* ------------------------------ navigation ---------------------------- */

    const stopSpeech = useCallback(() => {
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    const goToTab = useCallback(
        (tab: TabId) => {
            stopSpeech();
            setActiveTab(tab);
            requestAnimationFrame(() => {
                const el = tabsRef.current;
                if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
            });
        },
        [stopSpeech]
    );

    const tabIdx = TABS.findIndex((t) => t.id === activeTab);
    const stepTab = (delta: number) => {
        const next = TABS[tabIdx + delta];
        if (next && quizPhase !== "playing") goToTab(next.id);
    };

    const onTabKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
        let next = tabIdx;
        if (e.key === "ArrowRight") next = (tabIdx + 1) % TABS.length;
        else if (e.key === "ArrowLeft") next = (tabIdx - 1 + TABS.length) % TABS.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = TABS.length - 1;
        else return;
        e.preventDefault();
        goToTab(TABS[next].id);
        document.getElementById(`tab-${TABS[next].id}`)?.focus();
    };

    const onTouchStart = (e: ReactTouchEvent) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = (e: ReactTouchEvent) => {
        const s = touchStart.current;
        touchStart.current = null;
        if (!s) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) > 80 && Math.abs(dy) < 50) stepTab(dx < 0 ? 1 : -1);
    };

    /* ------------------------------- scripture ---------------------------- */

    const openVerse = useCallback(
        (ref: string) => {
            setSelectedVerse(ref);
            setCompareVersion(null);
            setCopied(false);
            markString("verses", ref, 3);
        },
        [markString]
    );

    const verseText = (ref: string, v: BibleVersion) => scriptureDB[ref]?.[v] ?? "Scripture text not found.";

    const copyVerse = async () => {
        if (!selectedVerse) return;
        const text = `${stripVerseNumbers(verseText(selectedVerse, bibleVersion))}\n— ${selectedVerse} (${bibleVersion})`;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            pushToast("Copy isn't available in this browser", "info");
        }
    };

    const openCard = (ref: string) => {
        setCardRef(CARD_REFS.includes(ref) ? ref : lesson.memoryVerseRef);
        setCardVersion(bibleVersion);
        setSelectedVerse(null);
        setShowCardModal(true);
    };

    const shareCard = async () => {
        if (!cardBlob.current) return;
        const text = `${stripVerseNumbers(verseText(cardRef, cardVersion))} — ${cardRef} (${cardVersion})`;
        const result = await shareOrDownload(cardBlob.current, `${cardRef.replace(/[^a-z0-9]+/gi, "-")}.png`, text);
        if (result === "cancelled") return;
        if (result === "downloaded") pushToast("Image saved. Post it to your WhatsApp status!");
        const first = statsRef.current.shares < 3;
        mutate((s) => ({ ...s, shares: s.shares + 1 }));
        if (first) addXp(15);
    };

    const shareWhatsApp = () => {
        const text = `“${stripVerseNumbers(verseText(cardRef, cardVersion))}” — ${cardRef} (${cardVersion})\n\nLife Gate Ministries Worldwide Sunday School\n${window.location.origin}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
        mutate((s) => ({ ...s, shares: s.shares + 1 }));
    };

    /* --------------------------------- audio ------------------------------ */

    const speechText = useMemo(() => {
        switch (activeTab) {
            case "intro":
                return `${lesson.introduction} Aims. ${lesson.aims} Objectives. ${lesson.objectives}`;
            case "lesson":
                return `${lesson.lessonIntro} ${lesson.lessonPoints.map((p, i) => `Point ${i + 1}. ${p.title}. ${p.content}`).join(" ")}`;
            case "conclusion":
                return lesson.conclusion;
            case "application":
                return lesson.application;
            case "chat":
                return lesson.prayerPoints.join(" ");
            default:
                return "";
        }
    }, [activeTab]);

    const speak = useCallback(
        (text: string) => {
            if (!("speechSynthesis" in window) || !text.trim()) return;
            const synth = window.speechSynthesis;
            synth.cancel();
            const chunks = (text.match(/[^.!?]+[.!?]*\s*/g) ?? [text]).map((c) => c.trim()).filter(Boolean);
            const voice = voices.find((v) => v.name === selectedVoice);
            chunks.forEach((chunk, i) => {
                const u = new SpeechSynthesisUtterance(chunk);
                if (voice) u.voice = voice;
                u.rate = speechRate;
                u.onerror = () => setIsSpeaking(false);
                if (i === chunks.length - 1) u.onend = () => setIsSpeaking(false);
                synth.speak(u);
            });
            setIsSpeaking(true);
        },
        [voices, selectedVoice, speechRate]
    );

    const toggleSection = () => {
        if (isSpeaking) return stopSpeech();
        speak(speechText);
        markString("listenedTabs", activeTab, 5);
    };

    /* ---------------------------------- quiz ------------------------------ */

    const startQuiz = () => {
        const name = userName.trim() || "Guest_" + Math.floor(Math.random() * 1000);
        setUserName(name);
        setQuizOrder(quizQuestions.map((q) => shuffledOrder(q.a.length)));
        setQIndex(0);
        setPicked(null);
        setTimeLeft(QUESTION_SECONDS);
        setScore(0);
        setCombo(0);
        setAnswers([]);
        setQuizPhase("playing");
    };

    const answerQuestion = (choice: number | null) => {
        if (quizPhase !== "playing" || picked !== null) return;
        const correct = choice !== null && quizOrder[qIndex][choice] === quizQuestions[qIndex].correct;
        const pts = correct ? 10 + Math.floor(Math.max(0, timeLeft) / 3) + Math.min(combo, 3) * 2 : 0;
        setPicked(choice ?? -1);
        setCombo(correct ? combo + 1 : 0);
        setScore((s) => s + pts);
        setAnswers((a) => [...a, { correct, pts }]);
        if (correct) addXp(15);
    };

    // Out of time counts as a wrong answer (guarded, so safe to run after every render).
    useEffect(() => {
        if (quizPhase === "playing" && picked === null && timeLeft <= 0) answerQuestion(null);
    });

    const finishQuiz = async () => {
        const correctCount = answers.filter((a) => a.correct).length;
        setQuizPhase("done");
        addXp(50);
        mutate((s) => ({
            ...s,
            quizPlays: s.quizPlays + 1,
            quizBest: Math.max(s.quizBest, score),
            quizPerfect: s.quizPerfect || correctCount === quizQuestions.length,
        }));
        if (correctCount >= 3) burstConfetti();
        try {
            const { error } = await supabase.from("leaderboard").insert([{ user_name: userName, score: Math.max(score, 10) }]);
            if (error) throw error;
            await fetchLeaderboard();
        } catch {
            pushToast("Score kept on this device. The leaderboard couldn't be reached.", "info");
        }
    };

    const nextQuestion = () => {
        if (qIndex < quizQuestions.length - 1) {
            setQIndex(qIndex + 1);
            setPicked(null);
            setTimeLeft(QUESTION_SECONDS);
        } else {
            void finishQuiz();
        }
    };

    const shareScore = async () => {
        const correctCount = answers.filter((a) => a.correct).length;
        const text = `I scored ${score} points (${correctCount}/${quizQuestions.length}) on today's Sunday School quiz: ${lesson.lessonTitle}. Can you beat me? ${window.location.origin}`;
        try {
            if (navigator.share) await navigator.share({ text });
            else {
                await navigator.clipboard.writeText(text);
                pushToast("Score copied. Paste it anywhere to challenge a friend.");
            }
        } catch {
            /* share dialog dismissed */
        }
    };

    /* --------------------------- attendance & tutor ----------------------- */

    const handleCheckIn = async (e: FormEvent) => {
        e.preventDefault();
        const name = userName.trim();
        if (!name) return;
        setUserName(name);
        setCheckingIn(true);
        let synced = true;
        try {
            const { error } = await supabase.from("attendance").insert([{ user_name: name, class_name: lesson.lessonTitle }]);
            if (error) synced = false;
        } catch {
            synced = false;
        }
        setCheckingIn(false);
        setCheckedLesson(LESSON_KEY);
        save(KEYS.checkin, LESSON_KEY);
        addXp(30);
        burstConfetti();
        setShowAttendanceModal(false);
        pushToast(synced ? "Attendance logged. +30 XP" : "Couldn't reach the server, so attendance is recorded on this device only. +30 XP", synced ? "success" : "info");
    };

    const askTutor = (raw: string) => {
        const text = raw.trim();
        if (!text || aiLoading) return;
        const earnsXp = statsRef.current.tutorQs < 5;
        mutate((s) => ({ ...s, tutorQs: s.tutorQs + 1 }));
        setAiChatLog((p) => [...p, { sender: "user", text }]);
        setAiQuery("");
        setAiLoading(true);
        window.setTimeout(() => {
            setAiChatLog((p) => [...p, { sender: "ai", text: tutorReply(text) }]);
            setAiLoading(false);
            if (earnsXp) addXp(10);
        }, 700);
    };

    /* ------------------------------ payment ------------------------------- */

    const initializePaystack = () => {
        const pop = (window as unknown as { PaystackPop?: PaystackPopApi }).PaystackPop;
        if (!pop) {
            pushToast("Payment service didn't load. Check your connection and refresh.", "info");
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(payEmail)) {
            pushToast("Enter a valid email so Paystack can send your receipt.", "info");
            return;
        }
        pop
            .setup({
                key: PAYSTACK_PUBLIC_KEY,
                email: payEmail,
                amount: PAYMENT_AMOUNT,
                currency: "NGN",
                reference: "SSA_" + Math.floor(Math.random() * 1000000000 + 1),
                onClose: () => {},
                callback: () => {
                    save(KEYS.paid, true);
                    setShowPaymentGate(false);
                    addXp(200);
                },
            })
            .openIframe();
    };

    /* --------------------------------- styling ---------------------------- */

    const themeClasses = darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900";
    const panelTheme = darkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900";
    const subtle = darkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200";
    const statCard = `ssa-lift relative flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        darkMode ? "border-slate-800 bg-slate-900/60 text-slate-100" : "border-slate-200 bg-white text-slate-900"
    }`;
    const primaryBtn = "rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-white shadow-lg shadow-blue-600/30 transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";
    const aurora = (
        <div className={`ssa-aurora ${darkMode ? "" : "is-light"}`} aria-hidden="true">
            <span />
            <span />
            <span />
        </div>
    );

    const toastLayer = (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`ssa-toast pointer-events-auto max-w-md rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-2xl ${
                        t.tone === "badge" ? "bg-gradient-to-r from-amber-500 to-rose-500" : t.tone === "info" ? "bg-slate-700" : "bg-emerald-600"
                    }`}
                >
                    {t.text}
                </div>
            ))}
        </div>
    );

    /* -------------------------------- screens ----------------------------- */

    if (appLoading) {
        return (
            <div className="ssa-root fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950 p-4" role="status" aria-label="Loading Sunday School App">
                <div className="ssa-aurora" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </div>
                <div className="relative z-10 w-full max-w-sm px-4 text-center">
                    <div className="mx-auto mb-6 flex h-24 w-24 animate-bounce items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-1 shadow-2xl">
                        <img src={logo} alt="Life Gate Ministries Logo" className="h-14 w-14 rounded-2xl object-contain" />
                    </div>
                    <span className="block text-xs font-bold uppercase tracking-widest text-blue-400">Life Gate Ministries Worldwide</span>
                    <h1 className="mb-6 mt-1 text-xl font-black text-white">Sunday School Experience</h1>
                    <div className="mx-auto h-2.5 w-full max-w-[240px] overflow-hidden rounded-full border border-slate-700 bg-slate-800/80">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
                    </div>
                </div>
            </div>
        );
    }

    if (showPaymentGate) {
        const perks = ["Leaderboard ranking", "AI theology tutor", "Live discussions", "+200 bonus XP"];
        return (
            <div className={`ssa-root relative min-h-screen ${themeClasses} flex items-center justify-center p-3 transition-colors duration-300 sm:p-6`} style={{ fontSize: `${fontSize}px` }}>
                {aurora}
                <div className="ssa-tab-enter relative z-10 w-full max-w-4xl py-8">
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-1 shadow-2xl">
                            <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Life Gate Ministries Worldwide</span>
                        <h1 className="ssa-shimmer-text mt-1 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-3xl font-black text-transparent sm:text-5xl">Sunday School Portal</h1>
                        <p className="mx-auto mt-3 max-w-md text-sm opacity-70">{lesson.lessonTitle} · {lesson.lessonDate}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className={`ssa-lift flex flex-col justify-between rounded-3xl border p-6 shadow-xl backdrop-blur ${darkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white/90"}`}>
                            <div>
                                <h2 className="mb-2 text-xl font-bold">Standard Access</h2>
                                <div className="mb-4 text-3xl font-black">₦0</div>
                                <p className="mb-6 text-xs opacity-70">Full lesson text, audio reader, memory challenge, quiz and study tools.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPaymentGate(false)}
                                className="w-full rounded-2xl bg-slate-800 py-3.5 text-xs font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            >
                                Enter Free Session
                            </button>
                        </div>
                        <div className={`ssa-lift ssa-glow relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 shadow-xl backdrop-blur ${darkMode ? "border-blue-500/40 bg-slate-900/80" : "border-blue-200 bg-white"}`}>
                            <div className="absolute right-0 top-0 rounded-bl-xl bg-blue-600 px-3 py-1 text-[10px] font-bold uppercase text-white">Recommended</div>
                            <div>
                                <h2 className="mb-2 text-xl font-bold">Premium All-Access</h2>
                                <div className="mb-4 text-3xl font-black">₦5,000</div>
                                <ul className="mb-5 space-y-1.5 text-xs">
                                    {perks.map((p) => (
                                        <li key={p} className="flex items-center gap-2">
                                            <Check size={14} className="text-emerald-400" aria-hidden="true" /> {p}
                                        </li>
                                    ))}
                                </ul>
                                <label htmlFor="pay-email" className="mb-1 block text-xs font-bold opacity-70">Email for your receipt</label>
                                <input
                                    id="pay-email"
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    value={payEmail}
                                    onChange={(e) => setPayEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className={`mb-4 w-full rounded-xl border px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${darkMode ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-900"}`}
                                />
                            </div>
                            <button type="button" onClick={initializePaystack} className={`${primaryBtn} flex w-full items-center justify-center gap-2 py-3.5 text-xs`}>
                                <Sparkles size={16} aria-hidden="true" /> Unlock Premium (₦5,000)
                            </button>
                            <p className="mt-3 text-center text-[10px] opacity-60">Secure payment by Paystack</p>
                        </div>
                    </div>
                </div>
                {toastLayer}
            </div>
        );
    }

    const correctCount = answers.filter((a) => a.correct).length;
    const currentQ = quizQuestions[qIndex];
    const grade =
        correctCount === quizQuestions.length ? "Perfect! A true Covenant Keeper 🏆" : correctCount >= 4 ? "Excellent work! 🌟" : correctCount >= 3 ? "Good job! Keep growing 🌱" : "Review the lesson and try again 📖";
    const showNavFooter = quizPhase !== "playing";

    return (
        <div className={`ssa-root relative min-h-screen overflow-x-hidden ${themeClasses} transition-colors duration-300`} style={{ fontSize: `${fontSize}px` }}>
            {aurora}
            <div className="fixed inset-x-0 top-0 z-[70] h-1 bg-transparent" aria-hidden="true">
                <div ref={progressBar} className="h-full origin-left scale-x-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            </div>

            <div className="relative z-10">
                <Header logo={logo} contentData={lesson} fontSize={fontSize} adjustFontSize={(d: number) => setFontSize((p) => Math.min(Math.max(p + d, 12), 28))} darkMode={darkMode} toggleTheme={() => setDarkMode((p) => !p)} />

                <main className="container mx-auto max-w-5xl px-3 py-6 sm:px-4">
                    {/* Stat bar */}
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <button type="button" onClick={() => setShowAchievements(true)} className={statCard} aria-label={`Level ${lvl.index + 1}, ${lvl.title}, ${userXp} XP. Open achievements.`}>
                            <Ring pct={lvl.pct} className="text-amber-500">
                                <Zap size={16} className="text-amber-500" aria-hidden="true" />
                            </Ring>
                            <div className="min-w-0">
                                <span className="block text-[10px] font-bold uppercase opacity-60">Lv {lvl.index + 1} · {lvl.title}</span>
                                <span className="text-sm font-black text-amber-500">{shownXp} XP</span>
                            </div>
                            {xpFlash && (
                                <span key={xpFlash.id} className="ssa-xp-flash pointer-events-none absolute right-3 top-1 text-xs font-black text-emerald-400">
                                    +{xpFlash.amount}
                                </span>
                            )}
                        </button>

                        <div className={`${statCard} cursor-default hover:border-slate-800`}>
                            <div className="shrink-0 rounded-xl bg-orange-500/20 p-2 text-orange-500">
                                <Flame size={18} aria-hidden="true" />
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold uppercase opacity-60">Study streak</span>
                                <span className="text-sm font-black text-orange-500">{streak} {streak === 1 ? "day" : "days"}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowAttendanceModal(true)}
                            className={`${statCard} ${isCheckedIn ? "!border-emerald-500/40 !bg-emerald-950/30 text-emerald-300" : ""}`}
                            aria-label={isCheckedIn ? "Attendance checked in" : "Mark attendance"}
                        >
                            <div className={`shrink-0 rounded-xl p-2 ${isCheckedIn ? "bg-emerald-500 text-white" : "bg-blue-500/20 text-blue-400"}`}>
                                <CheckSquare size={18} aria-hidden="true" />
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold uppercase opacity-60">Attendance</span>
                                <span className="text-xs font-black">{isCheckedIn ? "Checked in ✓" : "Tap to check in"}</span>
                            </div>
                        </button>

                        <div className={`${statCard} cursor-default hover:border-slate-800`}>
                            <Ring pct={visitedPct} className="text-emerald-500">
                                <span className="text-[10px] font-black">{stats.visited.length}/{TABS.length}</span>
                            </Ring>
                            <div>
                                <span className="block text-[10px] font-bold uppercase opacity-60">Lesson progress</span>
                                <span className="text-xs font-black text-emerald-500">{visitedPct}% explored</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 px-2 text-center">
                        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-400">{lesson.lessonDate}</p>
                        <h1 className={`text-2xl font-black tracking-tight sm:text-4xl ${darkMode ? "ssa-shimmer-text bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent" : "text-slate-900"}`}>{lesson.lessonTitle}</h1>
                    </div>

                    {/* Tabs */}
                    <div ref={tabsRef} role="tablist" aria-label="Sunday School Lesson Sections" onKeyDown={onTabKey} className="ssa-noscroll mb-6 flex justify-start gap-2 overflow-x-auto px-1 pb-2 md:justify-center">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const seen = stats.visited.includes(tab.id);
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    id={`tab-${tab.id}`}
                                    aria-selected={isActive}
                                    aria-controls={`panel-${tab.id}`}
                                    tabIndex={isActive ? 0 : -1}
                                    onClick={() => goToTab(tab.id)}
                                    className={`relative flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-sm ${
                                        isActive
                                            ? "scale-105 border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                                            : darkMode
                                            ? "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200"
                                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                                >
                                    <Icon size={16} aria-hidden="true" />
                                    <span>{tab.label}</span>
                                    {seen && !isActive && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-500" aria-label="visited" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className={`rounded-3xl border p-4 shadow-2xl backdrop-blur-xl sm:p-8 ${darkMode ? "border-slate-800/80 bg-slate-900/75 text-slate-100" : "border-slate-200 bg-white/90 text-slate-900"}`}>
                        {activeTab !== "quiz" && (
                            <div className="mb-6 flex flex-col items-start gap-3 border-b border-slate-700/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                    <label htmlFor="voice-select" className="text-xs font-bold uppercase text-blue-500">Audio reader</label>
                                    <select
                                        id="voice-select"
                                        value={selectedVoice}
                                        onChange={(e) => {
                                            stopSpeech();
                                            setSelectedVoice(e.target.value);
                                        }}
                                        className={`max-w-[11rem] rounded-xl border px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${darkMode ? "border-slate-700 bg-slate-800 text-slate-200" : "border-slate-300 bg-slate-100 text-slate-800"}`}
                                    >
                                        {voices.length === 0 && <option value="">Default voice</option>}
                                        {voices.map((v) => (
                                            <option key={v.name} value={v.name}>{v.name}</option>
                                        ))}
                                    </select>
                                    <label htmlFor="rate-select" className="sr-only">Reading speed</label>
                                    <select
                                        id="rate-select"
                                        value={speechRate}
                                        onChange={(e) => {
                                            stopSpeech();
                                            setSpeechRate(Number(e.target.value));
                                        }}
                                        className={`rounded-xl border px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${darkMode ? "border-slate-700 bg-slate-800 text-slate-200" : "border-slate-300 bg-slate-100 text-slate-800"}`}
                                    >
                                        {[0.8, 1, 1.2, 1.5].map((r) => (
                                            <option key={r} value={r}>{r}×</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleSection}
                                    aria-label={isSpeaking ? "Stop audio reading" : "Listen to this section"}
                                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isSpeaking ? "animate-pulse bg-rose-600" : "bg-blue-600 hover:bg-blue-500"}`}
                                >
                                    {isSpeaking ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
                                    <span>{isSpeaking ? "Stop reading" : "Listen to section"}</span>
                                </button>
                            </div>
                        )}

                        <div key={activeTab} className="ssa-tab-enter">
                            {/* INTRO */}
                            {activeTab === "intro" && (
                                <div role="tabpanel" id="panel-intro" aria-labelledby="tab-intro" className="space-y-6">
                                    <MemoryVerse
                                        text={lesson.memoryVerse}
                                        reference={lesson.memoryVerseRef}
                                        darkMode={darkMode}
                                        onOpenReader={() => openVerse(lesson.memoryVerseRef)}
                                        onMastered={(level) => {
                                            if (statsRef.current.memorized) return;
                                            mutate((s) => ({ ...s, memorized: true }));
                                            addXp(level === "hard" ? 40 : 25);
                                            burstConfetti(2000);
                                            pushToast("Memory verse mastered!", "badge");
                                        }}
                                    />

                                    <div>
                                        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-blue-400">Text: Joshua 9:14-19, 2 Samuel 21:1-9</h2>
                                        <div className="flex flex-wrap gap-2">
                                            {["Joshua 9:14-19", "2 Samuel 21:1-9"].map((r) => (
                                                <VerseChip key={r} reference={r} read={stats.verses.includes(r)} onOpen={openVerse} />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="mb-3 text-base font-bold">Introduction</h2>
                                        <p className="mb-4 leading-relaxed">{lesson.introduction}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {lesson.introScriptures.map((r) => (
                                                <VerseChip key={r} reference={r} read={stats.verses.includes(r)} onOpen={openVerse} />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {[
                                            { label: "Aims", text: lesson.aims },
                                            { label: "Objectives", text: lesson.objectives },
                                        ].map((c) => (
                                            <div key={c.label} className={`ssa-lift rounded-2xl border p-5 ${darkMode ? "border-emerald-500/20 bg-emerald-950/20" : "border-emerald-200 bg-emerald-50"}`}>
                                                <h3 className="mb-2 text-[0.9em] font-bold uppercase tracking-wider text-emerald-400">{c.label}</h3>
                                                <p className="leading-relaxed opacity-90">{c.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* LESSON */}
                            {activeTab === "lesson" && (
                                <div role="tabpanel" id="panel-lesson" aria-labelledby="tab-lesson" className="space-y-5">
                                    <div className="flex flex-wrap items-end justify-between gap-3">
                                        <div>
                                            <h2 className="text-lg font-bold">Lesson Content</h2>
                                            <p className="mt-1 text-xs opacity-60">{stats.points.length}/{lesson.lessonPoints.length} points understood</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setOpenPoints(openPoints.length === lesson.lessonPoints.length ? [] : lesson.lessonPoints.map((_, i) => i))}
                                            className="text-xs font-semibold text-blue-400 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                        >
                                            {openPoints.length === lesson.lessonPoints.length ? "Collapse all" : "Expand all"}
                                        </button>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/30" aria-hidden="true">
                                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500" style={{ width: `${(stats.points.length / lesson.lessonPoints.length) * 100}%` }} />
                                    </div>
                                    <p className="leading-relaxed opacity-90">{lesson.lessonIntro}</p>

                                    <div className="space-y-4">
                                        {lesson.lessonPoints.map((p, idx) => {
                                            const open = openPoints.includes(idx);
                                            const done = stats.points.includes(idx);
                                            return (
                                                <div key={idx} className={`overflow-hidden rounded-2xl border transition ${done ? "border-emerald-500/40" : darkMode ? "border-slate-800" : "border-slate-200"} ${subtle}`}>
                                                    <button
                                                        type="button"
                                                        aria-expanded={open}
                                                        aria-controls={`point-${idx}`}
                                                        onClick={() => setOpenPoints(open ? openPoints.filter((i) => i !== idx) : [...openPoints, idx])}
                                                        className="flex w-full items-center gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:p-5"
                                                    >
                                                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white ${done ? "bg-emerald-500" : "bg-gradient-to-br from-blue-500 to-indigo-600"}`}>
                                                            {done ? <Check size={16} aria-hidden="true" /> : idx + 1}
                                                        </span>
                                                        <span className="flex-1 text-base font-bold text-blue-400">{p.title}</span>
                                                        <ChevronDown size={18} aria-hidden="true" className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                                                    </button>
                                                    {open && (
                                                        <div id={`point-${idx}`} className="ssa-tab-enter px-4 pb-5 sm:px-5">
                                                            <p className="mb-4 leading-relaxed">{p.content}</p>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                {p.refs.map((r) => (
                                                                    <VerseChip key={r} reference={r} read={stats.verses.includes(r)} onOpen={openVerse} />
                                                                ))}
                                                                <button
                                                                    type="button"
                                                                    disabled={done}
                                                                    onClick={() => markNumber("points", idx, 10)}
                                                                    className={`ml-auto flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${done ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-600 text-white hover:bg-emerald-500"}`}
                                                                >
                                                                    <Check size={14} aria-hidden="true" /> {done ? "Understood" : "I understand (+10 XP)"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* CONCLUSION */}
                            {activeTab === "conclusion" && (
                                <div role="tabpanel" id="panel-conclusion" aria-labelledby="tab-conclusion" className="space-y-6">
                                    <h2 className="text-lg font-bold">Conclusion</h2>
                                    <div className={`ssa-glow rounded-3xl border p-6 sm:p-8 ${darkMode ? "border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 to-purple-950/40" : "border-indigo-200 bg-indigo-50"}`}>
                                        <p className="font-serif text-xl italic leading-relaxed sm:text-2xl">“{lesson.conclusion}”</p>
                                    </div>
                                    <div>
                                        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-blue-400">Three things to take home</h3>
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            {[
                                                ["Seek counsel", "Ask God and investigate before you commit."],
                                                ["Guard your yoke", "Do not covenant with unbelievers."],
                                                ["Respect time", "Patience exposes deception."],
                                            ].map(([t, d], i) => (
                                                <div key={t} className={`ssa-lift rounded-2xl border p-4 ${subtle}`}>
                                                    <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-xs font-black text-blue-400">{i + 1}</span>
                                                    <p className="font-bold">{t}</p>
                                                    <p className="mt-1 text-sm opacity-75">{d}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* APPLICATION */}
                            {activeTab === "application" && (
                                <div role="tabpanel" id="panel-application" aria-labelledby="tab-application" className="space-y-6">
                                    <h2 className="text-lg font-bold">Lesson Application</h2>
                                    <div className={`rounded-2xl border p-6 ${subtle}`}>
                                        <p className="leading-relaxed">{lesson.application}</p>
                                    </div>
                                    <div>
                                        <label htmlFor="reflection" className="mb-2 flex items-center gap-2 text-sm font-bold">
                                            <Lightbulb size={16} className="text-amber-400" aria-hidden="true" /> My reflection
                                        </label>
                                        <ul className="mb-3 list-disc space-y-1 pl-5 text-sm opacity-75">
                                            <li>Is there an agreement I am about to enter without praying about it?</li>
                                            <li>Where do I need patience before I decide?</li>
                                            <li>Which covenant do I need to renew in Christ?</li>
                                        </ul>
                                        <textarea
                                            id="reflection"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            onBlur={() => {
                                                if (notes.trim().length >= 20 && !statsRef.current.noted) {
                                                    mutate((s) => ({ ...s, noted: true }));
                                                    addXp(20);
                                                    pushToast("Reflection saved. +20 XP");
                                                }
                                            }}
                                            rows={5}
                                            placeholder="Write what God is saying to you. It saves automatically on this device."
                                            className={`w-full resize-y rounded-2xl border p-4 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${darkMode ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-900"}`}
                                        />
                                        <p className="mt-1 text-right text-[11px] opacity-50">{notes.length} characters · saved on this device</p>
                                    </div>
                                </div>
                            )}

                            {/* QUIZ */}
                            {activeTab === "quiz" && (
                                <div role="tabpanel" id="panel-quiz" aria-labelledby="tab-quiz" className="py-2">
                                    {quizPhase === "idle" && (
                                        <div className="mx-auto max-w-md space-y-5 text-center">
                                            <Award size={44} className="mx-auto animate-bounce text-amber-500" aria-hidden="true" />
                                            <h2 className="text-2xl font-bold">Speed Quiz Challenge</h2>
                                            <p className="text-sm opacity-70">{quizQuestions.length} questions · {QUESTION_SECONDS}s each · faster answers and combos score more. Finish for +50 XP.</p>
                                            <div className="text-left">
                                                <label htmlFor="quiz-name" className="mb-1 block text-xs font-bold opacity-70">Name on the leaderboard</label>
                                                <input
                                                    id="quiz-name"
                                                    value={userName}
                                                    onChange={(e) => setUserName(e.target.value)}
                                                    maxLength={24}
                                                    className={`w-full rounded-xl border px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${darkMode ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-900"}`}
                                                />
                                            </div>
                                            <button type="button" onClick={startQuiz} className={`${primaryBtn} w-full py-3.5 text-sm`}>Start challenge</button>
                                            {stats.quizPlays > 0 && <p className="text-xs opacity-60">Your best this lesson: {stats.quizBest} pts · played {stats.quizPlays}×</p>}
                                            <div className="border-t border-slate-700/40 pt-5 text-left">
                                                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Trophy size={16} className="text-amber-500" aria-hidden="true" /> Leaderboard</h3>
                                                <Leaderboard entries={leaderboard} status={lbStatus} me={userName} darkMode={darkMode} />
                                            </div>
                                        </div>
                                    )}

                                    {quizPhase === "playing" && currentQ && (
                                        <div className="mx-auto max-w-xl space-y-5">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex gap-1.5" aria-label={`Question ${qIndex + 1} of ${quizQuestions.length}`}>
                                                    {quizQuestions.map((_, i) => (
                                                        <span key={i} className={`h-2 w-7 rounded-full transition-colors ${i < answers.length ? (answers[i].correct ? "bg-emerald-500" : "bg-rose-500") : i === qIndex ? "bg-blue-500" : "bg-slate-600/40"}`} />
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs font-bold">
                                                    {combo >= 2 && <span className="ssa-pop flex items-center gap-1 text-orange-400"><Flame size={14} aria-hidden="true" /> x{combo}</span>}
                                                    <span className="font-mono text-blue-400">{score} pts</span>
                                                    <Ring pct={(Math.max(0, timeLeft) / QUESTION_SECONDS) * 100} size={40} stroke={4} className={timeLeft <= 5 ? "text-rose-500" : "text-amber-500"}>
                                                        <span className="text-[11px] font-black" aria-live="off">{Math.max(0, timeLeft)}</span>
                                                    </Ring>
                                                </div>
                                            </div>

                                            <h2 className="text-base font-bold leading-snug sm:text-lg">{currentQ.q}</h2>

                                            <div className="grid gap-3" role="group" aria-label="Answer choices">
                                                {quizOrder[qIndex]?.map((origIdx, idx) => {
                                                    const isRight = origIdx === currentQ.correct;
                                                    const isPicked = picked === idx;
                                                    const revealed = picked !== null;
                                                    let cls = darkMode ? "border-slate-700 bg-slate-800/60 hover:border-blue-500 hover:bg-blue-600/20" : "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50";
                                                    if (revealed && isRight) cls = "border-emerald-500 bg-emerald-500/15";
                                                    else if (revealed && isPicked) cls = "ssa-shake border-rose-500 bg-rose-500/15";
                                                    else if (revealed) cls += " opacity-50";
                                                    return (
                                                        <button
                                                            key={origIdx}
                                                            type="button"
                                                            disabled={revealed}
                                                            onClick={() => answerQuestion(idx)}
                                                            className={`flex items-start gap-3 rounded-2xl border p-4 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${cls}`}
                                                        >
                                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-500/20 text-xs font-black">{revealed && isRight ? <Check size={14} aria-hidden="true" /> : revealed && isPicked ? <X size={14} aria-hidden="true" /> : "ABCD"[idx]}</span>
                                                            <span>{currentQ.a[origIdx]}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {picked !== null && (
                                                <div className="ssa-tab-enter space-y-3" role="status">
                                                    <div className={`rounded-2xl border p-4 text-sm ${answers[qIndex]?.correct ? "border-emerald-500/40 bg-emerald-500/10" : "border-rose-500/40 bg-rose-500/10"}`}>
                                                        <p className="mb-1 font-bold">{answers[qIndex]?.correct ? `Correct! +${answers[qIndex].pts} pts` : picked === -1 ? "Time's up!" : "Not quite."}</p>
                                                        <p className="opacity-85">{currentQ.why}</p>
                                                    </div>
                                                    <button type="button" onClick={nextQuestion} className={`${primaryBtn} flex w-full items-center justify-center gap-2 py-3 text-sm`}>
                                                        {qIndex < quizQuestions.length - 1 ? "Next question" : "See results"} <ArrowRight size={16} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {quizPhase === "done" && (
                                        <div className="mx-auto max-w-md space-y-5 text-center">
                                            <Award size={52} className="ssa-pop mx-auto text-amber-500" aria-hidden="true" />
                                            <h2 className="text-2xl font-bold">Challenge completed!</h2>
                                            <p className="text-sm font-semibold opacity-80">{grade}</p>
                                            <div className={`rounded-2xl border p-6 ${subtle}`}>
                                                <div className="text-5xl font-black text-blue-500">{score}</div>
                                                <p className="mt-1 text-xs uppercase tracking-wider opacity-60">{correctCount}/{quizQuestions.length} correct · +50 XP</p>
                                                <div className="mt-3 flex justify-center gap-1.5">
                                                    {answers.map((a, i) => (
                                                        <span key={i} className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${a.correct ? "bg-emerald-500" : "bg-rose-500"}`}>
                                                            {a.correct ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                <button type="button" onClick={startQuiz} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><RotateCcw size={14} aria-hidden="true" /> Try again</button>
                                                <button type="button" onClick={() => void shareScore()} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"><Share2 size={14} aria-hidden="true" /> Challenge a friend</button>
                                                {correctCount < 4 && <button type="button" onClick={() => goToTab("lesson")} className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${darkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-200 text-slate-800 hover:bg-slate-300"}`}><BookOpen size={14} aria-hidden="true" /> Review lesson</button>}
                                            </div>
                                            <div className="border-t border-slate-700/40 pt-5 text-left">
                                                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Trophy size={16} className="text-amber-500" aria-hidden="true" /> Leaderboard</h3>
                                                <Leaderboard entries={leaderboard} status={lbStatus} me={userName} darkMode={darkMode} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PRAYER */}
                            {activeTab === "chat" && (
                                <div role="tabpanel" id="panel-chat" aria-labelledby="tab-chat" className="space-y-5">
                                    <div className="flex flex-wrap items-end justify-between gap-2">
                                        <h2 className="text-lg font-bold">Prayer Points & Intercession</h2>
                                        <span className="text-xs font-mono opacity-60">{stats.prayers.length}/{PRAYER_TOTAL} prayed</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/30" aria-hidden="true">
                                        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500" style={{ width: `${(stats.prayers.length / PRAYER_TOTAL) * 100}%` }} />
                                    </div>
                                    <div className="space-y-3">
                                        {lesson.prayerPoints.map((prayer, idx) => {
                                            const prayed = stats.prayers.includes(idx);
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    aria-pressed={prayed}
                                                    onClick={() => {
                                                        if (markNumber("prayers", idx, 5) && statsRef.current.prayers.length === PRAYER_TOTAL) {
                                                            burstConfetti();
                                                            pushToast("Amen! You prayed through every point 🙏", "badge");
                                                        }
                                                    }}
                                                    className={`ssa-lift flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${prayed ? "border-purple-500/50 bg-purple-500/10" : subtle}`}
                                                >
                                                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${prayed ? "border-purple-500 bg-purple-500 text-white" : "border-purple-500/20 bg-purple-500/10 text-purple-400"}`}>
                                                        {prayed ? <Heart size={13} aria-hidden="true" /> : idx + 1}
                                                    </span>
                                                    <span className="leading-relaxed">{prayer}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs opacity-60">Tap each prayer as you pray it (+5 XP each). Use “Listen to section” to be led through them.</p>
                                    {stats.prayers.length > 0 && (
                                        <button type="button" onClick={() => mutate((s) => ({ ...s, prayers: [] }))} className="text-xs font-semibold text-purple-400 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400">
                                            Reset checklist
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {showNavFooter && (
                            <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-700/40 pt-5">
                                {TABS[tabIdx - 1] ? (
                                    <button type="button" onClick={() => stepTab(-1)} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${darkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-200 text-slate-800 hover:bg-slate-300"}`}>
                                        <ArrowLeft size={14} aria-hidden="true" /> {TABS[tabIdx - 1].label}
                                    </button>
                                ) : <span />}
                                {TABS[tabIdx + 1] && (
                                    <button type="button" onClick={() => stepTab(1)} className={`${primaryBtn} flex items-center gap-2 px-5 py-2.5 text-xs`}>
                                        {TABS[tabIdx + 1].label} <ArrowRight size={14} aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <p className="mt-6 text-center text-[11px] opacity-50">Life Gate Ministries Worldwide · Sunday School · swipe or use ← → to move between sections</p>
                </main>
            </div>

            {/* Floating actions */}
            <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-3">
                <button type="button" onClick={() => openCard(lesson.memoryVerseRef)} aria-label="Create a shareable verse card" className="ssa-fab flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-rose-500 text-white shadow-xl shadow-rose-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
                    <Share2 size={20} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setShowAiModal(true)} aria-label="Ask the covenant tutor" className="ssa-fab flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-600/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                    <MessageCircle size={24} aria-hidden="true" />
                </button>
            </div>

            {toastLayer}

            {/* Verse reader */}
            {selectedVerse && (
                <Modal titleId="verse-modal-title" onClose={() => setSelectedVerse(null)} panelClass={`${compareVersion ? "max-w-4xl" : "max-w-2xl"} ${panelTheme}`}>
                    <div className="flex items-center justify-between border-b border-slate-700/40 p-4">
                        <h3 id="verse-modal-title" className="font-bold">{selectedVerse}</h3>
                        <button type="button" onClick={() => setSelectedVerse(null)} aria-label="Close verse reader" className="rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><X size={18} /></button>
                    </div>
                    <div className="ssa-noscroll flex gap-1.5 overflow-x-auto border-b border-slate-700/40 p-3" role="tablist" aria-label="Bible versions">
                        {VERSIONS.map((v) => (
                            <button key={v} type="button" role="tab" aria-selected={bibleVersion === v} onClick={() => setBibleVersion(v)} className={`rounded-xl px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${bibleVersion === v ? "bg-blue-600 text-white" : darkMode ? "bg-slate-800 text-slate-400 hover:text-slate-200" : "bg-slate-100 text-slate-600 hover:text-slate-900"}`}>
                                {v}
                            </button>
                        ))}
                    </div>
                    <div className={`grid gap-4 p-5 sm:p-6 ${compareVersion ? "sm:grid-cols-2" : ""}`}>
                        <div>
                            {compareVersion && <p className="mb-2 text-xs font-bold text-blue-400">{bibleVersion}</p>}
                            <Scripture text={verseText(selectedVerse, bibleVersion)} darkMode={darkMode} />
                        </div>
                        {compareVersion && (
                            <div className="border-t border-slate-700/40 pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                                <label htmlFor="compare-version" className="sr-only">Compare with</label>
                                <select id="compare-version" value={compareVersion} onChange={(e) => setCompareVersion(e.target.value as BibleVersion)} className={`mb-2 rounded-lg border px-2 py-1 text-xs font-bold text-blue-400 ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"}`}>
                                    {VERSIONS.filter((v) => v !== bibleVersion).map((v) => <option key={v} value={v}>{v}</option>)}
                                </select>
                                <Scripture text={verseText(selectedVerse, compareVersion)} darkMode={darkMode} />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 border-t border-slate-700/40 p-4">
                        <button type="button" onClick={() => setCompareVersion(compareVersion ? null : VERSIONS.find((v) => v !== bibleVersion) ?? "NIV")} aria-pressed={!!compareVersion} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${compareVersion ? "bg-blue-600 text-white" : darkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-200 text-slate-800 hover:bg-slate-300"}`}>
                            <Columns size={14} aria-hidden="true" /> Compare
                        </button>
                        <button type="button" onClick={() => void copyVerse()} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${darkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-200 text-slate-800 hover:bg-slate-300"}`}>
                            {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} {copied ? "Copied" : "Copy"}
                        </button>
                        <button type="button" onClick={() => speak(stripVerseNumbers(verseText(selectedVerse, bibleVersion)))} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${darkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-200 text-slate-800 hover:bg-slate-300"}`}>
                            <Volume2 size={14} aria-hidden="true" /> Listen
                        </button>
                        <button type="button" onClick={() => openCard(selectedVerse)} className="ml-auto flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 px-3 py-2 text-xs font-bold text-white transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
                            <Sparkles size={14} aria-hidden="true" /> Make verse card
                        </button>
                    </div>
                </Modal>
            )}

            {/* Verse card */}
            {showCardModal && (
                <Modal titleId="card-modal-title" onClose={() => setShowCardModal(false)} panelClass={`max-w-md ${panelTheme}`}>
                    <div className="flex items-center justify-between p-4">
                        <h3 id="card-modal-title" className="flex items-center gap-2 font-bold"><Sparkles size={18} className="text-amber-400" aria-hidden="true" /> Shareable verse card</h3>
                        <button type="button" onClick={() => setShowCardModal(false)} aria-label="Close" className="rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><X size={18} /></button>
                    </div>
                    <div className="mx-auto flex aspect-[9/16] max-h-[46vh] items-center justify-center overflow-hidden rounded-2xl bg-slate-800/40">
                        {cardUrl ? <img src={cardUrl} alt={`Verse card for ${cardRef}`} className="h-full w-auto object-contain" /> : <Loader2 className="animate-spin text-blue-500" aria-label="Building card" />}
                    </div>
                    <div className="space-y-3 p-4">
                        <div className="flex gap-2">
                            <label htmlFor="card-ref" className="sr-only">Verse</label>
                            <select id="card-ref" value={cardRef} onChange={(e) => setCardRef(e.target.value)} className={`min-w-0 flex-1 rounded-xl border px-2.5 py-2 text-xs ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"}`}>
                                {CARD_REFS.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <label htmlFor="card-version" className="sr-only">Version</label>
                            <select id="card-version" value={cardVersion} onChange={(e) => setCardVersion(e.target.value as BibleVersion)} className={`rounded-xl border px-2.5 py-2 text-xs ${darkMode ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"}`}>
                                {VERSIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center justify-center gap-2" role="group" aria-label="Card theme">
                            {CARD_THEMES.map((t) => (
                                <button key={t.id} type="button" aria-label={`${t.name} theme`} aria-pressed={cardThemeId === t.id} onClick={() => setCardThemeId(t.id)} className={`h-8 w-8 rounded-full border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${cardThemeId === t.id ? "scale-110 border-white" : "border-transparent"}`} style={{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[2]})` }} />
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => void shareCard()} disabled={!cardUrl} className={`${primaryBtn} flex items-center justify-center gap-2 py-3 text-xs disabled:opacity-50`}>
                                <Download size={14} aria-hidden="true" /> Share / save image
                            </button>
                            <button type="button" onClick={shareWhatsApp} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
                                <Send size={14} aria-hidden="true" /> WhatsApp text
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Tutor */}
            {showAiModal && (
                <Modal titleId="ai-modal-title" onClose={() => setShowAiModal(false)} panelClass={`max-w-lg ${panelTheme}`}>
                    <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                        <h3 id="ai-modal-title" className="flex items-center gap-2 text-sm font-bold"><Cpu size={18} aria-hidden="true" /> Covenant Tutor</h3>
                        <button type="button" onClick={() => setShowAiModal(false)} aria-label="Close tutor" className="rounded-lg p-1 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><X size={18} /></button>
                    </div>
                    <div className="max-h-[45vh] space-y-3 overflow-y-auto p-4 sm:p-5" aria-live="polite">
                        {aiChatLog.map((m, i) => (
                            <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${m.sender === "user" ? "rounded-br-none bg-blue-600 text-white" : darkMode ? "rounded-bl-none bg-slate-800 text-slate-200" : "rounded-bl-none bg-slate-100 text-slate-800"}`}>{m.text}</div>
                            </div>
                        ))}
                        {aiLoading && (
                            <div className={`inline-flex items-center gap-1 rounded-2xl rounded-bl-none px-4 py-3 ${darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`} role="status" aria-label="Tutor is typing">
                                <span className="ssa-dot" /><span className="ssa-dot" /><span className="ssa-dot" />
                            </div>
                        )}
                        <div ref={chatEnd} />
                    </div>
                    <div className="ssa-noscroll flex gap-2 overflow-x-auto px-4 pb-2">
                        {quickQuestions.map((q) => (
                            <button key={q} type="button" onClick={() => askTutor(q)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${darkMode ? "border-slate-700 text-slate-300 hover:border-blue-500" : "border-slate-300 text-slate-700 hover:border-blue-500"}`}>{q}</button>
                        ))}
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); askTutor(aiQuery); }} className="flex gap-2 border-t border-slate-700/40 p-3">
                        <input value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} placeholder="Ask about covenants or 2 Samuel 21…" aria-label="Type your question" className={`flex-1 rounded-xl border px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${darkMode ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-slate-50 text-slate-900"}`} />
                        <button type="submit" aria-label="Send message" className="rounded-xl bg-blue-600 px-4 py-2.5 text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><Send size={16} /></button>
                    </form>
                </Modal>
            )}

            {/* Attendance */}
            {showAttendanceModal && (
                <Modal titleId="attendance-modal-title" onClose={() => setShowAttendanceModal(false)} panelClass={`max-w-md p-6 ${panelTheme}`}>
                    {isCheckedIn ? (
                        <div className="space-y-3 text-center">
                            <div className="ssa-pop mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white"><Check size={28} aria-hidden="true" /></div>
                            <h3 id="attendance-modal-title" className="text-base font-bold">You're checked in</h3>
                            <p className="text-sm opacity-70">Attendance is logged for “{lesson.lessonTitle}”.</p>
                            <button type="button" onClick={() => setShowAttendanceModal(false)} className={`${primaryBtn} w-full py-3 text-sm`}>Close</button>
                        </div>
                    ) : (
                        <>
                            <h3 id="attendance-modal-title" className="mb-4 text-base font-bold">Mark attendance (+30 XP)</h3>
                            <form onSubmit={(e) => void handleCheckIn(e)} className="space-y-4">
                                <div>
                                    <label htmlFor="attendance-username" className="mb-1 block text-xs font-bold opacity-70">Your name</label>
                                    <input id="attendance-username" value={userName} onChange={(e) => setUserName(e.target.value)} required maxLength={24} className={`w-full rounded-xl border px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${darkMode ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-900"}`} />
                                </div>
                                <button type="submit" disabled={checkingIn} className={`${primaryBtn} flex w-full items-center justify-center gap-2 py-3.5 text-sm disabled:opacity-60`}>
                                    {checkingIn && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} Check in now
                                </button>
                            </form>
                        </>
                    )}
                </Modal>
            )}

            {/* Achievements */}
            {showAchievements && (
                <Modal titleId="achievements-modal-title" onClose={() => setShowAchievements(false)} panelClass={`max-w-lg p-6 ${panelTheme}`}>
                    <div className="mb-5 flex items-center gap-4">
                        <Ring pct={lvl.pct} size={72} stroke={7} className="text-amber-500">
                            <Crown size={26} className="text-amber-500" aria-hidden="true" />
                        </Ring>
                        <div>
                            <h3 id="achievements-modal-title" className="flex items-center gap-2 text-lg font-black"><Trophy className="text-amber-500" size={18} aria-hidden="true" /> {lvl.title}</h3>
                            <p className="text-xs opacity-70">Level {lvl.index + 1} · {userXp} XP{lvl.isMax ? " · max level" : ` · ${lvl.toNext} XP to next level`}</p>
                        </div>
                    </div>
                    <div className="mb-5 grid grid-cols-3 gap-2 text-center text-xs">
                        {[
                            ["Streak", `${streak}d`],
                            ["Quiz best", `${stats.quizBest}`],
                            ["Badges", `${badges.length}/${BADGES.length}`],
                        ].map(([k, v]) => (
                            <div key={k} className={`rounded-xl border p-3 ${subtle}`}>
                                <div className="text-lg font-black text-blue-400">{v}</div>
                                <div className="opacity-60">{k}</div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                        {BADGES.map((b) => {
                            const got = badges.includes(b.id);
                            return (
                                <div key={b.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${got ? "border-amber-500/40 bg-amber-500/10" : subtle + " opacity-50"}`}>
                                    <span className={`text-2xl ${got ? "" : "grayscale"}`} aria-hidden="true">{b.emoji}</span>
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-bold">{b.title}</p>
                                        <p className="text-[11px] opacity-70">{b.desc}</p>
                                        <span className="sr-only">{got ? "Unlocked" : "Locked"}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button type="button" onClick={() => setShowAchievements(false)} className={`${primaryBtn} mt-5 w-full py-2.5 text-xs`}>Close</button>
                </Modal>
            )}
        </div>
    );
};

export default SundaySchoolApp;
