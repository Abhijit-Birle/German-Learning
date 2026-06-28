import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './ui/Icon.jsx';
import { t } from '../i18n.js';
import { useGemini } from '../hooks/useGemini.js';
import { getDictionaryPrompt } from '../utils/prompts.js';
import { loadDictHistory, addDictHistory } from '../utils/storage.js';
import { DictionaryWordDetail } from './DictionaryWordDetail.jsx';

export function Dictionary({ appLang }) {
  const gemini = useGemini();
  const [history, setHistory] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [activeWordData, setActiveWordData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load history on mount
  useEffect(() => {
    setHistory(loadDictHistory());
  }, []);

  const handleSearch = async (wordToSearch) => {
    const query = wordToSearch.trim();
    if (!query) return;

    // Check if it's already the active word
    if (activeWordData && activeWordData.word.toLowerCase() === query.toLowerCase()) return;

    // Check if it's already in history to avoid unnecessary API calls
    const cached = history.find(h => h.word.toLowerCase() === query.toLowerCase());
    if (cached) {
      setActiveWordData(cached);
      setSearchInput('');
      // Move to top of history
      addDictHistory(cached);
      setHistory(loadDictHistory());
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setActiveWordData(null);

    try {
      const prompt = getDictionaryPrompt(query);
      const res = await gemini.call(prompt, [{ role: 'user', parts: [{ text: query }] }], true);

      if (!res || !res.word) {
        throw new Error('Invalid response format');
      }

      setActiveWordData(res);
      addDictHistory(res);
      setHistory(loadDictHistory());
      setSearchInput('');
    } catch (e) {
      console.error('Dictionary API Error:', e);
      setErrorMsg(t('dict_not_found', appLang));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

      {/* Loading / Error States - Show globally if applicable */}
      {isLoading && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--app-bg)', zIndex: 10 }}>
          <div className="neu-panel" style={{ padding: '32px', textAlign: 'center' }}>
            <Icon name="Loader" className="spin" size={32} color="var(--color-teal)" />
            <div style={{ marginTop: '16px', fontWeight: 600, color: 'var(--ink)' }}>{t('dict_search', appLang)}...</div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {errorMsg && (
          <div style={{ textAlign: 'center', padding: '16px', color: '#E53E3E', background: '#FED7D7', borderRadius: '12px', marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeWordData ? (
            /* DETAIL VIEW */
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <button
                className="neu-small"
                onClick={() => setActiveWordData(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ink-soft)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '16px'
                }}
              >
                <Icon name="ArrowLeft" size={20} />
                Back to History
              </button>

              <DictionaryWordDetail wordData={activeWordData} appLang={appLang} />
            </motion.div>
          ) : (
            /* HISTORY VIEW */
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              style={{ paddingBottom: '100px' }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--ink-soft)', marginBottom: '16px' }}>
                {t('dict_history', appLang)}
              </h3>

              {history.length === 0 ? (
                <p style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>
                  {t('dict_history_empty', appLang)}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {history.map((item, idx) => (
                    <button
                      key={item.id || item.word + idx}
                      className="neu-panel"
                      onClick={() => handleSearch(item.word)}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        background: 'var(--paper-dark)',
                        border: 'none',
                        textAlign: 'left',
                        borderRadius: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-copper)' }} />
                        <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>
                          {item.article ? `${item.article} ` : ''}{item.word}
                        </span>
                      </div>
                      <Icon name="ChevronRight" size={16} color="var(--ink-soft)" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Search Bar (Only shown in History View) */}
      {!activeWordData && (
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          padding: '16px',
          background: 'linear-gradient(to top, var(--bg) 80%, transparent)'
        }}>
          <div className="neu-panel" style={{ display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '24px' }}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchInput)}
              placeholder={t('dict_placeholder', appLang)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                padding: '8px 16px',
                fontSize: '16px',
                color: 'var(--ink)',
                outline: 'none'
              }}
            />
            <button
              className="neu-btn primary"
              onClick={() => handleSearch(searchInput)}
              disabled={!searchInput.trim() || isLoading}
              style={{ borderRadius: '20px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Icon name="Search" size={18} />
              {t('dict_search', appLang)}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
