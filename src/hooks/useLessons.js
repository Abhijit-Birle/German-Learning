import { useState, useEffect } from 'react';

let globalLessons = null;
let fetchPromise = null;

export function useLessons() {
  const [lessonsData, setLessonsData] = useState(globalLessons || []);
  const [loading, setLoading] = useState(!globalLessons);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (globalLessons) {
      setLessonsData(globalLessons);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetch('/api/lessons')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch lessons');
          return res.json();
        })
        .then(data => {
          globalLessons = data;
          return data;
        });
    }

    fetchPromise
      .then(data => {
        setLessonsData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
        fetchPromise = null; // Reset so it can retry on next mount
      });
  }, []);

  return { lessonsData, loading, error };
}
