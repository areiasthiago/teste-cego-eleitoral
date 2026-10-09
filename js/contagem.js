import { CONTAGEM, ENVIAR_CONTAGEM } from './config.js?v=1.5';

const MEDIDO = 'teste-cego:medido';

async function chamar(funcao, corpo) {
  if (!ENVIAR_CONTAGEM || !CONTAGEM.url || !CONTAGEM.chave) return false;
  try {
    const resposta = await fetch(`${CONTAGEM.url}/rest/v1/rpc/${funcao}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: CONTAGEM.chave,
        authorization: `Bearer ${CONTAGEM.chave}`,
      },
      body: JSON.stringify(corpo),
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      keepalive: true,
    });
    return resposta.ok;
  } catch {
    return false;
  }
}

// Funil anônimo: quantos aparelhos abriram, começaram e concluíram. Cada etapa conta uma
// vez por aparelho, e só entra no funil quem abriu o site depois que a medição começou.
export function marcar(evento, { novo = false } = {}) {
  try {
    const feito = JSON.parse(localStorage.getItem(MEDIDO) || '[]');
    if (feito.includes(evento)) return;
    if (evento === 'abriu' ? !novo : !feito.includes('abriu')) return;
    localStorage.setItem(MEDIDO, JSON.stringify([...feito, evento]));
    chamar('marcar', { evento });
  } catch {
    // Sem armazenamento não dá para contar uma vez só; melhor não contar.
  }
}

// Envia só pares (rodada, lado escolhido). Sem identificador, sem percentual
// individual. Falhar aqui nunca pode atrapalhar o quiz.
export async function registrar(rodadas, respostas) {
  const escolhas = rodadas
    .filter((rodada) => respostas[rodada.id])
    .map((rodada) => ({ rodada: rodada.id, candidato: respostas[rodada.id].escolha ?? 'nenhum' }));
  return chamar('registrar', { escolhas });
}
