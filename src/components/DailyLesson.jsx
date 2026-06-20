import { useState } from 'react';
import { useGemini } from '../hooks/useGemini.js';
import { loadMistakes } from '../utils/storage.js';
import { Loading, EmptyState } from './ui/Atoms.jsx';
import { Icon } from './ui/Icon.jsx';
import { t } from '../i18n.js';
import { getDailyLessonPrompt } from '../utils/prompts.js';

export function DailyLesson({ level, appLang }) {
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

      const sys = getDailyLessonPrompt(level, minutes, weak);

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
      <div className="neu-raised" style={{ padding: 18, marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>I have</div>
        {[5, 15, 30].map((t) => (
          <button key={t} className={minutes === t ? 'neu-btn' : 'neu-small'} onClick={() => setMinutes(t)} style={{ padding: '8px 12px', fontSize: 13, color: minutes === t ? '#fff' : 'var(--ink)' }}>
            {t} min
          </button>
        ))}
        <button className="neu-btn" onClick={generate} disabled={loading} style={{ marginLeft: 'auto', padding: '10px 16px', fontSize: 14, display: 'flex', gap: 6, alignItems: 'center' }}>
          {loading ? <Icon name="Globe" className="spin" size={16} /> : <Icon name="BookOpen" size={16} />} 
          {loading ? 'Building…' : "Generate"}
        </button>
      </div>

      {loading && <Loading label="Designing your personalized lesson…" />}
      {!lesson && !loading && <EmptyState title="Ready when you are" body="Pick your available time and generate a lesson tailored to your level and recent mistakes." />}

      {/* Lesson View */}
      {lesson && !loading && (
        <div className="fadein" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-teal)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{lesson.topic || lesson.focus}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>{lesson.title}</div>
          </div>

          {lesson.vocabulary && lesson.vocabulary.length > 0 && (
            <div className="neu-raised" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-copper)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="BookOpen" size={16} /> {t('dl_vocab', appLang)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lesson.vocabulary.map((v, i) => (
                  <div key={i} className="neu-inset" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{v.word}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{v.translation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lesson.grammarPoint && (
            <div className="neu-raised" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-teal)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="Layers" size={16} /> {t('dl_grammar', appLang)}: {lesson.grammarPoint.title || lesson.grammarFocus}
              </div>
              <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>{lesson.grammarPoint.explanation || lesson.grammarExplanation}</div>
              {lesson.grammarPoint.example && (
                <div className="neu-inset" style={{ marginTop: 12, fontSize: 14, fontStyle: 'italic', color: 'var(--color-teal)', padding: '12px' }}>
                  {lesson.grammarPoint.example}
                </div>
              )}
            </div>
          )}

          {lesson.reading && (
            <div className="neu-raised" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-copper)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="BookOpen" size={16} /> {t('dl_reading', appLang)}
              </div>
              <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{lesson.reading.text || lesson.readingText}</div>
            </div>
          )}

          {lesson.speakingTask && (
            <div className="neu-raised" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-teal)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="Mic" size={16} /> {t('dl_speaking', appLang)}
              </div>
              <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>{lesson.speakingTask}</div>
            </div>
          )}

          {lesson.quiz && lesson.quiz.length > 0 && (
            <div className="neu-raised" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-copper)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="CheckCircle" size={16} /> {t('dl_quiz', appLang)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {lesson.quiz.map((q, i) => (
                  <div key={i} style={{ borderBottom: i === lesson.quiz.length - 1 ? 'none' : '1px solid var(--shadow-dark)', paddingBottom: i === lesson.quiz.length - 1 ? 0 : 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--ink)' }}>{i + 1}. {q.question}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(q.options || []).map((opt, oi) => {
                        const picked = quizAnswers[i];
                        const isPicked = picked === oi;
                        const showCorrect = picked !== undefined;
                        const isAnswer = oi === q.answerIndex;
                        
                        let btnClass = 'neu-inset';
                        let color = 'var(--ink)';
                        if (showCorrect && isAnswer) {
                          btnClass = 'neu-raised';
                          color = 'var(--color-teal)';
                        } else if (showCorrect && isPicked && !isAnswer) {
                          btnClass = 'neu-raised';
                          color = 'var(--color-copper)';
                        }

                        return (
                          <button
                            key={oi}
                            onClick={() => setQuizAnswers((a) => ({ ...a, [i]: oi }))}
                            className={btnClass}
                            style={{ textAlign: 'left', padding: '12px 16px', color, fontSize: 14, fontWeight: showCorrect ? 600 : 400 }}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
