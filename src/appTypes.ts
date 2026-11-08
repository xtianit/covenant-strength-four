export type BibleVersion = "KJV" | "NKJV" | "NIV" | "ESV" | "AMP" | "NLT";
export type BibleVersions = Record<BibleVersion, string>;
export type ScriptureDB = Record<string, BibleVersions>;

export interface LeaderboardEntry {
    user_name: string;
    score: number;
}

export interface QuizQuestion {
    q: string;
    a: string[];
    /** Index of the correct answer inside `a` (options are shuffled at play time). */
    correct: number;
    /** Short explanation shown after the learner answers. */
    why: string;
}

export interface LessonPoint {
    title: string;
    content: string;
    refs: string[];
    subPoints: string[];
}

export interface LessonContent {
    lessonDate: string;
    lessonTitle: string;
    memoryVerse: string;
    memoryVerseRef: string;
    introScriptures: string[];
    lessonIntroScriptures: string[];
    introduction: string;
    aims: string;
    objectives: string;
    lessonIntro: string;
    lessonPoints: LessonPoint[];
    conclusion: string;
    conclusionScriptures: string[];
    application: string;
    prayerPoints: string[];
}