/** Mostrado na hora do clique enquanto a próxima página carrega (resposta imediata). */
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6" aria-busy="true" aria-label="Carregando">
      <div className="mb-5 h-7 w-64 max-w-full animate-pulse rounded-lg bg-line" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="aspect-[4/3] animate-pulse bg-field" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-2/3 animate-pulse rounded bg-line" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-line" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
