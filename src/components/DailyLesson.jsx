import { useState } from 'react';
import { useGemini } from '../hooks/useGemini.js';
import { loadMistakes } from '../utils/storage.js';
import { Loading, EmptyState } from './ui/Atoms.jsx';

export function DailyLesson({ level }) {
  const { call } = useGemini();
  const [minutes, setMinutes] = useState(15);
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    setLesson(null);
    setQuizAnswers({});
    try {
      const mistakes = loadMistakes();
      const cats = {};
      mistakes.forEach((m) => (cats[m.category] = (cats[m.category] || 0) + 1));
      const weak = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 3).map((c) => c[0]);

      const sys = `You are a German curriculum designer. Build one personalized daily lesson for a CEFR ${level} learner with ${minutes} minutes available. Their weak areas (from past mistakes) are: ${weak.join(', ') || 'none recorded yet, pick generally useful areas for this level'}.
Scale the amount of content to the time available (5 min = very short, 30 min = fuller lesson).
Return ONLY raw JSON: {"title":"<lesson title in English>","focus":"<1 sentence on today's focus, tied to weak areas if any>","vocabulary":[{"word":"<German>","translation":"<English>"}],"grammarPoint":{"title":"<grammar topic>","explanation":"<short clear explanation>","example":"<German example sentence>"},"reading":{"text":"<short German reading passage appropriate to level>","questions":[{"question":"<comprehension question in English>","answer":"<expected answer>"}]},"speakingTask":"<a speaking prompt in English describing what to say aloud in German>","quiz":[{"question":"<German or English quiz question>","options":["a","b","c","d"],"answerIndex":0}]}
Keep vocabulary list to 3-10 words and quiz to 3-6 questions depending on time available.`;

      const out = await call(sys, [{ role: 'user', parts: [{ text: "Generate today's lesson." }] }], true);
      setLesson(out);
    } catch (e) {
      alert(e.message === 'NO_KEY' ? 'Set your Gemini API key first.' : e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '0 16px 24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Controls */}
      <div className="card" style={{ padding: 18, marginBottom: 18, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>I have</div>
        {[5, 15, 30].map((t) => (
          <button key={t} className={minutes === t ? 'btn' : 'btn-outline'} onClick={() => setMinutes(t)}>
            {t} min
          </button>
        ))}
        <button className="btn" onClick={generate} disabled={loading} style={{ marginLeft: 'auto' }}>
          {loading ? 'Building lesson…' : "✦ Generate today's lesson"}
        </button>
      </div>

      {loading && <Loading label="Designing your personalized lesson…" />}
      {!lesson && !loading && <EmptyState title="Ready when you are" body="Pick your available time and generate a lesson tailored to your level and recent mistakes." />}

      {lesson && (
        <div className="fadein" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <div className="card" style={{ padding: 18 }}>
            <div className="display" style={{ fontSize: 20 }}>{lesson.title}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>{lesson.focus}</div>
          </div>

          {/* Vocabulary */}
          {lesson.vocabulary && lesson.vocabulary.length > 0 && (
            <div className="card" style={{ padding: 18 }}>
              <div className="display" style={{ fontSize: 16, marginBottom: 10 }}>Vocabulary</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 8 }}>
                {lesson.vocabulary.map((w, i) => (
                  <div key={i} style={{ fontSize: 13, padding: '6px 10px', background: '#3B3A39', borderRadius: 8 }}>
                    <strong>{w.word}</strong> — {w.translation}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grammar */}
          {lesson.grammarPoint && (
            <div className="card" style={{ padding: 18 }}>
              <div className="display" style={{ fontSize: 16, marginBottom: 6 }}>Grammar: {lesson.grammarPoint.title}</div>
              <div style={{ fontSize: 13, marginBottom: 8 }}>{lesson.grammarPoint.explanation}</div>
              <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--teal)' }}>{lesson.grammarPoint.example}</div>
            </div>
          )}

          {/* Reading */}
          {lesson.reading && (
            <div className="card" style={{ padding: 18 }}>
              <div className="display" style={{ fontSize: 16, marginBottom: 6 }}>Reading</div>
              <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{lesson.reading.text}</div>
              {(lesson.reading.questions || []).map((q, i) => (
                <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>• {q.question}</div>
              ))}
            </div>
          )}

          {/* Speaking */}
          {lesson.speakingTask && (
            <div className="card" style={{ padding: 18, background: '#3B3A39' }}>
              <div className="display" style={{ fontSize: 16, marginBottom: 6 }}>🎙 Speaking task</div>
              <div style={{ fontSize: 13 }}>{lesson.speakingTask}</div>
            </div>
          )}

          {/* Quiz */}
          {lesson.quiz && lesson.quiz.length > 0 && (
            <div className="card" style={{ padding: 18 }}>
              <div className="display" style={{ fontSize: 16, marginBottom: 10 }}>Quiz</div>
              {lesson.quiz.map((q, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{i + 1}. {q.question}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {q.options.map((opt, oi) => {
                      const picked = quizAnswers[i];
                      const isPicked = picked === oi;
                      const showCorrect = picked !== undefined;
                      const isAnswer = oi === q.answerIndex;
                      let bg = 'var(--card)';
                      if (showCorrect && isAnswer) bg = '#2C6953';
                      else if (showCorrect && isPicked && !isAnswer) bg = '#662232';
                      return (
                        <button
                          key={oi}
                          onClick={() => setQuizAnswers((a) => ({ ...a, [i]: oi }))}
                          style={{ textAlign: 'left', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 8, background: bg, color: 'var(--ink)', fontSize: 13 }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
