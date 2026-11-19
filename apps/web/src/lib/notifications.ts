import type { T } from '@/i18n';

export type NotificationRow = { id: string; kind: string; data: unknown; link: string; created_at: string; read_at: string | null };

const STATUS_TEXT: Record<string, string> = {
  reviewing: 'Seu pedido para {animal} está em análise.',
  visit_scheduled: 'Seu pedido para {animal} está com visita marcada.',
  approved: 'Seu pedido para {animal} foi aprovado!',
  rejected: 'Seu pedido para {animal} foi recusado.',
};

/** Texto do aviso a partir do tipo + dados gravados pelo banco (traduzido pelo t). */
export function notificationText(t: T, kind: string, raw: unknown): string {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Record<string, string | number>;
  switch (kind) {
    case 'request_new': return t('Novo pedido de adoção: {adopter} quer adotar {animal}.', d);
    case 'request_status': return t(STATUS_TEXT[String(d.status)] ?? 'Seu pedido para {animal} foi atualizado.', d);
    case 'message': return t('Nova mensagem de {from} sobre {animal}.', d);
    case 'visit': return t('{from} propôs uma visita para conhecer {animal}.', d);
    case 'adoption': return t('Adoção de {animal} confirmada. Bem-vindo à família!', d);
    case 'checkin': return t('Hora do check-in: como está {animal}?', d);
    case 'term_accepted': return t('{adopter} aceitou o termo de adoção de {animal}.', d);
    case 'review': return t('Nova avaliação ({stars} de 5) na adoção de {animal}.', d);
    case 'report': return t('Nova denúncia para analisar.', d);
    default: return t('Você tem um aviso novo.');
  }
}
