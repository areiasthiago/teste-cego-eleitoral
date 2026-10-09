import { calcular } from './pontuacao.js?v=0.48';
import { registrar } from './contagem.js?v=0.48';
import { compartilhar } from './compartilhar.js?v=0.48';
import { REINICIAR_AO_RECARREGAR } from './config.js?v=0.48';

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

// Faixa horizontal com encaixe; as setas e o contador servem a quem não desliza.
function carrossel(rotulo, slides) {
  const trilho = el('div', { class: 'trilho', tabindex: '0', role: 'group', 'aria-label': rotulo }, slides);
  const contador = el('span', { class: 'contador', 'aria-live': 'polite' }, `1/${slides.length}`);
  const passo = () => trilho.scrollWidth / slides.length;
  const ir = (direcao) => trilho.scrollBy({ left: direcao * passo(), behavior: 'smooth' });
  trilho.addEventListener('scroll', () => {
    const atual = Math.min(slides.length, Math.round(trilho.scrollLeft / passo()) + 1);
    contador.textContent = `${atual}/${slides.length}`;
  }, { passive: true });
  return el('div', { class: 'carrossel' },
    trilho,
    el('div', { class: 'controles' },
      el('button', { class: 'seta', type: 'button', 'aria-label': 'Anterior', onclick: () => ir(-1) }, '‹'),
      contador,
      el('button', { class: 'seta', type: 'button', 'aria-label': 'Próxima', onclick: () => ir(1) }, '›')));
}

function telaInicio() {
  mostrar(
    el('section', { class: 'tela inicio' },
      el('p', { class: 'selo' }, 'Eleições 2026 · 2º turno'),
      el('h1', { tabindex: '-1' }, 'Escolha a proposta ', el('span', { class: 'destaque' }, 'sem saber de quem é')),
      el('p', { class: 'chamada' }, 'Lula ou Flávio Bolsonaro? Aqui você julga só as ideias. O nome aparece no final.'),
      el('ol', { class: 'passos trilho' },
        el('li', {}, 'Leia duas propostas sobre o mesmo assunto'),
        el('li', {}, 'Toque na que mais combina com você'),
        el('li', {}, 'No final, veja de quem era cada uma')),
      el('button', { class: 'botao principal', onclick: () => { estado.iniciado = true; salvar(); telaRodada(); } }, 'Começar o teste'),
      el('p', {}, `São ${rodadas.length} perguntas. Leva uns 5 minutos.`),
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

  const voltar = () => {
    delete estado.respostas[rodadas[indice - 1].id];
    salvar();
    telaRodada();
  };

  // Mostra por um instante qual cartão foi tocado antes de trocar de pergunta.
  const responder = (escolha, cartao) => {
    if (app.querySelector('.travado')) return;
    estado.respostas[rodada.id] = { escolha, peso: peso.checked ? 2 : 1 };
    salvar();
    if (!cartao) return telaRodada();
    cartao.classList.add('escolhido');
    cartao.parentElement.classList.add('travado');
    setTimeout(telaRodada, 260);
  };

  const cartao = (i) => el('button', { class: `cartao ${'ab'[i]}`, onclick: (e) => responder(opcoes[i].candidato, e.currentTarget) },
    el('span', { class: 'letra' }, `Proposta ${'AB'[i]}`),
    el('span', { class: 'texto' }, opcoes[i].texto));

  mostrar(
    el('section', { class: 'tela rodada' },
      el('div', { class: 'andamento' },
        el('span', {}, `${indice + 1}/${rodadas.length}`),
        el('div', { class: 'progresso', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(rodadas.length), 'aria-valuenow': String(indice), 'aria-label': 'Progresso' },
          el('span', { style: `width:${(100 * (indice + 1)) / rodadas.length}%` }))),
      el('p', { class: 'selo' }, rodada.tema),
      el('h2', { tabindex: '-1' }, rodada.pergunta),
      el('div', { class: 'cartoes' },
        cartao(0),
        el('span', { class: 'ou', 'aria-hidden': 'true' }, 'ou'),
        cartao(1)),
    ),
    // Fora da <section>: a animação de entrada dela prenderia um elemento fixo.
    el('nav', { class: 'acoes', 'aria-label': 'Outras opções' },
      el('div', { class: 'acoes-dentro' },
        el('button', { class: 'acao', type: 'button', onclick: voltar, disabled: indice === 0 }, el('b', {}, '← Voltar'), el('small', {}, 'pergunta anterior')),
        el('button', { class: 'acao', type: 'button', onclick: () => responder(null) }, el('b', {}, 'Tanto faz'), el('small', {}, 'nenhuma das duas')),
        el('label', { class: 'acao peso', for: 'peso' }, peso, el('b', {}, 'Vale em dobro'), el('small', {}, 'assunto importante')))),
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
  const lados = ordem.map((c) => ({ id: c, nome: nome(c), pct: res.pct?.[c] ?? 0, imagem: `img/${c}-${humor(c)}.webp`, lider: res.lider === c }));

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
    carrossel('Propostas reveladas', rodadas.map((rodada) => {
      const escolha = estado.respostas[rodada.id]?.escolha;
      // Fechado, todo cartão tem a mesma altura e mostra só o começo de cada proposta.
      const expandir = el('button', { class: 'expandir', type: 'button', 'aria-expanded': 'false', onclick: () => {
        const aberta = expandir.parentElement.classList.toggle('aberta');
        expandir.setAttribute('aria-expanded', String(aberta));
        expandir.textContent = aberta ? 'Mostrar menos' : 'Ler tudo e ver as fontes';
      } }, 'Ler tudo e ver as fontes');
      return el('article', { class: 'revelada' },
        el('p', { class: 'selo' }, rodada.tema),
        el('p', { class: 'pergunta' }, rodada.pergunta),
        el('div', { class: 'corpo' }, rodada.opcoes.map((opcao) => el('div', { class: `proposta ${opcao.candidato === escolha ? 'escolhida' : ''}` },
          el('h4', {}, nome(opcao.candidato), opcao.candidato === escolha && el('span', { class: 'sua' }, 'sua escolha')),
          el('p', {}, opcao.texto),
          el('details', {}, el('summary', {}, 'Ver trecho original e fonte'),
            el('ul', { class: 'fontes' }, opcao.fontes.map((f) => fonte(opcao.candidato, f)))),
          opcao.contexto && el('aside', { class: 'contexto' },
            el('strong', {}, 'Contexto'),
            el('p', {}, opcao.contexto.texto),
            el('p', {}, opcao.contexto.links.flatMap((l, i) => [i > 0 && ' · ', el('a', { href: l.url, target: '_blank', rel: 'noopener noreferrer' }, l.rotulo)])))))),
        expandir);
    })));

  mostrar(
    el('section', { class: 'tela resultado' },
      el('p', { class: 'selo' }, 'Seu resultado'),
      el('h1', { tabindex: '-1' }, titulo),
      res.pct && res.poucas && el('p', { class: 'aviso' }, `Você escolheu um lado em só ${res.respondidas} rodada${res.respondidas === 1 ? '' : 's'}; o percentual diz pouco.`),
      !res.pct && el('p', {}, 'Sem escolhas não há percentual, mas você pode ver abaixo de quem era cada proposta.'),
      placar,
      res.pct && el('div', { class: 'barra', 'aria-hidden': 'true' }, lados.map((lado) => el('span', { style: `width:${lado.pct}%` }))),
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
  dados = await (await fetch('data/rodadas.json?v=0.48')).json();
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
