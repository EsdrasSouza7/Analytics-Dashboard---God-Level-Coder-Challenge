import { useState, useEffect } from 'react';
import { useApiCache } from './useApiCache';

export function useFetchWithCache(url, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cache = useApiCache();

  useEffect(() => {
    if (!url) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const cacheKey = `${url}-${JSON.stringify(dependencies)}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔍 Fetching:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        cache.set(cacheKey, result);
        setData(result);
      } catch (err) {
        console.error('❌ Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [url, JSON.stringify(dependencies)]);

  return { data, loading, error };
}