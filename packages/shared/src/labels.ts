import type { Database } from './database.types';

type Enums = Database['public']['Enums'];
export type Species = Enums['species'];
export type AnimalSex = Enums['animal_sex'];
export type AnimalSize = Enums['animal_size'];
export type EnergyLevel = Enums['energy_level'];
export type HomeType = Enums['home_type'];
export type RequestStatus = Enums['request_status'];
export type AnimalStatus = Enums['animal_status'];

export const SPECIES_LABEL: Record<Species, string> = { dog: 'Cão', cat: 'Gato', other: 'Outro' };
export const SPECIES_PLURAL: Record<Species, string> = { dog: 'Cães', cat: 'Gatos', other: 'Outros' };
export const SPECIES_ORDER: Species[] = ['dog', 'cat', 'other'];

/** Espécie para exibir: em "outro", a raça guarda qual é o animal (ex.: Coelho). */
export function speciesText(species: Species, breed?: string | null): string {
  return species === 'other' && breed && breed !== 'SRD' ? breed : SPECIES_LABEL[species];
}
export const SIZE_LABEL: Record<AnimalSize, string> = { small: 'Pequeno', medium: 'Médio', large: 'Grande' };
export const ENERGY_LABEL: Record<EnergyLevel, string> = { low: 'Baixa', medium: 'Média', high: 'Alta' };
export const HOME_LABEL: Record<HomeType, string> = { house: 'Casa', apartment: 'Apartamento', farm: 'Chácara' };

export function sexLabel(sex: AnimalSex): string {
  return sex === 'male' ? 'Macho' : 'Fêmea';
}

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  sent: 'Enviado',
  reviewing: 'Em análise',
  visit_scheduled: 'Visita marcada',
  approved: 'Aprovado',
  rejected: 'Recusado',
  cancelled: 'Cancelado',
};

export const ANIMAL_STATUS_LABEL: Record<AnimalStatus, string> = {
  draft: 'Rascunho',
  available: 'Disponível',
  reserved: 'Reservado',
  adopted: 'Adotado',
  archived: 'Arquivado',
};

export const AGE_GROUPS = [
  { value: 'puppy', label: 'Filhote' },
  { value: 'adult', label: 'Adulto' },
  { value: 'senior', label: 'Idoso' },
] as const;

export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recomendado' },
  { value: 'distance', label: 'Mais perto' },
  { value: 'rating', label: 'Melhor ONG' },
  { value: 'recent', label: 'Mais recentes' },
  { value: 'oldest', label: 'Esperando há mais tempo' },
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number]['value'];

export const RADIUS_OPTIONS_KM = [5, 10, 25, 50] as const;

/** "Thor Bolinha" -> "thor-bolinha" (sem acento, só letras, números e hífen). */
export function slugify(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'pet';
}

/** Link do anúncio: /animais/thor-3f2a9c. Sem código (dados antigos), cai no id. */
export function animalPath(a: { id: string; name?: string | null; code?: string | null }): string {
  return a.code ? `/animais/${slugify(a.name ?? '')}-${a.code}` : `/animais/${a.id}`;
}

/** Idioma da interface. Textos de domínio ficam em pt-BR e são traduzidos na camada de UI. */
export type Lang = 'pt' | 'en';

/** 24 -> "2 anos", 5 -> "5 meses", null -> "Idade não informada" (ou em inglês com lang = 'en') */
export function formatAge(months: number | null | undefined, lang: Lang = 'pt'): string {
  const en = lang === 'en';
  if (months === null || months === undefined) return en ? 'Age unknown' : 'Idade não informada';
  if (months < 12) return months <= 1 ? (en ? '1 month' : '1 mês') : `${months} ${en ? 'months' : 'meses'}`;
  const years = Math.floor(months / 12);
  return years === 1 ? (en ? '1 year' : '1 ano') : `${years} ${en ? 'years' : 'anos'}`;
}

/** 4.9 -> "4,9" (pt) ou "4.9" (en) */
export function formatRating(rating: number | null | undefined, lang: Lang = 'pt'): string | null {
  if (rating === null || rating === undefined) return null;
  const v = Number(rating).toFixed(1);
  return lang === 'en' ? v : v.replace('.', ',');
}

/** 1.234 -> "1,2 km"; abaixo de 1 km mostra "menos de 1 km" (não expõe localização exata) */
export function formatDistance(km: number | null | undefined, lang: Lang = 'pt'): string {
  if (km === null || km === undefined) return '';
  if (km < 1) return lang === 'en' ? 'less than 1 km' : 'menos de 1 km';
  const v = km.toFixed(1);
  return `${lang === 'en' ? v : v.replace('.', ',')} km`;
}

/** Mensagens amigáveis para os erros levantados pelas funções SQL. */
export const RPC_ERROR_MESSAGE: Record<string, string> = {
  NOT_AUTHENTICATED: 'Entre na sua conta para continuar.',
  PROFILE_INCOMPLETE: 'Complete seu perfil para pedir a adoção.',
  INVALID_CPF: 'CPF inválido.',
  CPF_IN_USE: 'Este CPF já está cadastrado em outra conta.',
  INVALID_PHONE: 'Celular inválido. Use DDD + número com 9 dígitos.',
  CPF_LOCKED: 'O CPF não pode ser alterado. Fale com o suporte.',
  INVALID_CEP: 'CEP inválido.',
  STREET_REQUIRED: 'Informe o endereço.',
  LGPD_CONSENT_REQUIRED: 'É preciso aceitar a Política de Privacidade.',
  ANIMAL_NOT_AVAILABLE: 'Este animal não está mais disponível.',
  NGO_CANNOT_START_CONVERSATION: 'A ONG não pode iniciar conversas.',
  FORBIDDEN: 'Você não tem permissão para isso.',
  NOT_APPROVED: 'O pedido ainda não foi aprovado.',
  RATE_LIMIT: 'Muitas ações em pouco tempo. Aguarde um pouco e tente de novo.',
};

export function rpcErrorMessage(message: string | undefined): string {
  if (!message) return 'Algo deu errado. Tente novamente.';
  const code = Object.keys(RPC_ERROR_MESSAGE).find((k) => message.includes(k));
  return code ? RPC_ERROR_MESSAGE[code] : 'Algo deu errado. Tente novamente.';
}
