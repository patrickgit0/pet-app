/**
 * Compatibilidade adotante × animal a partir do perfil de moradia (etapa 2) e dos dados do anúncio.
 * Não vira porcentagem de propósito: com poucos dados, um número daria uma precisão que não existe.
 * Os textos estão em português (chave de tradução da web).
 */
export type CompatLevel = 'good' | 'warn' | 'bad';
export type CompatItem = { level: CompatLevel; text: string };

export type CompatAnimal = {
  species: 'dog' | 'cat' | 'other';
  size: 'small' | 'medium' | 'large';
  energy?: 'low' | 'medium' | 'high' | null;
  good_with_kids?: boolean | null;
  good_with_dogs?: boolean | null;
  good_with_cats?: boolean | null;
  good_for_apartment?: boolean | null;
};
export type CompatProfile = {
  home_type?: 'house' | 'apartment' | 'farm' | null;
  has_yard?: boolean | null;
  has_children?: boolean | null;
  other_pets?: string | null;
};

const mentions = (text: string, words: string[]) => words.some((w) => new RegExp(`(^|[^a-zà-ú])${w}`, 'i').test(text));

export function compatibility(a: CompatAnimal, p: CompatProfile): { items: CompatItem[]; overall: CompatLevel } | null {
  if (!p.home_type) return null; // perfil de moradia ainda não preenchido
  const items: CompatItem[] = [];
  const apt = p.home_type === 'apartment';

  if (apt) {
    if (a.good_for_apartment === true) items.push({ level: 'good', text: 'Se adapta a apartamento' });
    else if (a.good_for_apartment === false) items.push({ level: 'bad', text: 'A ONG indica que não se adapta a apartamento' });
    else if (a.species === 'dog' && a.size === 'large') items.push({ level: 'warn', text: 'Cão grande em apartamento: pergunte à ONG' });
  } else if (p.has_yard && a.species === 'dog') {
    items.push({ level: 'good', text: 'Sua casa tem quintal' });
  }

  if (a.species === 'dog' && a.energy === 'high' && apt && !p.has_yard) {
    items.push({ level: 'warn', text: 'Tem muita energia: vai precisar de passeios todos os dias' });
  }

  if (p.has_children) {
    if (a.good_with_kids === true) items.push({ level: 'good', text: 'Convive bem com crianças' });
    else if (a.good_with_kids === false) items.push({ level: 'bad', text: 'A ONG indica que não convive bem com crianças' });
  }

  const pets = (p.other_pets ?? '').trim();
  if (pets && !/^(n[aã]o|nenhum|0)\b/i.test(pets)) {
    if (mentions(pets, ['c[aã]o', 'c[aã]es', 'cachorr', 'dog'])) {
      if (a.good_with_dogs === true) items.push({ level: 'good', text: 'Convive bem com cães' });
      else if (a.good_with_dogs === false) items.push({ level: 'bad', text: 'A ONG indica que não convive bem com cães' });
    }
    if (mentions(pets, ['gat', 'cat'])) {
      if (a.good_with_cats === true) items.push({ level: 'good', text: 'Convive bem com gatos' });
      else if (a.good_with_cats === false) items.push({ level: 'bad', text: 'A ONG indica que não convive bem com gatos' });
    }
  }

  if (!items.length) return null;
  const overall: CompatLevel = items.some((i) => i.level === 'bad') ? 'bad' : items.some((i) => i.level === 'warn') ? 'warn' : 'good';
  return { items, overall };
}
