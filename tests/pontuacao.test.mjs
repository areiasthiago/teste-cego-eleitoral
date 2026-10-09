import test from 'node:test';
import assert from 'node:assert/strict';
import { calcular } from '../js/pontuacao.js';

const rodadas = [
  { id: 'a', area: 'X' },
  { id: 'b', area: 'X' },
  { id: 'c', area: 'Y' },
  { id: 'd', area: 'Y' },
];
const r = (escolha, peso = 1) => ({ escolha, peso });

test('tudo de um lado dá 100 a 0', () => {
  const res = calcular(rodadas, { a: r('lula'), b: r('lula'), c: r('lula'), d: r('lula') });
  assert.deepEqual(res.pct, { lula: 100, flavio: 0 });
  assert.equal(res.lider, 'lula');
});

test('empate não tem líder', () => {
  const res = calcular(rodadas, { a: r('lula'), b: r('flavio'), c: r('lula'), d: r('flavio') });
  assert.deepEqual(res.pct, { lula: 50, flavio: 50 });
  assert.equal(res.lider, null);
});

test('tudo pulado não tem percentual', () => {
  const res = calcular(rodadas, { a: r(null), b: r(null) });
  assert.equal(res.pct, null);
  assert.equal(res.respondidas, 0);
  assert.equal(res.poucas, true);
});

test('peso 2 conta em dobro e os percentuais somam 100', () => {
  const res = calcular(rodadas, { a: r('flavio', 2), b: r('lula'), c: r(null), d: r('lula') });
  assert.deepEqual(res.pontos, { lula: 2, flavio: 2 });
  const outro = calcular(rodadas, { a: r('flavio', 2), b: r('lula') });
  assert.deepEqual(outro.pct, { lula: 33, flavio: 67 });
  assert.equal(outro.pct.lula + outro.pct.flavio, 100);
});

test('quebra por área ignora rodadas puladas e ids desconhecidos', () => {
  const res = calcular(rodadas, { a: r('lula'), c: r('flavio', 2), d: r(null), z: r('lula') });
  assert.deepEqual(res.porArea, [
    { area: 'X', lula: 1, flavio: 0 },
    { area: 'Y', lula: 0, flavio: 2 },
  ]);
});
