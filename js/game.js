document.addEventListener('DOMContentLoaded', () => {
// Seleciona todas as classes 'similar-game'
const similarGames = document.querySelectorAll('.similar-game');
const addToListButtons = document.querySelectorAll('.btn.add-to-list');
const addToFavoritesButtons = document.querySelectorAll('.btn.add-to-favorites');
  
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

 // Evento para o botão "Add to List"
 addToListButtons.forEach(button => {
  button.addEventListener('click', async () => {
    const gameId = button.getAttribute('data-game-id');

    try {
      const response = await fetch('/add-to-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
      });

      const result = await response.json();
      if (result.success) {
        alert('Jogo adicionado à lista!');
      } else {
        alert('Erro ao adicionar o jogo à lista.');
      }
    } catch (error) {
      console.error('Erro ao adicionar à lista:', error);
    }
  });
});

// Evento para o botão "Add to Favorites"
addToFavoritesButtons.forEach(button => {
  button.addEventListener('click', async () => {
    const gameId = button.getAttribute('data-game-id');

    try {
      const response = await fetch('/add-to-favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
      });

      const result = await response.json();
      if (result.success) {
        alert('Jogo adicionado aos favoritos!');
      } else {
        alert('Erro ao adicionar o jogo aos favoritos.');
      }
    } catch (error) {
      console.error('Erro ao adicionar aos favoritos:', error);
    }
  });
});

});


function fetchByCategory(gameId) {
  window.location.href = `/game-details/${gameId}`;
}






