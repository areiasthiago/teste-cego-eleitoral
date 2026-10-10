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
  ('_concluidos', '-'),
  ('_abriu', '-'),
  ('_comecou', '-'),
  ('_concluiu', '-'),
  ('_resultado', 'lula'),
  ('_resultado', 'flavio'),
  ('_resultado', 'empate'),
  ('_origem_abriu', 'wa'),
  ('_origem_abriu', 'wam'),
  ('_origem_abriu', 'was'),
  ('_origem_abriu', 'tw'),
  ('_origem_abriu', 'ig'),
  ('_origem_abriu', 'fb'),
  ('_origem_abriu', 'tt'),
  ('_origem_abriu', 'li'),
  ('_origem_abriu', 'tg'),
  ('_origem_abriu', 'th'),
  ('_origem_abriu', 'bs'),
  ('_origem_abriu', 'yt'),
  ('_origem_abriu', 'em'),
  ('_origem_abriu', 'busca'),
  ('_origem_abriu', 'c'),
  ('_origem_abriu', 'direto'),
  ('_origem_abriu', 'outro'),
  ('_origem_comecou', 'wa'),
  ('_origem_comecou', 'wam'),
  ('_origem_comecou', 'was'),
  ('_origem_comecou', 'tw'),
  ('_origem_comecou', 'ig'),
  ('_origem_comecou', 'fb'),
  ('_origem_comecou', 'tt'),
  ('_origem_comecou', 'li'),
  ('_origem_comecou', 'tg'),
  ('_origem_comecou', 'th'),
  ('_origem_comecou', 'bs'),
  ('_origem_comecou', 'yt'),
  ('_origem_comecou', 'em'),
  ('_origem_comecou', 'busca'),
  ('_origem_comecou', 'c'),
  ('_origem_comecou', 'direto'),
  ('_origem_comecou', 'outro'),
  ('_origem_concluiu', 'wa'),
  ('_origem_concluiu', 'wam'),
  ('_origem_concluiu', 'was'),
  ('_origem_concluiu', 'tw'),
  ('_origem_concluiu', 'ig'),
  ('_origem_concluiu', 'fb'),
  ('_origem_concluiu', 'tt'),
  ('_origem_concluiu', 'li'),
  ('_origem_concluiu', 'tg'),
  ('_origem_concluiu', 'th'),
  ('_origem_concluiu', 'bs'),
  ('_origem_concluiu', 'yt'),
  ('_origem_concluiu', 'em'),
  ('_origem_concluiu', 'busca'),
  ('_origem_concluiu', 'c'),
  ('_origem_concluiu', 'direto'),
  ('_origem_concluiu', 'outro')
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
