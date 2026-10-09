import { SITE } from './config.js';

const L = 1080;
const A = 1350;

function carregar(src) {
  return new Promise((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = erro;
    img.src = src;
  });
}

function retrato(ctx, img, cx, cy, raio) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.clip();
  ctx.drawImage(img, cx - raio, cy - raio, raio * 2, raio * 2);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, Math.PI * 2);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#17132b';
  ctx.stroke();
}

// lados: [{ nome, pct, imagem }] na ordem em que aparecem na tela.
export async function gerarImagem(lados) {
  const canvas = document.createElement('canvas');
  canvas.width = L;
  canvas.height = A;
  const ctx = canvas.getContext('2d');
  const fonte = (peso, tamanho) => `${peso} ${tamanho}px "Bricolage Grotesque", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;

  ctx.fillStyle = '#f6f1e7';
  ctx.fillRect(0, 0, L, A);
  ctx.textAlign = 'center';

  ctx.fillStyle = '#6d3bf5';
  ctx.font = fonte(700, 40);
  ctx.fillText('TESTE CEGO · ELEIÇÕES 2026', L / 2, 130);
  ctx.fillStyle = '#17132b';
  ctx.font = fonte(800, 68);
  ctx.fillText('Escolhi propostas sem', L / 2, 240);
  ctx.fillText('saber de quem eram', L / 2, 322);

  const imagens = await Promise.all(lados.map((lado) => carregar(lado.imagem)));
  lados.forEach((lado, i) => {
    const cx = i === 0 ? 290 : L - 290;
    retrato(ctx, imagens[i], cx, 620, 200);
    ctx.fillStyle = '#17132b';
    ctx.font = fonte(800, 150);
    ctx.fillText(`${lado.pct}%`, cx, 1000);
    ctx.font = fonte(600, 46);
    ctx.fillText(lado.nome, cx, 1070);
  });

  ctx.fillStyle = '#6d3bf5';
  ctx.font = fonte(700, 44);
  ctx.fillText(`Faça o seu: ${SITE}`, L / 2, 1215);
  ctx.fillStyle = '#5d5873';
  ctx.font = fonte(400, 28);
  ctx.fillText('Ilustrações geradas por inteligência artificial · Não é pesquisa eleitoral', L / 2, 1285);

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
