import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from './ui/Icon.jsx';
import { speakHumanGerman, speakBrowserFallback } from '../utils/tts.js';
import { t } from '../i18n.js';

const AudioButton = ({ text, appLang, size = 24 }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAudio = async () => {
    if (isPlaying || !text) return;
    setIsPlaying(true);
    try {
      const audio = await speakHumanGerman(text, 'Enceladus');
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
    } catch (e) {
      console.error('Audio play error:', e);
      speakBrowserFallback(text, 1.0, 'de-DE');
      setIsPlaying(false);
    }
  };

  return (
    <button
      className="neu-btn primary"
      onClick={handlePlayAudio}
      disabled={isPlaying}
      style={{
        width: size * 2,
        height: size * 2,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        flexShrink: 0
      }}
      title={t('dict_read_aloud', appLang)}
    >
      <Icon name={isPlaying ? 'Loader' : 'Volume2'} size={size} className={isPlaying ? 'spin' : ''} />
    </button>
  );
};

export function DictionaryWordDetail({ wordData, appLang }) {
  if (!wordData) return null;

  const hasDepth = wordData.synonyms?.length > 0 || wordData.antonyms?.length > 0 || wordData.word_family?.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="word-detail-card neu-panel"
      style={{ padding: '24px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <AudioButton text={wordData.word} appLang={appLang} size={24} />
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: 'var(--ink)' }}>
              {wordData.article ? `${wordData.article} ` : ''}{wordData.word}
            </h2>
            {wordData.cefr_level && (
              <span className="neu-small" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-teal)', padding: '4px 8px', borderRadius: '8px' }}>
                {wordData.cefr_level.toUpperCase()}
              </span>
            )}
            {wordData.register && (
              <span className="neu-inset" style={{ fontSize: '12px', color: 'var(--ink-soft)', padding: '4px 8px', borderRadius: '8px', fontStyle: 'italic' }}>
                {wordData.register}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '12px', color: 'var(--ink-soft)', fontSize: '15px' }}>
            <span style={{ fontStyle: 'italic', fontWeight: 'bold', color: 'var(--ink)' }}>
              {wordData.part_of_speech}
            </span>
            {wordData.gender && (
              <span style={{ fontWeight: 600 }}>
                (Genus: {wordData.gender})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', color: 'var(--ink-soft)', fontSize: '14px' }}>
            {wordData.ipa && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600 }}>IPA:</span>
                <span style={{ fontFamily: 'monospace', background: 'var(--paper-dark)', padding: '2px 6px', borderRadius: '4px' }}>/{wordData.ipa}/</span>
              </div>
            )}
            {wordData.english_pronunciation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600 }}>Sounds like:</span>
                <span style={{ fontStyle: 'italic' }}>"{wordData.english_pronunciation}"</span>
              </div>
            )}
          </div>
        </div>
        
        <AudioButton text={wordData.word} appLang={appLang} size={24} />
      </div>

      <hr style={{ border: 'none', borderTop: '2px solid var(--paper-dark)', margin: 0 }} />

      {/* Definitions */}
      {wordData.definitions && wordData.definitions.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--ink)', fontSize: '18px' }}>Definition</h4>
          <ul style={{ margin: 0, paddingLeft: '24px', color: 'var(--ink)', fontSize: '16px', lineHeight: 1.5 }}>
            {wordData.definitions.map((def, idx) => (
              <li key={idx} style={{ marginBottom: '6px' }}>{def}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Grammar Specific Tables */}
      {wordData.noun_details && (
        <div className="neu-inset" style={{ padding: '16px', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-teal)' }}>Noun Grammar</h4>
          <div style={{ marginBottom: '12px', fontSize: '15px' }}>
            <strong>Plural:</strong> {wordData.noun_details.plural}
          </div>
          {wordData.noun_details.declension && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--paper-dark)', color: 'var(--ink-soft)' }}>
                    <th style={{ padding: '8px' }}>Case</th>
                    <th style={{ padding: '8px' }}>Singular</th>
                    <th style={{ padding: '8px' }}>Plural</th>
                  </tr>
                </thead>
                <tbody>
                  {['nom', 'akk', 'dat', 'gen'].map(c => (
                    <tr key={c} style={{ borderBottom: '1px dotted var(--paper-dark)' }}>
                      <td style={{ padding: '8px', fontWeight: 600, textTransform: 'capitalize' }}>{c}</td>
                      <td style={{ padding: '8px' }}>{wordData.noun_details.declension.singular?.[c] || '-'}</td>
                      <td style={{ padding: '8px' }}>{wordData.noun_details.declension.plural?.[c] || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {wordData.verb_details && wordData.verb_details.conjugation && (
        <div className="neu-inset" style={{ padding: '16px', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-teal)' }}>Verb Conjugation</h4>
          <div style={{ marginBottom: '16px', fontSize: '15px' }}>
            <strong>Perfekt:</strong> {wordData.verb_details.conjugation.perfekt}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--paper-dark)', color: 'var(--ink-soft)' }}>
                  <th style={{ padding: '8px' }}>Pronoun</th>
                  <th style={{ padding: '8px' }}>Präsens</th>
                  <th style={{ padding: '8px' }}>Präteritum</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'ich', label: 'ich' },
                  { key: 'du', label: 'du' },
                  { key: 'er_sie_es', label: 'er/sie/es' },
                  { key: 'wir', label: 'wir' },
                  { key: 'ihr', label: 'ihr' },
                  { key: 'sie_Sie', label: 'sie/Sie' },
                ].map(p => (
                  <tr key={p.key} style={{ borderBottom: '1px dotted var(--paper-dark)' }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>{p.label}</td>
                    <td style={{ padding: '8px' }}>{wordData.verb_details.conjugation.praesens?.[p.key] || '-'}</td>
                    <td style={{ padding: '8px' }}>{wordData.verb_details.conjugation.praeteritum?.[p.key] || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {wordData.verb_details.conjugation.imperativ && (
            <div style={{ marginTop: '16px', fontSize: '14px' }}>
              <strong>Imperativ:</strong>
              <span style={{ marginLeft: '8px' }}>du {wordData.verb_details.conjugation.imperativ.du},</span>
              <span style={{ marginLeft: '8px' }}>ihr {wordData.verb_details.conjugation.imperativ.ihr},</span>
              <span style={{ marginLeft: '8px' }}>Sie {wordData.verb_details.conjugation.imperativ.Sie}</span>
            </div>
          )}
        </div>
      )}

      {wordData.adjective_details && wordData.adjective_details.comparison && (
        <div className="neu-inset" style={{ padding: '16px', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-teal)' }}>Adjective Comparison</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '14px', textAlign: 'center' }}>
            <div className="neu-small" style={{ padding: '12px' }}>
              <div style={{ color: 'var(--ink-soft)', marginBottom: '4px', fontSize: '12px' }}>Positiv</div>
              <div style={{ fontWeight: 600 }}>{wordData.adjective_details.comparison.positiv}</div>
            </div>
            <div className="neu-small" style={{ padding: '12px' }}>
              <div style={{ color: 'var(--ink-soft)', marginBottom: '4px', fontSize: '12px' }}>Komparativ</div>
              <div style={{ fontWeight: 600 }}>{wordData.adjective_details.comparison.komparativ}</div>
            </div>
            <div className="neu-small" style={{ padding: '12px' }}>
              <div style={{ color: 'var(--ink-soft)', marginBottom: '4px', fontSize: '12px' }}>Superlativ</div>
              <div style={{ fontWeight: 600 }}>{wordData.adjective_details.comparison.superlativ}</div>
            </div>
          </div>
        </div>
      )}

      {/* Word Depth */}
      {hasDepth && (
        <div>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--ink)', fontSize: '18px' }}>Word Depth</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '15px' }}>
            {wordData.synonyms && wordData.synonyms.length > 0 && (
              <div><strong style={{ color: 'var(--ink-soft)' }}>Synonyms:</strong> {wordData.synonyms.join(', ')}</div>
            )}
            {wordData.antonyms && wordData.antonyms.length > 0 && (
              <div><strong style={{ color: 'var(--ink-soft)' }}>Antonyms:</strong> {wordData.antonyms.join(', ')}</div>
            )}
            {wordData.word_family && wordData.word_family.length > 0 && (
              <div><strong style={{ color: 'var(--ink-soft)' }}>Word Family:</strong> {wordData.word_family.join(', ')}</div>
            )}
          </div>
        </div>
      )}

      {/* Examples */}
      {wordData.examples && wordData.examples.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--ink)', fontSize: '18px' }}>Beispiele</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {wordData.examples.map((ex, idx) => {
              // Gracefully handle both string examples (from old schema) and object examples (from new schema)
              const germanText = typeof ex === 'string' ? ex : ex.german;
              const englishText = typeof ex === 'string' ? '' : ex.english;
              return (
                <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'var(--paper-dark)', padding: '16px', borderRadius: '12px' }}>
                  <AudioButton text={germanText} appLang={appLang} size={18} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontStyle: 'italic', color: 'var(--ink)', fontSize: '16px', fontWeight: 500, lineHeight: 1.5 }}>
                      "{germanText}"
                    </div>
                    {englishText && (
                      <div style={{ color: 'var(--ink-soft)', fontSize: '14px', marginTop: '6px' }}>
                        {englishText}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
