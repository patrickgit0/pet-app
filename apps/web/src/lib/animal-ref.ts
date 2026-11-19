/** O segmento de /animais/[id] pode ser o link bonito (thor-3f2a9c) ou o id antigo (uuid). */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function animalRef(param: string): { col: 'id' | 'code'; value: string } {
  const p = decodeURIComponent(param);
  if (UUID.test(p)) return { col: 'id', value: p };
  return { col: 'code', value: (p.split('-').pop() ?? '').toLowerCase() };
}
