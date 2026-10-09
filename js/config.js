// Endereço público do site, usado no texto e na imagem de compartilhamento.
export const SITE = 'areiasthiago.github.io/teste-cego-eleitoral';

// Contagem anônima agregada (Supabase). Enquanto estiver vazio, nada é enviado.
// A chave publicável é pública por natureza: só consegue chamar a função registrar().
export const CONTAGEM = {
  url: 'https://pkymzjedzhfmgyuwhmdi.supabase.co',
  chave: 'sb_publishable_WHaRKW6IwIHCMQcjKZaqAw_dhQ7-jst',
};

// Só para a fase de testes: recarregar a página recomeça o quiz.
// Antes de divulgar, voltar para false (o resultado passa a ficar salvo no aparelho).
export const REINICIAR_AO_RECARREGAR = true;
