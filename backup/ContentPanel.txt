import React from 'react';
import type { ContentData, LeaderboardEntry, QuizQuestion } from '../types';
import { Loader2, BookOpen, Volume2, VolumeX, Award, Trophy, Star } from 'lucide-react';
interface ContentPanelProps {
  activeTab: string;
  tabTransitioning: boolean;
  contentData: ContentData;
  darkMode: boolean;
  selectedVoice: string;
  voices: SpeechSynthesisVoice[];
  onVoiceChange: (name: string) => void;
  isSpeaking: boolean;
  onToggleSpeech: (text: string) => void;
  onShowBibleVersion: (ref: string) => void;
  quizActive: boolean;
  showResults: boolean;
  startQuiz: () => void;
  leaderboard: LeaderboardEntry[];
  currentQuestion: number;
  quizQuestions: QuizQuestion[];
  timeLeft: number;
  checkAnswer: (idx: number) => void;
  score: number;
}

export const ContentPanel: React.FC<ContentPanelProps> = ({
  activeTab,
  tabTransitioning,
  contentData,
  darkMode,
  selectedVoice,
  voices,
  onVoiceChange,
  isSpeaking,
  onToggleSpeech,
  onShowBibleVersion,
  quizActive,
  showResults,
  startQuiz,
  leaderboard,
  currentQuestion,
  quizQuestions,
  timeLeft,
  checkAnswer,
  score
}) => {
  return (
    <div className={`rounded-3xl border shadow-2xl p-6 sm:p-10 backdrop-blur-2xl transition-all duration-300 transform ${
      tabTransitioning ? "opacity-0 scale-[0.98] translate-y-2" : "opacity-100 scale-100 translate-y-0"
    } ${darkMode ? "bg-slate-900/70 border-slate-800/80 text-slate-100 shadow-black/40" : "bg-white/90 border-slate-200/80 text-slate-900 shadow-slate-200/50"}`}>
      
      {tabTransitioning ? (
        <div className="flex flex-col items-center justify-center py-28 space-y-4" role="status">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 animate-pulse">Loading Section...</span>
        </div>
      ) : (
        <>
          {/* Audio Reader Control Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-700/30">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label htmlFor="voice-select" className="text-xs uppercase font-extrabold tracking-wider text-blue-400">Audio Voice:</label>
              <select
                id="voice-select"
                value={selectedVoice}
                onChange={(e) => onVoiceChange(e.target.value)}
                className={`text-xs px-3 py-2 rounded-xl border font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex-1 sm:flex-initial ${
                  darkMode ? "bg-slate-800/80 border-slate-700 text-slate-200" : "bg-slate-100 border-slate-300 text-slate-800"
                }`}
              >
                {voices.map((v, i) => <option key={i} value={v.name}>{v.name} ({v.lang})</option>)}
              </select>
            </div>
            <button
              onClick={() => onToggleSpeech(activeTab === "intro" ? contentData.introduction : contentData.lessonIntro)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all duration-300 shadow-md ${
                isSpeaking 
                  ? "bg-rose-600 text-white animate-pulse shadow-rose-600/30" 
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 hover:scale-105"
              }`}
              aria-label={isSpeaking ? "Stop audio reading" : "Listen to section"}
            >
              {isSpeaking ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
              <span>{isSpeaking ? "Stop Audio" : "Listen to Section"}</span>
            </button>
          </div>

          {/* TAB 1: INTRODUCTION */}
          {activeTab === "intro" && (
            <div role="tabpanel" id="panel-intro" aria-labelledby="tab-intro" className="space-y-8 animate-fadeIn">
              <div className={`p-6 sm:p-8 rounded-2xl border relative overflow-hidden ${
                darkMode ? "bg-gradient-to-br from-blue-950/30 to-slate-900/50 border-blue-500/20" : "bg-gradient-to-br from-blue-50 to-indigo-50/30 border-blue-200"
              }`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-blue-500 flex items-center gap-2 mb-3">
                  <BookOpen size={16} aria-hidden="true" /> Memory Verse Focus
                </h2>
                <blockquote className="text-lg sm:text-xl italic font-serif font-medium mb-4 leading-relaxed">
                  "{contentData.memoryVerse}"
                </blockquote>
                <button
                  onClick={() => onShowBibleVersion("Exodus 2:24")}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all hover:scale-105"
                >
                  <BookOpen size={14} aria-hidden="true" /> Read Exodus 2:24 in Full Versions
                </button>
              </div>

              <div>
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-3">Study Scripture References</h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => onShowBibleVersion("Joshua 9:14-19")}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <BookOpen size={14} aria-hidden="true" /> Joshua 9:14-19
                  </button>
                  <button
                    onClick={() => onShowBibleVersion("2 Samuel 21:1-9")}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <BookOpen size={14} aria-hidden="true" /> 2 Samuel 21:1-9
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold mb-3 tracking-tight">Introduction Overview</h2>
                <p className="text-base leading-relaxed opacity-90">{contentData.introduction}</p>
              </div>

              <div className={`p-6 rounded-2xl border ${darkMode ? "bg-slate-950/40 border-slate-800/80" : "bg-slate-50 border-slate-200"}`}>
                <h3 className="text-xs font-extrabold text-emerald-400 mb-3 uppercase tracking-widest">Aims and Objectives</h3>
                <div className="space-y-3 text-sm">
                  <p className="leading-relaxed"><strong className="text-emerald-400 font-bold">AIMS:</strong> To reveal the implications of covenants since man is surrounded or is obliged to surround himself by it.</p>
                  <p className="leading-relaxed"><strong className="text-emerald-400 font-bold">OBJECTIVES:</strong> To cause man to be mindful of holy covenants through Christ.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LESSON */}
          {activeTab === "lesson" && (
            <div role="tabpanel" id="panel-lesson" aria-labelledby="tab-lesson" className="space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-xl font-black mb-3 tracking-tight">Core Lesson Breakdown</h2>
                <p className="text-base leading-relaxed opacity-90 mb-6">{contentData.lessonIntro}</p>
              </div>

              <div className="flex flex-wrap gap-2.5 mb-6">
                <button
                  onClick={() => onShowBibleVersion("2 Samuel 21:1-9")}
                  className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-500 transition-all flex items-center gap-1.5"
                >
                  <BookOpen size={13} aria-hidden="true" /> 2 Samuel 21:1-9
                </button>
                <button
                  onClick={() => onShowBibleVersion("Genesis 9:13-17")}
                  className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-500 transition-all flex items-center gap-1.5"
                >
                  <BookOpen size={13} aria-hidden="true" /> Genesis 9:13-17
                </button>
                <button
                  onClick={() => onShowBibleVersion("Genesis 28:22")}
                  className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-500 transition-all flex items-center gap-1.5"
                >
                  <BookOpen size={13} aria-hidden="true" /> Genesis 28:22
                </button>
              </div>

              <div className="space-y-6">
                {contentData.lessonPoints.map((section, idx) => (
                  <div key={idx} className={`p-6 rounded-2xl border transition-all duration-300 hover:border-blue-500/40 ${
                    darkMode ? "bg-slate-800/30 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <h3 className="text-base font-bold text-blue-400 mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-black">{idx + 1}</span>
                      {section.title}
                    </h3>
                    <p className="leading-relaxed opacity-90 mb-4">{section.content}</p>

                    {section.refs && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700/30">
                        {section.refs.map((rf) => (
                          <button
                            key={rf}
                            onClick={() => onShowBibleVersion(rf)}
                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-500/30"
                          >
                            <BookOpen size={13} aria-hidden="true" /> {rf}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CONCLUSION */}
          {activeTab === "conclusion" && (
            <div role="tabpanel" id="panel-conclusion" aria-labelledby="tab-conclusion" className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-black mb-4 tracking-tight">Lesson Summary & Conclusion</h2>
              <div className={`p-8 rounded-2xl border relative overflow-hidden ${
                darkMode ? "bg-gradient-to-br from-indigo-950/30 to-slate-900 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"
              }`}>
                <p className="text-lg italic font-serif leading-relaxed opacity-95">"{contentData.conclusion}"</p>
              </div>
            </div>
          )}

          {/* TAB 4: APPLICATION */}
          {activeTab === "application" && (
            <div role="tabpanel" id="panel-application" aria-labelledby="tab-application" className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-black mb-4 tracking-tight">Practical Life Application</h2>
              <div className={`p-8 rounded-2xl border ${darkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <p className="text-base leading-relaxed opacity-90">
                  Walk deliberately in the terms of your godly covenants in Christ Jesus, and stand vigilant to discern and dismantle ungodly covenants through active prayer, discernment, and spiritual integrity.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: QUIZ */}
          {activeTab === "quiz" && (
            <div role="tabpanel" id="panel-quiz" aria-labelledby="tab-quiz" className="space-y-6 text-center py-4 animate-fadeIn">
              {!quizActive && !showResults && (
                <div className="max-w-md mx-auto space-y-6">
                  <div className="w-16 h-16 mx-auto bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center animate-bounce">
                    <Award size={32} aria-hidden="true" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">Speed Quiz Challenge</h2>
                  <p className="text-xs sm:text-sm text-slate-400">Test your mastery of covenant principles under timed conditions and earn +50 XP!</p>
                  <button
                    onClick={startQuiz}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/25 transition-all hover:scale-105"
                  >
                    Start Quiz Challenge
                  </button>

                  <div className="mt-10 pt-6 border-t border-slate-700/40 text-left">
                    <h3 className="text-sm font-bold flex items-center gap-2 mb-3"><Trophy size={16} className="text-amber-500" aria-hidden="true" /> Live Leaderboard</h3>
                    <div className={`rounded-2xl p-4 border ${darkMode ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-200"} space-y-2.5`}>
                      {leaderboard.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No leaderboard scores recorded yet. Be the first!</p>
                      ) : (
                        leaderboard.map((entry, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-800/40 last:border-0">
                            <span className="font-bold flex items-center gap-2"><Star size={12} className="text-amber-500" aria-hidden="true" /> {entry.user_name}</span>
                            <span className="font-mono font-black text-blue-400">{entry.score} pts</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {quizActive && !showResults && (
                <div className="max-w-xl mx-auto text-left space-y-6">
                  <div className="flex justify-between items-center text-xs font-mono border-b pb-3 text-slate-400">
                    <span className="font-bold">Question {currentQuestion + 1} of {quizQuestions.length}</span>
                    <span className="text-amber-500 font-extrabold px-3 py-1 rounded-full bg-amber-500/10" aria-live="polite">⏱ {timeLeft}s remaining</span>
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">{quizQuestions[currentQuestion].q}</h2>
                  <div className="grid gap-3.5">
                    {quizQuestions[currentQuestion].a.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => checkAnswer(idx)}
                        className={`p-4 rounded-2xl border text-left text-sm font-semibold transition-all duration-200 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          darkMode ? "bg-slate-800/50 hover:bg-blue-600/20 border-slate-700/80 hover:border-blue-500/50" : "bg-slate-50 hover:bg-blue-50 border-slate-200"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showResults && (
                <div className="max-w-md mx-auto space-y-6 animate-fadeIn">
                  <Award size={56} className="mx-auto text-amber-500 animate-bounce" aria-hidden="true" />
                  <h2 className="text-2xl font-black">Challenge Completed!</h2>
                  <div className="p-6 rounded-2xl border bg-slate-800/30 border-slate-800 shadow-lg">
                    <div className="text-5xl font-black text-blue-400 mb-1 tracking-tight">{score}</div>
                    <p className="text-xs uppercase font-extrabold tracking-widest text-slate-400">Total Points Earned (+50 XP)</p>
                  </div>
                  <button onClick={startQuiz} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs shadow-lg transition-all hover:scale-105">Try Again</button>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PRAYER */}
          {activeTab === "chat" && (
            <div role="tabpanel" id="panel-chat" aria-labelledby="tab-chat" className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-black mb-4 tracking-tight">Prayer Points & Intercession</h2>
              <div className="space-y-3.5 mb-8">
                {contentData.prayerPoints.map((prayer, idx) => (
                  <div key={idx} className={`p-5 rounded-2xl border flex gap-4 items-start transition-all duration-300 hover:border-purple-500/40 ${
                    darkMode ? "bg-slate-800/30 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center text-xs font-black shrink-0">{idx + 1}</div>
                    <p className="leading-relaxed text-sm opacity-90">{prayer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};