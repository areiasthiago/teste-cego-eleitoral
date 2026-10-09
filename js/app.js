import { calcular } from './pontuacao.js';
import { registrar } from './contagem.js';
import { compartilhar } from './compartilhar.js';
import { REINICIAR_AO_RECARREGAR } from './config.js';

const CHAVE = 'teste-cego:v1';
const app = document.getElementById('app');

let dados;
let rodadas; // na ordem embaralhada desta pessoa
let estado;

const el = (tag, attrs = {}, ...filhos) => {
  const no = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') no.className = v;
    else if (k.startsWith('on')) no.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) no.setAttribute(k, v === true ? '' : v);
  }
  no.append(...filhos.flat().filter((f) => f != null && f !== false));
  return no;
};

const embaralhar = (lista) => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

function lerEstado() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE));
  } catch {
    return null;
  }
}

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // Sem armazenamento (aba anônima restrita): o quiz funciona, só não persiste.
  }
}

function novoEstado() {
  return {
    ordem: embaralhar(dados.rodadas.map((r) => r.id)),
    invertida: Object.fromEntries(dados.rodadas.map((r) => [r.id, Math.random() < 0.5])),
    respostas: {},
    iniciado: false,
    concluido: false,
    enviado: false,
  };
}

function mostrar(...nos) {
  app.replaceChildren(...nos);
  window.scrollTo(0, 0);
  app.querySelector('h1, h2')?.focus();
}

function telaInicio() {
  mostrar(
    el('section', { class: 'tela inicio' },
      el('p', { class: 'selo' }, 'Eleições 2026 · 2º turno'),
      el('h1', { tabindex: '-1' }, 'Teste cego'),
      el('p', { class: 'chamada' }, 'Você lê duas propostas sobre o mesmo tema, sem saber de quem são, e escolhe a que mais combina com você.'),
      el('p', {}, `São ${rodadas.length} rodadas, cerca de 4 minutos. No final, mostramos com qual candidato você mais concordou e de onde saiu cada proposta.`),
      el('button', { class: 'botao principal', onclick: () => { estado.iniciado = true; salvar(); telaRodada(); } }, 'Começar'),
      el('p', { class: 'aviso' },
        'Suas escolhas entram numa contagem anônima, sem identificar você. ',
        el('a', { href: 'sobre.html#privacidade' }, 'Saiba mais'), '.'),
    ),
  );
}

function telaRodada() {
  const indice = rodadas.findIndex((r) => !(r.id in estado.respostas));
  if (indice === -1) return concluir();
  const rodada = rodadas[indice];
  const opcoes = estado.invertida[rodada.id] ? [...rodada.opcoes].reverse() : rodada.opcoes;
  const peso = el('input', { type: 'checkbox', id: 'peso' });

  const responder = (escolha) => {
    estado.respostas[rodada.id] = { escolha, peso: peso.checked ? 2 : 1 };
    salvar();
    telaRodada();
  };

  mostrar(
    el('section', { class: 'tela rodada' },
      el('div', { class: 'progresso', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(rodadas.length), 'aria-valuenow': String(indice), 'aria-label': 'Progresso' },
        el('span', { style: `width:${(100 * indice) / rodadas.length}%` })),
      el('p', { class: 'selo' }, `${indice + 1} de ${rodadas.length} · ${rodada.tema}`),
      el('h2', { tabindex: '-1' }, rodada.pergunta),
      el('div', { class: 'cartoes' },
        opcoes.map((opcao, i) => el('button', { class: 'cartao', onclick: () => responder(opcao.candidato) },
          el('span', { class: 'letra', 'aria-hidden': 'true' }, 'AB'[i]),
          el('span', { class: 'texto' }, opcao.texto)))),
      el('label', { class: 'peso', for: 'peso' }, peso, ' Esse tema pesa muito pra mim (vale em dobro)'),
      el('button', { class: 'botao discreto', onclick: () => responder(null) }, 'Nenhuma das duas / tanto faz'),
    ),
  );
}

function concluir() {
  estado.concluido = true;
  salvar();
  if (!estado.enviado) {
    registrar(rodadas, estado.respostas).then((ok) => {
      if (ok) { estado.enviado = true; salvar(); }
    });
  }
  telaResultado();
}

function fonte(candidato, f) {
  if (f.tipo === 'plano') {
    return el('li', {},
      el('q', {}, f.citacao), ' ',
      el('a', { href: `${dados.candidatos[candidato].plano}#page=${f.pagina}`, target: '_blank', rel: 'noopener' }, `Plano de governo, pág. ${f.pagina}`));
  }
  const data = new Date(`${f.data}T12:00:00`).toLocaleDateString('pt-BR');
  return el('li', {},
    el('q', {}, f.citacao), ' ',
    el('a', { href: f.url, target: '_blank', rel: 'noopener noreferrer' }, `Declaração à imprensa: ${f.veiculo}, ${data}`));
}

