import type { LessonContent, QuizQuestion } from "../appTypes";

export const lesson: LessonContent = {
    lessonDate: "January 4, 2026",
    lessonTitle: "The Strength of Covenant – Part 4",

    memoryVerse:
        "According to the word that I covenanted with you when ye came out of Egypt, so my spirit remaineth among you: fear ye not.",
    memoryVerseRef: "Haggai 2:5",

    introScriptures: ["Joshua 9:14-19", "2 Samuel 21:1-9"],
    lessonIntroScriptures: [],

    introduction:
        "From what we have learnt so far, it is quite obvious that covenants are a serious commitment that should be entered into very carefully. It was the covenant Israel entered with unbelieving Gibeon carelessly that both ensnared them and became a deterrent to receiving their inheritance.",

    aims: "To reveal the implications of covenants since man is surrounded or is obliged to surround himself by it.",
    objectives: "To cause man to be mindful of holy covenants and discard evil covenants through Christ.",

    lessonIntro:
        "In our last lesson, we realized that there is need for proper investigation before commitment. God’s condition of covenant and time that hides the truth from the present were also in focus. Today we will look into more revelation that this lesson provides.",

    lessonPoints: [
        {
            title: "The Record – Verse 18",
            content:
                "Every covenant goes into record as soon as it is agreed and pronounced. The Israelites initiated the covenant in verse 18. There is a book that records covenants whether visible or invisible, see Exo. 24:7 Any party may forget due to length of time, but covenant records never expire.",
            refs: ["Joshua 9:18", "Exodus 24:7"],
            subPoints: [],
        },
        {
            title: "Covenants Are Remembered",
            content:
                "Any party to a covenant may forget or disrespect it, but the witness will not forget. Many assume commitments fade with time, but the divine witness does not live in time, therefore the covenant remains fresh in His mind. See Leviticus 26:45",
            refs: ["Leviticus 26:45"],
            subPoints: [],
        },
        {
            title: "Close to the Heart of the Witness",
            content:
                "A covenant touches the reputation, credibility, name, and personality of the witness. If it is not handled properly and fairly, people will lose confidence and desert him. Psalm 111:5",
            refs: ["Psalm 111:5"],
            subPoints: [],
        },
        {
            title: "The Restrictions",
            content:
                "God gave the land of the Canaanites to Israel and commanded them to dispossess and destroy them. However, Israel could not do this with the Gibeonites because a covenant restricted them - see verse 18, 19. Many covenants today also serve as hindrances to mankind.",
            refs: ["Joshua 9:18-19"],
            subPoints: [],
        },
    ],

    conclusion: "Do you have a covenant? Do you know if you are denied blessings because of a covenant? If so, come to Jesus, for He is willing to set you free.",
    conclusionScriptures: ["Matthew 11:28"],

    application:
        "Walk deliberately in the terms of your godly covenants in Christ Jesus, and stand vigilant to discern and dismantle ungodly covenants through prayer and faith.",

    prayerPoints: [
        "Father, open my eyes to understand every covenant affecting my life.",
        "Lord Jesus, set me free from every evil covenant working against my destiny.",
        "Holy Spirit, help me honor holy covenants and walk in obedience.",
        "Father, let every covenant hindering my inheritance be broken through Christ.",
        "Lord, teach me wisdom and caution before entering into any covenant.",
    ],
};

