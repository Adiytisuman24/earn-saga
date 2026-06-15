import { useCallback } from 'react';
import { api } from '../lib/api';

export const useAnalytics = () => {
  const track = useCallback(async (action: string, metadata: Record<string, unknown> = {}) => {
    try {
      // Fire-and-forget style tracking so it doesn't block UI
      api.post('/analytics/track', {
        action,
        metadata,
      }).catch(() => {
        // Silently fail if analytics is down
      });
    } catch (err) {
      // Ignore synchronous errors
    }
  }, []);

  return { track };
};
