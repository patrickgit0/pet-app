import { isValidCpf } from '@viralar/shared';

/**
 * Pix "copia e cola" estático (BR Code, padrão EMV do Banco Central), sem valor fixo: a pessoa digita o valor no banco.
 * Não passa por intermediário: o dinheiro vai direto para a chave da ONG.
 */
export function pixKey(raw: string): string {
  const k = raw.trim();
  const digits = k.replace(/\D/g, '');
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k)) return k.toLowerCase(); // aleatória
  if (k.includes('@')) return k.toLowerCase(); // e-mail
  if (k.startsWith('+')) return `+${digits}`;
  if (digits.length === 14 && /^[\d./-]+$/.test(k)) return digits; // CNPJ
  if (digits.length === 11 && /^[\d.-]+$/.test(k) && isValidCpf(digits)) return digits; // CPF
  if ((digits.length === 10 || digits.length === 11) && /^[\d()\s+-]+$/.test(k)) return `+55${digits}`; // celular
  if (digits.length === 13 && digits.startsWith('55')) return `+${digits}`;
  return k;
}

const ascii = (s: string, max: number) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 .-]/g, '').trim().slice(0, max).toUpperCase() || 'ONG';

function field(id: string, value: string) {
  return id + String(value.length).padStart(2, '0') + value;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function pixPayload({ key, name, city, message }: { key: string; name: string; city: string; message?: string }): string {
  const account = field('00', 'br.gov.bcb.pix') + field('01', pixKey(key)) + (message ? field('02', ascii(message, 40)) : '');
  const body = field('00', '01') + field('26', account) + field('52', '0000') + field('53', '986') + field('58', 'BR')
    + field('59', ascii(name, 25)) + field('60', ascii(city, 15)) + field('62', field('05', '***')) + '6304';
  return body + crc16(body);
}
