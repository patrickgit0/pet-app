import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidCpf, formatCpf, toE164Phone, formatPhone, isValidCnpj, formatCnpj } from './cpf.ts';
import { formatCep, lookupCep } from './cep.ts';
import { openNow, parseOpeningHours, visitSlots, whatsappLink } from './hours.ts';

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

test('lookupCep usa BrasilAPI e cai no Nominatim sem coordenadas', async () => {
  const calls: string[] = [];
  const fakeFetch = async (url: string) => {
    calls.push(url);
    if (url.includes('brasilapi')) {
      return { ok: true, json: async () => ({ state: 'SP', city: 'Ribeirão Preto', neighborhood: 'Centro', street: 'Rua X', location: { coordinates: {} } }) };
    }
    return { ok: true, json: async () => [{ lat: '-21.17', lon: '-47.81' }] };
  };
  const r = await lookupCep('14010-000', fakeFetch);
  assert.equal(r?.city, 'Ribeirão Preto');
  assert.equal(r?.lat, -21.17);
  assert.equal(calls.length, 2);
  assert.equal(await lookupCep('123', fakeFetch), null);
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
