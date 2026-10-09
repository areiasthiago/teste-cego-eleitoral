// Cálculo puro da aderência. respostas: { [idRodada]: { escolha: 'lula' | 'flavio' | null, peso: 1 | 2 } }
export const MINIMO_RESPONDIDAS = 5;

export function calcular(rodadas, respostas) {
  const pontos = { lula: 0, flavio: 0 };
  const areas = new Map();
  let respondidas = 0;

  for (const rodada of rodadas) {
    const resposta = respostas[rodada.id];
    if (!resposta?.escolha) continue;
    const peso = resposta.peso === 2 ? 2 : 1;
    respondidas += 1;
    pontos[resposta.escolha] += peso;
    if (!areas.has(rodada.area)) areas.set(rodada.area, { area: rodada.area, lula: 0, flavio: 0 });
    areas.get(rodada.area)[resposta.escolha] += peso;
  }

  const total = pontos.lula + pontos.flavio;
  let pct = null;
  if (total > 0) {
    const lula = Math.round((100 * pontos.lula) / total);
    pct = { lula, flavio: 100 - lula };
  }

  let lider = null;
  if (pontos.lula > pontos.flavio) lider = 'lula';
  if (pontos.flavio > pontos.lula) lider = 'flavio';

  return {
    pontos,
    pct,
    lider,
    respondidas,
    poucas: respondidas < MINIMO_RESPONDIDAS,
    porArea: [...areas.values()],
  };
}
