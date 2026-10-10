import { CONTAGEM, ENVIAR_CONTAGEM } from './config.js?v=1.9';

const MEDIDO = 'teste-cego:medido';
const ORIGEM = 'teste-cego:origem';
const CANAIS = ['wa','tw','ig','fb','tt','li','tg','th','bs','yt','em','busca','c','direto','outro'];

// Por qual canal a pessoa chegou: a etiqueta do link (?o=tw) ou, sem ela, o site de onde
// o navegador diz ter vindo. Aplicativos de mensagem não informam nada: contam como 'direto'.
function canalDeChegada() {
  const etiqueta = new URLSearchParams(location.search).get('o');
  if (CANAIS.includes(etiqueta)) return etiqueta;
  let de = '';
  try { de = new URL(document.referrer).hostname.replace(/^www./, ''); } catch { return 'direto'; }
  if (!de || de === location.hostname) return 'direto';
  const mapa = [
    [/(^|.)(t.co|twitter.com|x.com)$/, 'tw'], [/(^|.)instagram.com$/, 'ig'], [/(^|.)(facebook.com|fb.com|fb.me)$/, 'fb'],
    [/(^|.)(whatsapp.com|wa.me)$/, 'wa'], [/(^|.)tiktok.com$/, 'tt'], [/(^|.)(linkedin.com|lnkd.in)$/, 'li'],
    [/(^|.)(t.me|telegram.org)$/, 'tg'], [/(^|.)threads.(net|com)$/, 'th'], [/(^|.)bsky.app$/, 'bs'],
    [/(^|.)(youtube.com|youtu.be)$/, 'yt'], [/(^|.)(google.[a-z.]+|bing.com|duckduckgo.com|yahoo.com)$/, 'busca'],
  ];
  return (mapa.find(([padrao]) => padrao.test(de)) || [null, 'outro'])[1];
}

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
    // O canal é o da primeira visita deste aparelho; quem abriu antes dessa contagem fica sem canal.
    if (evento === 'abriu') localStorage.setItem(ORIGEM, canalDeChegada());
    chamar('marcar_origem', { evento, canal: localStorage.getItem(ORIGEM) || '' });
  } catch {
    // Sem armazenamento não dá para contar uma vez só; melhor não contar.
  }
}

// Quem ficou na frente neste teste: 'lula', 'flavio' ou 'empate'. Soma em um de três totais.
export function resultado(lider) {
  return chamar('resultado', { lider });
}

// Envia só pares (rodada, lado escolhido). Sem identificador, sem percentual
// individual. Falhar aqui nunca pode atrapalhar o quiz.
export async function registrar(rodadas, respostas) {
  const escolhas = rodadas
    .filter((rodada) => respostas[rodada.id])
    .map((rodada) => ({ rodada: rodada.id, candidato: respostas[rodada.id].escolha ?? 'nenhum' }));
  return chamar('registrar', { escolhas });
}
