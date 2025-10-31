import { useState, useEffect, useRef } from 'react';

const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

export function useApiCache() {
  const cache = useRef(new Map());

  const get = (key) => {
    const item = cache.current.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > CACHE_TTL) {
      cache.current.delete(key);
      return null;
    }
    
    return item.data;
  };

  const set = (key, data) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now()
    });
  };

  const clear = () => cache.current.clear();

  return { get, set, clear };
}