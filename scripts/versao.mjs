// Troca o número da versão no selo ao lado da logo e nos endereços de CSS, JS e dados,
// para o navegador não misturar arquivos novos com antigos em cache.
// Uso: node scripts/versao.mjs 0.3
import { readFileSync, writeFileSync } from 'node:fs';

const versao = process.argv[2];
if (!/^\d+\.\d+$/.test(versao ?? '')) {
  console.error('Uso: node scripts/versao.mjs 0.3');
  process.exit(1);
}
const raiz = new URL('..', import.meta.url);
for (const arquivo of ['index.html', 'sobre.html', 'js/app.js', 'js/contagem.js', 'js/compartilhar.js']) {
  const caminho = new URL(arquivo, raiz);
  const texto = readFileSync(caminho, 'utf8')
    .replace(/\?v=\d+\.\d+/g, `?v=${versao}`)
    .replace(/(<span class="versao">)v\d+\.\d+/, `$1v${versao}`);
  writeFileSync(caminho, texto);
}
console.log(`versão ${versao}`);
