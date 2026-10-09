// Endereço que aparece na imagem e no texto de compartilhamento: o domínio próprio do site.
export const SITE = 'testecego.online';

// Contagem anônima agregada (Supabase). Enquanto estiver vazio, nada é enviado.
// A chave publicável é pública por natureza: só consegue chamar a função registrar().
export const CONTAGEM = {
  url: 'https://pkymzjedzhfmgyuwhmdi.supabase.co',
  chave: 'sb_publishable_WHaRKW6IwIHCMQcjKZaqAw_dhQ7-jst',
};

// true só em fase de testes: recarregar a página recomeça o quiz.
// Em produção fica false, e o resultado fica salvo no aparelho.
export const REINICIAR_AO_RECARREGAR = false;

// false só em fase de testes: não envia nada para a contagem.
export const ENVIAR_CONTAGEM = true;
