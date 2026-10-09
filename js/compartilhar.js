import { SITE } from './config.js?v=0.16';

// Formato de story (9:16), com respiro em cima e embaixo para a interface do aplicativo.
const L = 1080;
const A = 1920;
const COR = {
  fundo: '#f5f5f6',
  papel: '#ffffff',
  tinta: '#1c1a1f',
  suave: '#5d5b63',
  grafite: '#2b2832',
  roxo: '#7c4dff',
  roxoClaro: '#e9e1ff',
  marcaTexto: '#d3c4ff',
};
const TRACO = 6;

function carregar(src) {
  return new Promise((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = erro;
    img.src = src;
  });
}

const fonte = (peso, tamanho) => `${peso} ${tamanho}px "Bricolage Grotesque", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;

// Bloco com traço grosso e, opcionalmente, sombra dura, como os cartões do site.
function bloco(ctx, x, y, w, h, raio, cor, sombra = 0) {
  if (sombra) {
    ctx.fillStyle = COR.tinta;
    ctx.beginPath();
    ctx.roundRect(x + sombra, y + sombra, w, h, raio);
    ctx.fill();
  }
  ctx.fillStyle = cor;
  ctx.strokeStyle = COR.tinta;
  ctx.lineWidth = TRACO;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, raio);
  ctx.fill();
  ctx.stroke();
}

// Escreve o texto no maior tamanho que couber na largura.
function textoAjustado(ctx, texto, x, y, peso, tamanho, largura) {
  let t = tamanho;
  ctx.font = fonte(peso, t);
  while (ctx.measureText(texto).width > largura && t > 16) {
    t -= 2;
    ctx.font = fonte(peso, t);
  }
  ctx.fillText(texto, x, y);
}

function retrato(ctx, img, cx, cy, raio) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, Math.PI * 2);
  ctx.fillStyle = COR.papel;
  ctx.fill();
  ctx.clip();
  ctx.drawImage(img, cx - raio, cy - raio, raio * 2, raio * 2);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, Math.PI * 2);
  ctx.lineWidth = TRACO;
  ctx.strokeStyle = COR.tinta;
  ctx.stroke();
}

// lados: [{ nome, pct, imagem, lider }] na ordem em que aparecem na tela.
export async function gerarImagem(lados) {
  const [imagens] = await Promise.all([
    Promise.all(lados.map((lado) => carregar(lado.imagem))),
    document.fonts?.load(fonte(800, 100)).catch(() => {}),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = L;
  canvas.height = A;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = COR.fundo;
  ctx.fillRect(0, 0, L, A);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Selo
  ctx.font = fonte(800, 34);
  const selo = 'TESTE CEGO · ELEIÇÕES 2026';
  const larguraSelo = ctx.measureText(selo).width + 72;
  bloco(ctx, (L - larguraSelo) / 2, 236, larguraSelo, 76, 38, COR.roxo);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(selo, L / 2, 286);

  // Título, com marca-texto na segunda linha
  ctx.font = fonte(800, 86);
  const linha2 = 'sem saber de quem eram';
  const larguraLinha2 = ctx.measureText(linha2).width;
  ctx.fillStyle = COR.marcaTexto;
  ctx.fillRect((L - larguraLinha2) / 2 - 10, 508, larguraLinha2 + 20, 46);
  ctx.fillStyle = COR.tinta;
  ctx.fillText('Escolhi propostas', L / 2, 440);
  ctx.fillText(linha2, L / 2, 540);

  // Cartões dos candidatos
  const largura = 470;
  const altura = 650;
  lados.forEach((lado, i) => {
    const x = i === 0 ? 50 : L - 50 - largura;
    const y = lado.lider ? 640 : 664;
    bloco(ctx, x, y, largura, altura, 44, lado.lider ? COR.roxoClaro : COR.papel, lado.lider ? 14 : 0);
    const cx = x + largura / 2;
    retrato(ctx, imagens[i], cx, y + 200, 158);
    ctx.fillStyle = COR.tinta;
    ctx.font = fonte(800, 156);
    ctx.fillText(`${lado.pct}%`, cx, y + 510);
    textoAjustado(ctx, lado.nome, cx, y + 590, 700, 46, largura - 48);
  });

  // Barra dividida
  const barra = { x: 50, y: 1372, w: L - 100, h: 48 };
  bloco(ctx, barra.x, barra.y, barra.w, barra.h, 24, COR.grafite);
  const parte = Math.max(0, Math.min(1, lados[0].pct / 100)) * barra.w;
  if (parte > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(barra.x, barra.y, barra.w, barra.h, 24);
    ctx.clip();
    ctx.fillStyle = COR.roxo;
    ctx.fillRect(barra.x, barra.y, parte, barra.h);
    ctx.restore();
    ctx.beginPath();
    ctx.roundRect(barra.x, barra.y, barra.w, barra.h, 24);
    ctx.stroke();
  }

  // Chamada
  bloco(ctx, 50, 1480, L - 114, 124, 44, COR.roxo, 14);
  ctx.fillStyle = '#ffffff';
  ctx.font = fonte(800, 58);
  ctx.fillText('Faça o seu teste', (50 + L - 64) / 2, 1562);
  ctx.fillStyle = COR.tinta;
  textoAjustado(ctx, SITE, L / 2, 1700, 700, 46, L - 120);
  ctx.fillStyle = COR.suave;
  ctx.font = fonte(400, 27);
  ctx.fillText('Ilustrações geradas por inteligência artificial · Não é pesquisa eleitoral', L / 2, 1760);

  return new Promise((ok) => canvas.toBlob(ok, 'image/png'));
}

export async function compartilhar(lados) {
  const blob = await gerarImagem(lados);
  const arquivo = new File([blob], 'teste-cego.png', { type: 'image/png' });
  const texto = `Fiz o Teste Cego das eleições: escolhi propostas sem saber de quem eram. Faça o seu: https://${SITE}`;

  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], text: texto });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = arquivo.name;
  link.click();
  URL.revokeObjectURL(link.href);
}
