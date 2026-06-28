import { create } from 'zustand';
import { MOCK_EXERCISES } from '../data/mockExercises.js';
import { LS } from '../utils/storage.js';

export const useExerciseStore = create((set, get) => ({
  exercises: [],
  currentIndex: 0,
  score: 0,
  mistakes: [], // stores exercise IDs of incorrectly answered questions
  loading: false,
  currentLesson: null,
  
  // New Local State Additions
  streakFreezesAvailable: 1,
  streakFreezeUsedDate: null,
  weeklyRecapDismissedDate: null,
  casesHighestTierUnlocked: LS.get('gt_cases_tier', 1),
  setCasesHighestTierUnlocked: (tier) => {
    LS.set('gt_cases_tier', tier);
    set({ casesHighestTierUnlocked: tier });
  },
  
  articleTrainer: LS.get('gt_article_trainer', {
    tableProgress: {
      definite:   { completed: [], total: 16 },
      indefinite: { completed: [], total: 12 },
      negative:   { completed: [], total: 16 }
    },
    modeUnlocks: {
      mode2: true,
      mode3: false,
      mode4: false
    },
    bestScores: {
      mode1: null,
      mode2: null,
      mode3: null,
      mode4: null
    }
  }),

  updateArticleTrainerState: (updater) => {
    set((state) => {
      const newState = typeof updater === 'function' ? updater(state.articleTrainer) : { ...state.articleTrainer, ...updater };
      LS.set('gt_article_trainer', newState);
      return { articleTrainer: newState };
    });
  },
  

  // Interview Feature State
  interviewSession: {
    topic: null,
    germanLevel: 'B1',
    difficulty: 'Mid-Level',
    questionCount: 8,
    messages: [],
    sessionComplete: false,
    startedAt: null
  },

  setInterviewTopic: (topic) => set((state) => ({ interviewSession: { ...state.interviewSession, topic } })),

    startInterviewSession: (topic, germanLevel, difficulty, questionCount) => {
    set({
      interviewSession: {
        topic,
        germanLevel,
        difficulty,
        questionCount,
        messages: [],
        sessionComplete: false,
        startedAt: Date.now()
      }
    });
  },

  appendInterviewMessage: (role, text) => {
    set((state) => ({
      interviewSession: {
        ...state.interviewSession,
        messages: [...state.interviewSession.messages, { role, text }]
      }
    }));
  },

  endInterviewSession: () => {
    set((state) => ({
      interviewSession: { ...state.interviewSession, sessionComplete: true }
    }));
  },

  resetInterviewSession: () => {
    set({
      interviewSession: {
        topic: null,
        germanLevel: 'B1',
        difficulty: 'Mid-Level',
        questionCount: 8,
        messages: [],
        sessionComplete: false,
        startedAt: null
      }
    });
  },

    // Stubs for New Features
  scorePronunciation: async (audioBlob, referenceText) => {
    // Stub: Backend audio analysis
    return {
      overall: Math.floor(Math.random() * 40) + 60, // 60-100 score
      flaggedWords: [
        { word: referenceText.split(' ')[0] || 'Beispiel', issue: 'Mispronounced vowel' }
      ]
    };
  },
  
  generateDrillQuestions: (patternId) => {
    // Stub: Generate questions based on pattern
    return [
      { id: 'gd_1', type: 'fill_blank', question: `Die Frau gibt ___ Mann das Buch. (Dativ)`, correctAnswer: 'dem' },
      { id: 'gd_2', type: 'fill_blank', question: `Ich sehe ___ Hund. (Akkusativ)`, correctAnswer: 'den' }
    ];
  },
  
  generateListeningPassage: (level) => {
    // Stub: Generate passage based on level
    return {
      audioText: "Hallo! Ich heiße Anna und ich komme aus Berlin. Ich bin Softwareentwicklerin.",
      questions: [
        { q: "Woher kommt Anna?", options: ["Berlin", "München", "Wien", "Hamburg"], correctIndex: 0 },
        { q: "Was ist ihr Beruf?", options: ["Ärztin", "Lehrerin", "Softwareentwicklerin", "Kellnerin"], correctIndex: 2 }
      ]
    };
  },
  
  calculatePaceToGoal: (currentLevel, targetLevel, targetDate, recentVelocity) => {
    // Stub: Pace calculation
    return {
      weeksRemaining: 23,
      onTrackPercent: 85,
      statusLabel: 'Im Plan' // 'Im Plan' | 'Etwas hinterher' | 'Hinterher'
    };
  },
  
  scoreInterviewSession: async (transcript) => {
    // Stub: Mock interview scorecard data
    return {
      clarity: 85,
      grammar: 78,
      vocabulary: 92,
      confidence: 80,
      strengths: ["Guter Fachwortschatz", "Flüssiges Sprechen"],
      improvements: ["Satzbau bei Nebensätzen", "Weniger 'ähm' sagen"]
    };
  },
  
  detectStarCoverage: (messages) => {
    // Stub: STAR method detection
    const textLength = messages.map(m => m.text).join(' ').length;
    return {
      situation: textLength > 50,
      task: textLength > 100,
      action: textLength > 200,
      result: textLength > 300
    };
  },

  fetchExercises: async (filterType = 'all', filterValue = '', targetLevel = null) => {
    set({ loading: true });
    // Simulate network delay
    await new Promise(res => setTimeout(res, 500));
    
    let filtered = [...MOCK_EXERCISES];
    if (targetLevel) {
      filtered = filtered.filter(e => e.level === targetLevel);
    }
    
    if (filterType === 'lesson') {
      filtered = filtered.filter(e => e.lessonId === filterValue);
      set({ currentLesson: filtered.length > 0 ? filtered[0] : null });
    } else if (filterType === 'level') {
      filtered = filtered.filter(e => e.level === filterValue);
    } else if (filterType === 'mistakes') {
      const pastMistakes = LS.get('gt_ex_mistakes', []);
      filtered = filtered.filter(e => pastMistakes.includes(e.id));
    } else if (filterType === 'random') {
      filtered = filtered.sort(() => 0.5 - Math.random()).slice(0, 5);
    } else if (filterType === 'daily') {
      filtered = filtered.sort(() => 0.5 - Math.random()).slice(0, 8);
    } else if (filterType === 'articles') {
      let arts = [...MOCK_EXERCISES].filter(e => e.type === 'multiple_choice' && e.options && e.options.includes('der') && e.options.includes('die'));
      if (arts.length === 0) {
        arts = [
          { id: 'art_1', type: 'multiple_choice', question: '___ Tisch (the table)', options: ['der', 'die', 'das'], correctAnswer: 'der' },
          { id: 'art_2', type: 'multiple_choice', question: '___ Haus (the house)', options: ['der', 'die', 'das'], correctAnswer: 'das' },
          { id: 'art_3', type: 'multiple_choice', question: '___ Frau (the woman)', options: ['der', 'die', 'das'], correctAnswer: 'die' },
          { id: 'art_4', type: 'multiple_choice', question: '___ Auto (the car)', options: ['der', 'die', 'das'], correctAnswer: 'das' },
          { id: 'art_5', type: 'multiple_choice', question: '___ Hund (the dog)', options: ['der', 'die', 'das'], correctAnswer: 'der' }
        ];
      }
      filtered = arts.sort(() => 0.5 - Math.random()).slice(0, 5);
    } else if (filterType === 'listening') {
      const passage = get().generateListeningPassage(targetLevel || 'A1');
      filtered = passage.questions.map((q, idx) => ({
        id: `list_${idx}`,
        type: 'multiple_choice',
        audioText: passage.audioText,
        question: q.q,
        options: q.options,
        correctAnswer: q.options[q.correctIndex]
      }));
    }

    set({ 
      exercises: filtered, 
      currentIndex: 0, 
      score: 0, 
      mistakes: [],
      loading: false 
    });
  },

  submitAnswer: (exerciseId, answer, isCorrect) => {
    // Record progress to localStorage
    const progressKey = `gt_progress_${exerciseId}`;
    LS.set(progressKey, { answer, completed: true, correct: isCorrect });
    
    set((state) => {
      const newScore = isCorrect ? state.score + 1 : state.score;
      const newMistakes = isCorrect ? state.mistakes : [...state.mistakes, exerciseId];
      
      // Update persistent mistakes if wrong
      if (!isCorrect) {
        const pastMistakes = LS.get('gt_ex_mistakes', []);
        if (!pastMistakes.includes(exerciseId)) {
          LS.set('gt_ex_mistakes', [...pastMistakes, exerciseId]);
        }
      }

      return { score: newScore, mistakes: newMistakes };
    });
  },

  nextExercise: () => {
    set((state) => ({ currentIndex: state.currentIndex + 1 }));
  },

  previousExercise: () => {
    set((state) => ({ currentIndex: Math.max(0, state.currentIndex - 1) }));
  },

  resetSession: () => {
    set({ exercises: [], currentIndex: 0, score: 0, mistakes: [], currentLesson: null });
  }
}));
