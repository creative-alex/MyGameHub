// Lógica para "Bosses Defeated"
const bossesInput = document.getElementById("bossesDefeated");
const bossesButton = document.getElementById("incrementBosses");

bossesButton.addEventListener("click", () => {
  let currentValue = parseInt(bossesInput.value, 10) || 0;
  if (currentValue < 150) {
    bossesInput.value = currentValue + 1;
  }
});

// Lógica para "Chapters Completed"
const chaptersInput = document.getElementById("chaptersCompleted");
const chaptersButton = document.getElementById("incrementChapters");

chaptersButton.addEventListener("click", () => {
  let currentValue = parseInt(chaptersInput.value, 10) || 1;
  if (currentValue < 30) {
    chaptersInput.value = currentValue + 1;
  }
});


function toggleReviewText(event) {
  const button = event.target; // Identifica o botão clicado
  const reviewBody = button.closest('.review').querySelector('.review-body'); // Encontra o corpo do comentário correspondente
  
  reviewBody.classList.toggle('expanded');
  
  if (reviewBody.classList.contains('expanded')) {
    button.textContent = 'Read less...';
  } else {
    button.textContent = 'Read more...';
  }
}

// Adiciona event listeners a todos os botões
document.querySelectorAll('.expand-button').forEach(button => {
  button.addEventListener('click', toggleReviewText);
});


// Salvar dados do jogo em localStorage
document.addEventListener("DOMContentLoaded", function () {
  const gameData = JSON.parse(localStorage.getItem('gameData')) || {
      // Dados de fallback para teste, caso localStorage esteja vazio
      name: "If My Heart Had Wings",
      summary: "Aoi Minase returns with shattered dreams to his wind-swept hometown of Kazegaura...",
      cover: "co97o9",
      screenshots: [
          "scgjm2",
          "scgjm3",
          "scgjm4",
          "scgjm5"
      ]
  };

  // Preencher a mídia principal (capa)
  const gameMediaDiv = document.querySelector('.game-media');
  const coverImage = gameData.cover
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${gameData.cover}.jpg`
      : 'https://via.placeholder.com/300x400?text=Imagem+não+disponível';
  gameMediaDiv.innerHTML = `<img src="${coverImage}" alt="Game Cover">`;

  // Preencher as screenshots
  const thumbnailsContainer = document.querySelector('.game-thumbnails');
  const screenshots = gameData.screenshots || [];
  const thumbnailsHTML = screenshots.map((sc, index) => `
      <div class="thumbnail">
          <img src="https://images.igdb.com/igdb/image/upload/t_screenshot_huge/${sc}.jpg" alt="Screenshot ${index + 1}">
      </div>
  `).join('');
  thumbnailsContainer.innerHTML = thumbnailsHTML;

  // Preencher a descrição do jogo
  const descriptionElement = document.querySelector('#description-text');
  descriptionElement.textContent = gameData.summary || 'Descrição não disponível.';
});
