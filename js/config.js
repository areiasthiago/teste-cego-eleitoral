// Endereço curto (bit.ly) que aparece na imagem e no texto de compartilhamento.
// Redireciona para areiasthiago.github.io/teste-cego-eleitoral.
export const SITE = 'bit.ly/teste-cego';

// Contagem anônima agregada (Supabase). Enquanto estiver vazio, nada é enviado.
// A chave publicável é pública por natureza: só consegue chamar a função registrar().
export const CONTAGEM = {
  url: 'https://pkymzjedzhfmgyuwhmdi.supabase.co',
  chave: 'sb_publishable_WHaRKW6IwIHCMQcjKZaqAw_dhQ7-jst',
};

// Só para a fase de testes: recarregar a página recomeça o quiz.
// Antes de divulgar, voltar para false (o resultado passa a ficar salvo no aparelho).
export const REINICIAR_AO_RECARREGAR = true;

// Só para a fase de testes: false não envia nada para a contagem.
// Antes de divulgar, voltar para true.
export const ENVIAR_CONTAGEM = false;
