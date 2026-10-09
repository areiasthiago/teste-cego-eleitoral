-- Gerado por scripts/gerar-sql.mjs. Rode no SQL Editor do Supabase.
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
  ('crime-organizado', 'lula'),
  ('crime-organizado', 'flavio'),
  ('crime-organizado', 'nenhum'),
  ('presidios', 'lula'),
  ('presidios', 'flavio'),
  ('presidios', 'nenhum'),
  ('escala-6x1', 'lula'),
  ('escala-6x1', 'flavio'),
  ('escala-6x1', 'nenhum'),
  ('salario-minimo', 'lula'),
  ('salario-minimo', 'flavio'),
  ('salario-minimo', 'nenhum'),
  ('aplicativos', 'lula'),
  ('aplicativos', 'flavio'),
  ('aplicativos', 'nenhum'),
  ('programas-sociais', 'lula'),
  ('programas-sociais', 'flavio'),
  ('programas-sociais', 'nenhum'),
  ('impostos', 'lula'),
  ('impostos', 'flavio'),
  ('impostos', 'nenhum'),
  ('contas-publicas', 'lula'),
  ('contas-publicas', 'flavio'),
  ('contas-publicas', 'nenhum'),
  ('estatais', 'lula'),
  ('estatais', 'flavio'),
  ('estatais', 'nenhum'),
  ('redes-sociais', 'lula'),
  ('redes-sociais', 'flavio'),
  ('redes-sociais', 'nenhum'),
  ('stf', 'lula'),
  ('stf', 'flavio'),
  ('stf', 'nenhum'),
  ('educacao', 'lula'),
  ('educacao', 'flavio'),
  ('educacao', 'nenhum'),
  ('desmatamento', 'lula'),
  ('desmatamento', 'flavio'),
  ('desmatamento', 'nenhum'),
  ('terra', 'lula'),
  ('terra', 'flavio'),
  ('terra', 'nenhum'),
  ('terras-indigenas', 'lula'),
  ('terras-indigenas', 'flavio'),
  ('terras-indigenas', 'nenhum'),
  ('politica-externa', 'lula'),
  ('politica-externa', 'flavio'),
  ('politica-externa', 'nenhum'),
  ('bets', 'lula'),
  ('bets', 'flavio'),
  ('bets', 'nenhum'),
  ('terras-raras', 'lula'),
  ('terras-raras', 'flavio'),
  ('terras-raras', 'nenhum'),
  ('saude', 'lula'),
  ('saude', 'flavio'),
  ('saude', 'nenhum'),
  ('armas', 'lula'),
  ('armas', 'flavio'),
  ('armas', 'nenhum'),
  ('_concluidos', '-')
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
