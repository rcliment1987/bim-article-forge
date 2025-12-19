import { ArticleData } from "@/components/ArticleForm";

const CACHE_KEY = 'bim-articles-cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  data: ArticleData;
  timestamp: number;
  template: string;
}

interface CacheStore {
  [key: string]: CacheEntry;
}

const normalizeKey = (subject: string, template: string): string => {
  return `${subject.toLowerCase().trim()}::${template}`;
};

export const useArticleCache = () => {
  const getCached = (subject: string, template: string): ArticleData | null => {
    try {
      const cache: CacheStore = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const key = normalizeKey(subject, template);
      const entry = cache[key];
      
      if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
        console.log('[Cache] Hit for:', key);
        return entry.data;
      }
      
      console.log('[Cache] Miss for:', key);
      return null;
    } catch (error) {
      console.error('[Cache] Error reading cache:', error);
      return null;
    }
  };

  const setCache = (subject: string, template: string, data: ArticleData): void => {
    try {
      const cache: CacheStore = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const key = normalizeKey(subject, template);
      
      cache[key] = {
        data,
        timestamp: Date.now(),
        template,
      };
      
      // Clean old entries (keep max 20)
      const entries = Object.entries(cache);
      if (entries.length > 20) {
        const sorted = entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        const trimmed = Object.fromEntries(sorted.slice(0, 20));
        localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
      } else {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      }
      
      console.log('[Cache] Stored:', key);
    } catch (error) {
      console.error('[Cache] Error writing cache:', error);
    }
  };

  const clearCache = (): void => {
    localStorage.removeItem(CACHE_KEY);
    console.log('[Cache] Cleared');
  };

  const getCacheStats = (): { entries: number; oldestAge: string } => {
    try {
      const cache: CacheStore = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const entries = Object.values(cache);
      
      if (entries.length === 0) {
        return { entries: 0, oldestAge: 'N/A' };
      }
      
      const oldest = Math.min(...entries.map(e => e.timestamp));
      const ageHours = Math.round((Date.now() - oldest) / (1000 * 60 * 60));
      
      return {
        entries: entries.length,
        oldestAge: `${ageHours}h`,
      };
    } catch {
      return { entries: 0, oldestAge: 'N/A' };
    }
  };

  return { getCached, setCache, clearCache, getCacheStats };
};
