import { useState, useEffect } from 'react';

export interface BuildInfo {
  commit: string;
  version: string;
  time: string;
}

export function useBuildInfo() {
  const [data, setData] = useState<BuildInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    fetch('/version', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
      .then(json => {
        if (!mounted) return;
        setData(json);
      })
      .catch(e => {
        if (!mounted) return;
        setError(String(e));
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return { data, error, loading };
}

export default useBuildInfo;
