'use client';

import React from 'react';
import { CacheProvider } from '@emotion/react';
import createCache, { EmotionCache } from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';

function createEmotionCache() {
  const cache = createCache({ key: 'mui', prepend: true });
  cache.compat = true;
  return cache;
}

interface ThemeRegistryProps {
  children: React.ReactNode;
}

export default function ThemeRegistry({ children }: ThemeRegistryProps) {
  const [{ cache, flush }] = React.useState(() => {
    const cache = createEmotionCache();
    const inserted: { name: string; value: string }[] = [];

    const prevInsert = cache.insert;
    cache.insert = (...args) => {
      const [selector, serialized] = args;
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push({ name: serialized.name, value: serialized.styles });
      }
      return prevInsert(...args);
    };

    const flush = () => {
      const prevInserted = inserted.splice(0, inserted.length);
      return prevInserted;
    };

    return { cache, flush } as { cache: EmotionCache; flush: () => { name: string; value: string }[] };
  });

  useServerInsertedHTML(() => {
    const styles = flush();
    if (styles.length === 0) {
      return null;
    }
    return (
      <style
        data-emotion={`${cache.key} ${styles.map((style) => style.name).join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles.map((style) => style.value).join(' ') }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
