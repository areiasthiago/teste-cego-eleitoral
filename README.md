# Teste cego das eleições 2026

Quiz estático que compara, às cegas, propostas dos dois candidatos do 2º turno presidencial. Sem build e sem dependências: HTML, CSS e JS puros, servidos pelo GitHub Pages.

## Rodar localmente

```
python -m http.server 8000
```

## Conteúdo

As rodadas ficam em `data/rodadas.json`. Cada opção tem ao menos uma fonte: trecho literal do plano de governo com a página, ou declaração do candidato à imprensa com link.

```
bash scripts/extrair.sh        # refaz data/fontes/*.txt a partir dos PDFs (precisa de pdftotext)
npm run validar                # confere citações contra os PDFs; adicione -- --links para testar os links
npm test                       # testes da pontuação
npm run sql                    # regenera sql/contagem.sql depois de mudar as rodadas
```

## Contagem anônima

Opcional. Rode `sql/contagem.sql` no SQL Editor de um projeto Supabase e preencha `url` e `chave` (anon) em `js/config.js`. A tabela guarda só totais por rodada e lado, e não é legível com a chave pública. Os números não devem ser divulgados antes do fim da votação.