function telaResultado() {
  const res = calcular(rodadas, estado.respostas);
  const nome = (c) => dados.candidatos[c].nome;
  const ordem = res.lider === 'flavio' ? ['flavio', 'lula'] : ['lula', 'flavio'];
  const humor = (c) => (res.lider === c ? 'alegre' : 'serio');
  const lados = ordem.map((c) => ({ id: c, nome: nome(c), pct: res.pct?.[c] ?? 0, imagem: `img/${c}-${humor(c)}.webp` }));

  let titulo = 'Deu empate';
  if (!res.pct) titulo = 'Você não escolheu nenhum lado';
  else if (res.lider) titulo = `Você concordou mais com ${nome(res.lider)}`;

  const placar = res.pct && el('div', { class: 'placar' },
    lados.map((lado) => el('figure', { class: `lado ${res.lider === lado.id ? 'lider' : ''}` },
      el('img', { src: lado.imagem, alt: `Caricatura de ${lado.nome}`, width: '512', height: '512' }),
      el('figcaption', {}, el('strong', {}, `${lado.pct}%`), el('span', {}, lado.nome)))));

  const areas = res.porArea.length > 0 && el('section', { class: 'bloco' },
    el('h3', {}, 'Por assunto'),
    el('ul', { class: 'areas' }, res.porArea.map((a) => {
      let quem = 'Empate';
      if (a.lula > a.flavio) quem = nome('lula');
      if (a.flavio > a.lula) quem = nome('flavio');
      return el('li', {}, el('span', {}, a.area), el('strong', {}, quem));
    })));

  const revelacao = el('section', { class: 'bloco' },
    el('h3', {}, 'De quem era cada proposta'),
    rodadas.map((rodada) => {
      const escolha = estado.respostas[rodada.id]?.escolha;
      return el('details', { class: 'revelada' },
        el('summary', {}, el('span', {}, rodada.tema), el('em', {}, escolha ? `Você ficou com ${nome(escolha)}` : 'Você não escolheu')),
        el('p', { class: 'pergunta' }, rodada.pergunta),
        rodada.opcoes.map((opcao) => el('div', { class: `proposta ${opcao.candidato === escolha ? 'escolhida' : ''}` },
          el('h4', {}, nome(opcao.candidato)),
          el('p', {}, opcao.texto),
          el('ul', { class: 'fontes' }, opcao.fontes.map((f) => fonte(opcao.candidato, f))))));
    }));

  mostrar(
    el('section', { class: 'tela resultado' },
      el('p', { class: 'selo' }, 'Seu resultado'),
      el('h1', { tabindex: '-1' }, titulo),
      res.pct && res.poucas && el('p', { class: 'aviso' }, `Você escolheu um lado em só ${res.respondidas} rodada${res.respondidas === 1 ? '' : 's'}; o percentual diz pouco.`),
      !res.pct && el('p', {}, 'Sem escolhas não há percentual, mas você pode ver abaixo de quem era cada proposta.'),
      placar,
      res.pct && el('p', { class: 'creditos' }, 'Ilustrações geradas por inteligência artificial.'),
      res.pct && el('button', { class: 'botao principal', onclick: () => compartilhar(lados) }, 'Compartilhar resultado'),
      el('p', { class: 'aviso' }, 'O percentual mede só as propostas deste teste, resumidas por nós. Não é pesquisa eleitoral nem recomendação de voto. ',
        el('a', { href: 'sobre.html' }, 'Como funciona'), '.'),
      areas,
      revelacao,
    ),
  );
}

async function iniciar() {
  dados = await (await fetch('data/rodadas.json')).json();
  const validos = new Set(dados.rodadas.map((r) => r.id));
  estado = REINICIAR_AO_RECARREGAR ? null : lerEstado();
  // Estado salvo de uma versão com outras rodadas: completa a ordem em vez de zerar.
  if (estado?.ordem) {
    estado.ordem = estado.ordem.filter((id) => validos.has(id));
    for (const id of validos) {
      if (!estado.ordem.includes(id)) {
        estado.ordem.push(id);
        estado.invertida[id] = Math.random() < 0.5;
      }
    }
  } else {
    estado = novoEstado();
  }
  const porId = new Map(dados.rodadas.map((r) => [r.id, r]));
  rodadas = estado.ordem.map((id) => porId.get(id));

  if (estado.concluido) telaResultado();
  else if (estado.iniciado) telaRodada();
  else telaInicio();
}

iniciar().catch(() => {
  mostrar(el('section', { class: 'tela' }, el('h1', { tabindex: '-1' }, 'Não deu para carregar'), el('p', {}, 'Confira sua conexão e recarregue a página.')));
});
