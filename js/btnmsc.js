

// Obtém o iframe do YouTube
const iframe = document.getElementById('youtube-iframe');

// Cria um objeto da API do YouTube Iframe
const player = new YT.Player(iframe, {
  events: {
    'onReady': onPlayerReady,
  },
});

// Função chamada quando o player está pronto
function onPlayerReady(event) {
  // Ativa o som do vídeo
  event.target.unMute();
}

// Carrega a API do YouTube Iframe
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


