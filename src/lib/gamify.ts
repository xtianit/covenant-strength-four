export function load<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
        return fallback;
    }
}

export function save(key: string, value: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* storage full or blocked (private mode): the app still works, just without saving */
    }
}

export const LEVELS = [
    { min: 0, title: "Seeker" },
    { min: 100, title: "Learner" },
    { min: 300, title: "Disciple" },
    { min: 600, title: "Scholar" },
    { min: 1000, title: "Watchman" },
    { min: 1600, title: "Covenant Keeper" },
] as const;

export interface LevelInfo {
    index: number;
    title: string;
    pct: number;
    toNext: number;
    isMax: boolean;
}

export function levelInfo(xp: number): LevelInfo {
    let index = 0;
    for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) index = i;
    const floor = LEVELS[index].min;
    const next = LEVELS[index + 1];
    if (!next) return { index, title: LEVELS[index].title, pct: 100, toNext: 0, isMax: true };
    return {
        index,
        title: LEVELS[index].title,
        pct: Math.round(((xp - floor) / (next.min - floor)) * 100),
        toNext: next.min - xp,
        isMax: false,
    };
}

export interface Stats {
    visited: string[];
    verses: string[];
    listenedTabs: string[];
    points: number[];
    prayers: number[];
    quizBest: number;
    quizPlays: number;
    quizPerfect: boolean;
    tutorQs: number;
    shares: number;
    memorized: boolean;
    noted: boolean;
}

export const emptyStats: Stats = {
    visited: [],
    verses: [],
    listenedTabs: [],
    points: [],
    prayers: [],
    quizBest: 0,
    quizPlays: 0,
    quizPerfect: false,
    tutorQs: 0,
    shares: 0,
    memorized: false,
    noted: false,
};

export interface BadgeContext {
    checkedIn: boolean;
    streak: number;
    prayerTotal: number;
    tabTotal: number;
}

export interface BadgeDef {
    id: string;
    emoji: string;
    title: string;
    desc: string;
    test: (s: Stats, c: BadgeContext) => boolean;
}

export const BADGES: BadgeDef[] = [
    { id: "attendee", emoji: "🙌", title: "Present & Counted", desc: "Check in to this lesson", test: (_s, c) => c.checkedIn },
    { id: "explorer", emoji: "🧭", title: "Lesson Explorer", desc: "Visit every section", test: (s, c) => s.visited.length >= c.tabTotal },
    { id: "scholar", emoji: "📖", title: "Scripture Scholar", desc: "Read 5 different passages", test: (s) => s.verses.length >= 5 },
    { id: "listener", emoji: "🎧", title: "Good Listener", desc: "Use the audio reader", test: (s) => s.listenedTabs.length >= 1 },
    { id: "keeper", emoji: "🧠", title: "Verse Keeper", desc: "Finish a memory challenge", test: (s) => s.memorized },
    { id: "reflective", emoji: "✍️", title: "Reflective Heart", desc: "Write a reflection note", test: (s) => s.noted },
    { id: "quizmaster", emoji: "🏆", title: "Quiz Master", desc: "Answer every question correctly", test: (s) => s.quizPerfect },
    { id: "warrior", emoji: "🔥", title: "Prayer Warrior", desc: "Pray through every prayer point", test: (s, c) => s.prayers.length >= c.prayerTotal },
    { id: "streak", emoji: "⚡", title: "On Fire", desc: "Study 3 days in a row", test: (_s, c) => c.streak >= 3 },
    { id: "bearer", emoji: "📣", title: "Light Bearer", desc: "Share a verse card", test: (s) => s.shares >= 1 },
    { id: "curious", emoji: "💡", title: "Curious Mind", desc: "Ask the tutor 3 questions", test: (s) => s.tutorQs >= 3 },
];

export function dayKey(d: Date): string {
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
}

/** Counts consecutive days the app was opened. Safe to call more than once a day. */
export function bumpStreak(): number {
    const now = new Date();
    const today = dayKey(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const saved = load<{ last: string; count: number }>("sunday_school_streak", { last: "", count: 0 });
    if (saved.last === today) return Math.max(1, saved.count);
    const count = saved.last === dayKey(yesterday) ? saved.count + 1 : 1;
    save("sunday_school_streak", { last: today, count });
    return count;
}