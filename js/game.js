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

// Recupera o token do localStorage
const token = localStorage.getItem('jwtToken');

// Verifica se o token existe
if (!token) {
  console.warn('Token JWT não encontrado no localStorage. O usuário pode não estar logado.');
}







  // Função para verificar se o token JWT está armazenado
  const isLoggedIn = () => {
    const token = localStorage.getItem('jwtToken');
    return token !== null;
  };

  // Função para obter o token JWT
  const getToken = () => localStorage.getItem('jwtToken');

  // Evento para "Add to List"
  document.querySelectorAll('.add-to-list').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!isLoggedIn()) {
        alert('Você precisa estar logado para adicionar jogos à sua lista.');
        return;
      }

      const gameId = button.getAttribute('data-game-id');
      const token = getToken();

      try {
        const response = await fetch('http://localhost:3000/add-to-list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Adiciona o token no cabeçalho
          },
          body: JSON.stringify({ gameId }),
        });

        const result = await response.json();
        if (response.ok) {
          alert(result.message || 'Jogo adicionado à lista com sucesso!');
        } else {
          alert(result.message || 'Erro ao adicionar o jogo à lista.');
        }
      } catch (error) {
        console.error('Erro:', error);
        alert('Ocorreu um erro ao processar sua solicitação.');
      }
    });
  });

  // Evento para "Add to Favorites"
  document.querySelectorAll('.add-to-favorites').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!isLoggedIn()) {
        alert('Você precisa estar logado para adicionar jogos aos favoritos.');
        return;
      }

      const gameId = button.getAttribute('data-game-id');
      const token = getToken();

      try {
        const response = await fetch('http://localhost:3000/add-to-favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Adiciona o token no cabeçalho
          },
          body: JSON.stringify({ gameId }),
        });

        const result = await response.json();
        if (response.ok) {
          alert(result.message || 'Jogo adicionado aos favoritos com sucesso!');
        } else {
          alert(result.message || 'Erro ao adicionar o jogo aos favoritos.');
        }
      } catch (error) {
        console.error('Erro:', error);
        alert('Ocorreu um erro ao processar sua solicitação.');
      }
    });
  });
});
