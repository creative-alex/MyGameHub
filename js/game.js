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

    const addToListButton = document.querySelector('.add-to-list');
    const addToFavoritesButton = document.querySelector('.add-to-favorites');

    // Evento para "Add to List"
    addToListButton.addEventListener('click', async () => {
      try {
        const response = await fetch('/add-to-list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });

        const result = await response.json();
        if (response.ok) {
          alert(result.message);
        } else {
          alert(result.message || 'Erro ao adicionar à lista.');
        }
      } catch (error) {
        console.error('Erro:', error);
        alert('Ocorreu um erro ao processar sua solicitação.');
      }
    });

    // Evento para "Add to Favorites"
    addToFavoritesButton.addEventListener('click', async () => {
      try {
        const response = await fetch('/add-to-favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });

        const result = await response.json();
        if (response.ok) {
          alert(result.message);
        } else {
          alert(result.message || 'Erro ao adicionar aos favoritos.');
        }
      } catch (error) {
        console.error('Erro:', error);
        alert('Ocorreu um erro ao processar sua solicitação.');
      }
    });
  });
  
  addToListButton.addEventListener('click', async () => {
    const gameId = addToListButton.getAttribute('data-game-id');
    const response = await fetch('/add-to-list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, gameId }),
    });
    // Resto do código...
  });
  