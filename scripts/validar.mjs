// Confere data/rodadas.json: estrutura, citações dos planos contra o texto
// extraído dos PDFs e fontes de imprensa contra a lista de veículos aceitos.
// Uso: node scripts/validar.mjs [--links]
import { readFileSync } from 'node:fs';

const raiz = new URL('..', import.meta.url);
const ler = (caminho) => readFileSync(new URL(caminho, raiz), 'utf8');

const VEICULOS = [
  'folha.uol.com.br', 'estadao.com.br', 'oglobo.globo.com', 'g1.globo.com', 'uol.com.br',
  'valor.globo.com', 'cnnbrasil.com.br', 'bbc.com', 'poder360.com.br', 'agenciabrasil.ebc.com.br',
  'reuters.com', 'jota.info', 'nexojornal.com.br', 'piaui.folha.uol.com.br', 'sbtnews.sbt.com.br',
  'congressoemfoco.com.br', 'terra.com.br', 'correiobraziliense.com.br', 'metropoles.com',
  'diariodonordeste.verdesmares.com.br', 'em.com.br', 'jornaldebrasilia.com.br',
];

const AVISO_FORA_DO_PLANO = 'Apesar de não constar no plano oficial';
const aceito = (url) => {
  const host = new URL(url).hostname.replace(/^www./, '');
  return VEICULOS.some((v) => host === v || host.endsWith(`.${v}`));
};

const normalizar = (s) => s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

const { candidatos, rodadas } = JSON.parse(ler('data/rodadas.json'));
const paginas = Object.fromEntries(
  Object.keys(candidatos).map((c) => [c, ler(`data/fontes/${c}.txt`).split('\f').map(normalizar)]),
);

const erros = [];
const avisos = [];
const ids = new Set();
const links = [];

for (const r of rodadas) {
  const onde = `[${r.id}]`;
  if (!/^[a-z0-9-]{1,40}$/.test(r.id ?? '')) erros.push(`${onde} id inválido`);
  if (ids.has(r.id)) erros.push(`${onde} id repetido`);
  ids.add(r.id);
  for (const campo of ['area', 'tema', 'pergunta']) if (!r[campo]) erros.push(`${onde} falta ${campo}`);

  const lados = (r.opcoes ?? []).map((o) => o.candidato).sort().join(',');
  if (lados !== Object.keys(candidatos).sort().join(',')) {
    erros.push(`${onde} precisa de exatamente uma opção por candidato`);
    continue;
  }

  const [a, b] = r.opcoes.map((o) => o.texto.length);
  if (Math.max(a, b) / Math.min(a, b) > 1.5) avisos.push(`${onde} cartões com tamanhos desiguais (${a} x ${b})`);

  for (const o of r.opcoes) {
    const quem = `${onde} ${o.candidato}`;
    if (!o.fontes?.length) erros.push(`${quem}: sem fonte`);
    // Posição que vem de declaração, e não do plano, tem de avisar isso no próprio cartão.
    const foraDoPlano = o.fontes?.[0]?.tipo === 'imprensa';
    if (foraDoPlano !== o.texto.includes(AVISO_FORA_DO_PLANO)) erros.push(`${quem}: aviso "${AVISO_FORA_DO_PLANO}" ${foraDoPlano ? 'faltando' : 'sobrando'}`);
    if (o.contexto) {
      if (!o.contexto.texto || !o.contexto.links?.length) erros.push(`${quem}: contexto sem texto ou sem link`);
      for (const l of o.contexto.links ?? []) {
        if (!aceito(l.url)) erros.push(`${quem}: link de contexto fora da lista (${l.url})`);
        links.push({ quem, url: l.url });
      }
    }
    // Palavras que denunciam quem está no governo ou na oposição quebram o teste cego.
    const pista = o.texto.match(/(?<!\p{L})(mant[eé]\p{L}*|seguir|segue|seguindo|continu\p{L}*|retom\p{L}*|reaproxim\p{L}*|rever|revis\p{L}*|voltar|volte|atual|atuais|recentes?|hoje|já)(?!\p{L})/iu);
    if (pista) erros.push(`${quem}: o cartão dá pista de situação/oposição ("${pista[0]}")`);
    for (const nome of Object.values(candidatos).flatMap((c) => c.nome.split(' '))) {
      if (o.texto.includes(nome)) erros.push(`${quem}: o cartão cita "${nome}"`);
    }
    for (const f of o.fontes ?? []) {
      if (f.tipo === 'plano') {
        // A citação pode atravessar a quebra de página.
        const texto = (paginas[o.candidato][f.pagina - 1] ?? '') + (paginas[o.candidato][f.pagina] ?? '');
        const alvo = normalizar(f.citacao);
        if (!paginas[o.candidato][f.pagina - 1]?.includes(alvo.slice(0, 40)) || !texto.includes(alvo)) {
          erros.push(`${quem}: citação não encontrada na pág. ${f.pagina}: "${f.citacao.slice(0, 60)}…"`);
        }
      } else if (f.tipo === 'imprensa') {
        for (const campo of ['veiculo', 'data', 'url', 'citacao']) if (!f[campo]) erros.push(`${quem}: fonte de imprensa sem ${campo}`);
        const host = new URL(f.url).hostname.replace(/^www\./, '');
        if (!VEICULOS.some((v) => host === v || host.endsWith(`.${v}`))) erros.push(`${quem}: veículo fora da lista (${host})`);
        if (!/^2026-\d\d-\d\d$/.test(f.data ?? '')) erros.push(`${quem}: data fora de 2026 (${f.data})`);
        links.push({ quem, url: f.url });
      } else {
        erros.push(`${quem}: tipo de fonte desconhecido (${f.tipo})`);
      }
    }
  }
}

if (process.argv.includes('--links')) {
  for (const { quem, url } of links) {
    try {
      const resposta = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, redirect: 'follow' });
      if (!resposta.ok) erros.push(`${quem}: link respondeu ${resposta.status} (${url})`);
    } catch (e) {
      erros.push(`${quem}: link inacessível (${url}): ${e.message}`);
    }
  }
}

for (const a of avisos) console.warn(`aviso: ${a}`);
for (const e of erros) console.error(`ERRO: ${e}`);
console.log(`${rodadas.length} rodadas, ${links.length} fontes de imprensa, ${erros.length} erro(s), ${avisos.length} aviso(s).`);
process.exit(erros.length ? 1 : 0);