// NOTE: the correct answer is always written first here. The app shuffles the
// options every time the quiz starts, so learners can't just tap the first one.
export const quizQuestions: QuizQuestion[] = [
    {
        q: "What does the permanence of covenant records teach us about oaths made before God?",
        a: [
            "Covenant records never expire even if human parties forget them over time",
            "Oaths automatically expire after a generation passes",
            "Written human agreements matter more than spiritual records",
            "God forgets past covenants when circumstances change",
        ],
        correct: 0,
        why: "Every covenant goes into record immediately and does not expire with time, as seen in Israel's binding oath with Gibeon.",
    },
    {
        q: "Why did Israel fail to dispossess the Gibeonites despite possessing the surrounding land?",
        a: [
            "An unalterable oath and covenant restricted them from doing so",
            "The Gibeonites possessed a stronger army than Israel",
            "God commanded Israel to form an alliance with all local tribes",
            "Joshua decided to break his promise for political gain",
        ],
        correct: 0,
        why: "A sworn covenant served as a restriction that hindered Israel from driving them out, illustrating how careless vows can limit our spiritual inheritance.",
    },
    {
        q: "In 2 Samuel 21:1-9, why did a three-year famine come upon Israel during David's reign?",
        a: [
            "Because Saul violated Israel's ancient covenant with the Gibeonites",
            "Because the nation stopped offering annual sacrifices",
            "Because David failed to conquer the surrounding nations",
            "Because the people worshipped idols in secret",
        ],
        correct: 0,
        why: "The divine witness remembers covenants, and breaking them brings consequences, as demonstrated by the famine resulting from Saul's actions.",
    },
    {
        q: "What does Haggai 2:5 emphasize regarding God's commitment to His people?",
        a: [
            "According to His word of covenant, His Spirit remains among them so they should not fear",
            "God's promises are temporary and change with every generation",
            "The covenant from Egypt was replaced by human laws",
            "Fear is required to maintain God's presence",
        ],
        correct: 0,
        why: "God honors the word of His covenant, and His enduring presence provides assurance to His people.",
    },
    {
        q: "How does a covenant relate to the reputation and character of its divine witness?",
        a: [
            "It touches the credibility, name, and faithfulness of the witness",
            "It has no bearing on God's reputation among nations",
            "It only affects the mortal participants involved",
            "It proves that human beings can manipulate divine laws",
        ],
        correct: 0,
        why: "A covenant is closely tied to the integrity and character of the witness, which is why God upholds and honors His sworn word.",
    },
];

export const quickQuestions = [
    "What do covenant records mean?",
    "Why couldn't Israel destroy Gibeon?",
    "How does God remember covenants?",
    "How can Jesus set us free from evil covenants?",
];

interface Topic {
    keys: string[];
    answer: string;
}

const TOPICS: Topic[] = [
    {
        keys: ["record", "book", "expire", "exodus 24:7", "joshua 9:18"],
        answer:
            "Every covenant goes into record immediately when agreed and pronounced. Covenant records never expire, even if human participants forget them over time.",
    },
    {
        keys: ["remember", "witness", "leviticus", "time", "fresh"],
        answer:
            "Any human party may forget or disrespect a covenant, but the divine witness does not live in time. Therefore, the covenant remains fresh in His mind (Leviticus 26:45).",
    },
    {
        keys: ["heart", "reputation", "credibility", "name", "psalm 111:5"],
        answer:
            "A covenant touches the reputation, credibility, name, and personality of the witness. Upholding it maintains absolute trust and faithfulness.",
    },
    {
        keys: ["restriction", "hindrance", "land", "canaanites", "gibeonites", "inheritance"],
        answer:
            "Though God gave Canaan to Israel, their hasty covenant with Gibeon restricted them from dispossessing those cities, serving as a hindrance to their full inheritance.",
    },
    {
        keys: ["haggai", "spirit", "egypt", "fear", "memory verse"],
        answer:
            "Our memory verse, Haggai 2:5, reminds us: 'According to the word that I covenanted with you when ye came out of Egypt, so my spirit remaineth among you: fear ye not.'",
    },
    {
        keys: ["jesus", "free", "matthew 11:28", "bound", "broken"],
        answer:
            "If you are burdened or hindered by past ungodly covenants, Jesus invites you in Matthew 11:28 to come to Him so He can set you free and restore your inheritance.",
    },
    {
        keys: ["pray", "prayer"],
        answer: "Check the Prayer tab for five dedicated prayer points to help break negative covenants and align your life with God's word.",
    },
    {
        keys: ["hello", "hi ", "blessing", "good morning", "good evening"],
        answer: "Blessings! Ask me about covenant records, divine remembrance, covenant restrictions, or how Christ sets us free.",
    },
];

const FALLBACK =
    "In biblical terms, a covenant is an unbreakable sacred bond witnessed by God. Try asking about covenant records, divine remembrance, covenant restrictions, or freedom through Christ.";

/** Rule-based answer: the topic with the most keyword hits wins. */
export function tutorReply(question: string): string {
    const q = ` ${question.toLowerCase()} `;
    let best: Topic | null = null;
    let bestScore = 0;
    for (const t of TOPICS) {
        const score = t.keys.reduce((n, k) => (q.includes(k) ? n + 1 : n), 0);
        if (score > bestScore) {
            best = t;
            bestScore = score;
        }
    }
    return best ? best.answer : FALLBACK;
}