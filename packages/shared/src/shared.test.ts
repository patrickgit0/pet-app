import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidCpf, formatCpf, toE164Phone, formatPhone, isValidCnpj, formatCnpj } from './cpf.ts';
import { formatCep, lookupCep } from './cep.ts';
import { openNow, parseOpeningHours, visitSlots, whatsappLink } from './hours.ts';
import { compatibility } from './compat.ts';

test('CPF válido e inválido', () => {
  assert.equal(isValidCpf('529.982.247-25'), true);
  assert.equal(isValidCpf('52998224724'), false);
  assert.equal(isValidCpf('111.111.111-11'), false);
  assert.equal(isValidCpf('123'), false);
});

test('máscaras', () => {
  assert.equal(formatCpf('52998224725'), '529.982.247-25');
  assert.equal(formatCpf('5299'), '529.9');
  assert.equal(formatCep('14025000'), '14025-000');
  assert.equal(formatPhone('16991234567'), '(16) 99123-4567');
});

test('celular em E.164', () => {
  assert.equal(toE164Phone('(16) 99123-4567'), '+5516991234567');
  assert.equal(toE164Phone('+55 16 99123-4567'), '+5516991234567');
  assert.equal(toE164Phone('123'), null);
});

// BrasilAPI que devolve o CENTRO DA CIDADE como coordenada (acontece com alguns CEPs)
const CITY_CENTER = { latitude: '-21.1775', longitude: '-47.81028' };
const STREET_POINT = [{ lat: '-21.2013', lon: '-47.7965' }];
const HOOD_POINT = [{ lat: '-21.1990', lon: '-47.8000' }];

function fakeServices(brasil: object | null, nominatim: (q: string) => unknown[]) {
  const calls: { url: string; q?: string; lang?: string }[] = [];
  const fetchImpl = async (url: string, init?: { headers?: Record<string, string> }) => {
    if (url.includes('nominatim')) {
      const q = decodeURIComponent(new URL(url).searchParams.get('q')!);
      calls.push({ url, q, lang: init?.headers?.['Accept-Language'] });
      return { ok: true, json: async () => nominatim(q) };
    }
    calls.push({ url });
    if (url.includes('brasilapi')) return brasil ? { ok: true, json: async () => brasil } : { ok: false, json: async () => ({}) };
    return { ok: false, json: async () => ({}) };
  };
  return { calls, fetchImpl };
}

test('lookupCep: ponto da rua no Nominatim (sem bairro) vence o centro da cidade da BrasilAPI', async () => {
  const { calls, fetchImpl } = fakeServices(
    { state: 'SP', city: 'Franca', neighborhood: 'Jardim Consolação', street: 'Rua das Flores', location: { coordinates: CITY_CENTER } },
    (q) => (q.includes('Jardim Consolação') ? [] : STREET_POINT), // com o bairro, o OSM não acha a rua
  );
  const r = await lookupCep('14401-000', fetchImpl, { nominatimGapMs: 0 });
  assert.equal(r?.street, 'Rua das Flores');
  assert.equal(r?.neighborhood, 'Jardim Consolação');
  assert.deepEqual([r?.lat, r?.lng, r?.precision], [-21.2013, -47.7965, 'street']);
  const nomi = calls.filter((c) => c.q);
  assert.equal(nomi.length, 1);
  assert.equal(nomi[0].q, 'Rua das Flores, Franca, SP, Brasil');
  assert.equal(nomi[0].lang, 'pt-BR');
});

test('lookupCep: rua não encontrada usa o ponto da BrasilAPI', async () => {
  const { fetchImpl } = fakeServices(
    { state: 'SP', city: 'Franca', neighborhood: 'Centro', street: 'Rua Desconhecida', location: { coordinates: CITY_CENTER } },
    () => [],
  );
  const r = await lookupCep('14400-000', fetchImpl, { nominatimGapMs: 0 });
  assert.deepEqual([r?.lat, r?.lng, r?.precision], [-21.1775, -47.81028, 'cep']);
});

test('lookupCep: sem rua e sem ponto da BrasilAPI tenta bairro + cidade + UF', async () => {
  const { calls, fetchImpl } = fakeServices(
    { state: 'SP', city: 'Franca', neighborhood: 'Centro', street: 'Rua X', location: { coordinates: {} } },
    (q) => (q.startsWith('Centro') ? HOOD_POINT : []),
  );
  const r = await lookupCep('14400-000', fetchImpl, { nominatimGapMs: 0 });
  assert.deepEqual([r?.lat, r?.lng, r?.precision], [-21.199, -47.8, 'neighborhood']);
  assert.deepEqual(calls.filter((c) => c.q).map((c) => c.q), ['Rua X, Franca, SP, Brasil', 'Centro, Franca, SP, Brasil']);
});

test('lookupCep: geocode false não chama o Nominatim; CEP inválido não chama nada', async () => {
  const { calls, fetchImpl } = fakeServices(
    { state: 'SP', city: 'Franca', neighborhood: 'Centro', street: 'Rua X', location: { coordinates: CITY_CENTER } },
    () => STREET_POINT,
  );
  const r = await lookupCep('14400-000', fetchImpl, { geocode: false });
  assert.equal(r?.precision, 'cep');
  assert.equal(calls.filter((c) => c.q).length, 0);
  assert.equal(await lookupCep('123', fetchImpl), null);
});

test('CNPJ', () => {
  assert.equal(isValidCnpj('11.222.333/0001-81'), true);
  assert.equal(isValidCnpj('11222333000182'), false);
  assert.equal(formatCnpj('11222333000181'), '11.222.333/0001-81');
});

test('horário da ONG e horários de visita', () => {
  const oh = parseOpeningHours({ mon: { open: '09:00', close: '11:00' }, sun: null, tue: { open: '18:00', close: '09:00' } })!;
  assert.equal(oh.tue, null); // abre depois de fechar: inválido
  const monday = new Date(2026, 10, 16); // segunda
  assert.deepEqual(visitSlots(oh, monday), ['09:00', '09:30', '10:00', '10:30']);
  assert.deepEqual(visitSlots(oh, new Date(2026, 10, 15)), []); // domingo fechado
  assert.equal(openNow(oh, new Date(2026, 10, 16, 10, 0))?.open, true);
  assert.equal(openNow(oh, new Date(2026, 10, 16, 11, 0))?.open, false);
  assert.equal(parseOpeningHours({}), null);
  assert.equal(whatsappLink('55 16 99999-0000', 'Oi!'), 'https://wa.me/5516999990000?text=Oi!');
});

test('compatibilidade adotante × animal', () => {
  const dog = { species: 'dog', size: 'large', energy: 'high', good_with_kids: true, good_with_cats: false, good_for_apartment: null } as const;
  assert.equal(compatibility(dog, {}), null); // sem perfil de moradia
  const apt = compatibility(dog, { home_type: 'apartment', has_yard: false, has_children: true, other_pets: 'Uma gata' })!;
  assert.equal(apt.overall, 'bad'); // não convive com gatos
  assert.ok(apt.items.some((i) => i.text.includes('crianças') && i.level === 'good'));
  assert.ok(apt.items.some((i) => i.level === 'warn' && i.text.includes('apartamento')));
  const house = compatibility({ ...dog, energy: 'low' }, { home_type: 'house', has_yard: true, has_children: false, other_pets: 'não' })!;
  assert.equal(house.overall, 'good');
});
