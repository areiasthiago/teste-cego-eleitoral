// Gera sql/contagem.sql a partir de data/rodadas.json.
// Uso: node scripts/gerar-sql.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const raiz = new URL('..', import.meta.url);
const { rodadas } = JSON.parse(readFileSync(new URL('data/rodadas.json', raiz), 'utf8'));

// Canais de chegada contados no funil por origem (js/contagem.js usa os mesmos códigos).
const CANAIS = ['wa','wam','was','tw','ig','fb','tt','li','tg','th','bs','yt','em','busca','c','direto','outro'];

const linhas = rodadas
  .flatMap((r) => ['lula', 'flavio', 'nenhum'].map((c) => `  ('${r.id}', '${c}')`))
  .concat("  ('_concluidos', '-')", "  ('_abriu', '-')", "  ('_comecou', '-')", "  ('_concluiu', '-')", "  ('_resultado', 'lula')", "  ('_resultado', 'flavio')", "  ('_resultado', 'empate')")
  .concat(['abriu', 'comecou', 'concluiu'].flatMap((e) => CANAIS.map((c) => `  ('_origem_${e}', '${c}')`)))
  .join(',\n');

const sql = `-- Gerado por scripts/gerar-sql.mjs. Rode no SQL Editor do Supabase.
-- Só contadores agregados: nenhuma linha por pessoa, nenhum identificador.

create table if not exists public.contagem (
  rodada text not null,
  candidato text not null,
  total bigint not null default 0,
  primary key (rodada, candidato)
);

-- RLS ligado e sem nenhuma policy: a chave pública não lê nem escreve na tabela.
alter table public.contagem enable row level security;
revoke all on public.contagem from anon, authenticated;

-- Só existem as combinações válidas; registrar() nunca cria linha nova.
insert into public.contagem (rodada, candidato) values
${linhas}
on conflict do nothing;

create or replace function public.registrar(escolhas jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if jsonb_typeof(escolhas) <> 'array' or jsonb_array_length(escolhas) > 40 then
    return;
  end if;

  update contagem c
     set total = c.total + 1
    from (
      select distinct e->>'rodada' as rodada, e->>'candidato' as candidato
        from jsonb_array_elements(escolhas) e
    ) x
   where c.rodada = x.rodada and c.candidato = x.candidato and left(c.rodada, 1) <> '_';

  update contagem set total = total + 1 where rodada = '_concluidos';
end;
$$;

revoke all on function public.registrar(jsonb) from public;
grant execute on function public.registrar(jsonb) to anon;

-- Funil de engajamento: abriu o site, começou o teste, concluiu. Também só totais.
create or replace function public.marcar(evento text)
returns void
language sql
security definer
set search_path = public
as $$
  update contagem set total = total + 1
   where rodada = '_' || evento and evento in ('abriu', 'comecou', 'concluiu');
$$;

revoke all on function public.marcar(text) from public;
grant execute on function public.marcar(text) to anon;

-- Quem ficou na frente em cada teste concluído. Só três totais: lula, flavio e empate.
create or replace function public.resultado(lider text)
returns void
language sql
security definer
set search_path = public
as $$
  update contagem set total = total + 1
   where rodada = '_resultado' and candidato = lider and lider in ('lula', 'flavio', 'empate');
$$;

revoke all on function public.resultado(text) from public;
grant execute on function public.resultado(text) to anon;

-- Funil com canal de chegada: soma na etapa e, se o canal for conhecido, na etapa daquele canal.
create or replace function public.marcar_origem(evento text, canal text)
returns void
language sql
security definer
set search_path = public
as $$
  update contagem set total = total + 1
   where evento in ('abriu', 'comecou', 'concluiu')
     and (rodada = '_' || evento or (rodada = '_origem_' || evento and candidato = canal));
$$;

revoke all on function public.marcar_origem(text, text) from public;
grant execute on function public.marcar_origem(text, text) to anon;
`;

writeFileSync(new URL('sql/contagem.sql', raiz), sql);
console.log(`sql/contagem.sql gerado com ${rodadas.length} rodadas.`);
