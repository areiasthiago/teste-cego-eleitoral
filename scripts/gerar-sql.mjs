// Gera sql/contagem.sql a partir de data/rodadas.json.
// Uso: node scripts/gerar-sql.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const raiz = new URL('..', import.meta.url);
const { rodadas } = JSON.parse(readFileSync(new URL('data/rodadas.json', raiz), 'utf8'));

const linhas = rodadas
  .flatMap((r) => ['lula', 'flavio', 'nenhum'].map((c) => `  ('${r.id}', '${c}')`))
  .concat("  ('_concluidos', '-')")
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
   where c.rodada = x.rodada and c.candidato = x.candidato and c.rodada <> '_concluidos';

  update contagem set total = total + 1 where rodada = '_concluidos';
end;
$$;

revoke all on function public.registrar(jsonb) from public;
grant execute on function public.registrar(jsonb) to anon;
`;

writeFileSync(new URL('sql/contagem.sql', raiz), sql);
console.log(`sql/contagem.sql gerado com ${rodadas.length} rodadas.`);
