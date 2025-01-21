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
  