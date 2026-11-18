'use client';

import type { SelectHTMLAttributes } from 'react';

/** Select que envia o formulário assim que muda (sem botão "Ok"). */
export function AutoSubmitSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
