'use client';

import { useEffect, useState } from 'react';

/**
 * URLs temporárias (blob:) para mostrar a prévia de arquivos escolhidos.
 * Cria e revoga as URLs no MESMO efeito: com useMemo + cleanup separado, o React (Strict Mode / remontagem)
 * revogava as URLs e reaproveitava as mesmas, e a prévia aparecia quebrada.
 */
export function useObjectUrls(files: readonly (File | Blob)[]): string[] {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const created = files.map((f) => URL.createObjectURL(f));
    setUrls(created);
    return () => created.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);
  // Enquanto o efeito não rodou para a lista nova, não mostra URLs de outra lista
  return urls.length === files.length ? urls : [];
}

/** Mesma coisa para um arquivo só. */
export function useObjectUrl(file: File | Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return setUrl(null);
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return file ? url : null;
}
