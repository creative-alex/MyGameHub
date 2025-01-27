document.addEventListener('DOMContentLoaded', () => {
// Seleciona todas as classes 'similar-game'
const similarGames = document.querySelectorAll('.similar-game');
  
// Adiciona os ouvintes de evento
similarGames.forEach((similarGame) => {
  similarGame.addEventListener('mouseenter', () => {
    // Seleciona apenas os elementos dentro do similar-game atual
    const title = similarGame.querySelector('.similar-title');
    const description = similarGame.querySelector('.similar-description');

    if (title) title.classList.remove('hidden');
    if (description) description.classList.remove('hidden');
  });

  similarGame.addEventListener('mouseleave', () => {
    // Seleciona apenas os elementos dentro do similar-game atual
    const title = similarGame.querySelector('.similar-title');
    const description = similarGame.querySelector('.similar-description');

    if (title) title.classList.add('hidden');
    if (description) description.classList.add('hidden');
  });
 });
});
function fetchByCategory(gameId) {
  window.location.href = `/game-details/${gameId}`;
}

// Função para adicionar o jogo à lista
async function addToList(gameId) {
  try {
    const response = await fetch('/user/add-to-list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`, // Token do usuário
      },
      body: JSON.stringify({ gameId }),
    });

    const data = await response.json();
    alert(data.message || 'Jogo adicionado à lista!');
  } catch (error) {
    alert('Erro ao adicionar à lista.');
  }
}

// Função para adicionar o jogo aos favoritos
async function addToFavorites(gameId) {
  try {
    const response = await fetch('/user/add-to-favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`, // Token do usuário
      },
      body: JSON.stringify({ gameId }),
    });

    const data = await response.json();
    alert(data.message || 'Jogo adicionado aos favoritos!');
  } catch (error) {
    alert('Erro ao adicionar aos favoritos.');
  }
}




