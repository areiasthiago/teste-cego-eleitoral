import { CONTAGEM, ENVIAR_CONTAGEM } from './config.js?v=1.0';

// Envia só pares (rodada, lado escolhido). Sem identificador, sem percentual
// individual. Falhar aqui nunca pode atrapalhar o quiz.
export async function registrar(rodadas, respostas) {
  if (!ENVIAR_CONTAGEM || !CONTAGEM.url || !CONTAGEM.chave) return false;
  const escolhas = rodadas
    .filter((rodada) => respostas[rodada.id])
    .map((rodada) => ({ rodada: rodada.id, candidato: respostas[rodada.id].escolha ?? 'nenhum' }));
  try {
    const resposta = await fetch(`${CONTAGEM.url}/rest/v1/rpc/registrar`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: CONTAGEM.chave,
        authorization: `Bearer ${CONTAGEM.chave}`,
      },
      body: JSON.stringify({ escolhas }),
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    return resposta.ok;
  } catch {
    return false;
  }
}
