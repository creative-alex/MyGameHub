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





// Usar dados do jogo na localStorage
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
      ],
      genres: ["Visual Novel", "Adventure", "Drama"] // Gêneros de exemplo
  };

  console.log("Dados do jogo carregados:", gameData);

  // Alterar o título da página
  document.title = gameData.name;

  // Alterar o nome do jogo
  const gameNameElement = document.querySelector('.game-name');
  gameNameElement.textContent = gameData.name;

  // Alterar a data de lançamento
  const releaseDateElement = document.querySelector('.release-date');
  releaseDateElement.textContent = gameData.first_release_date;

  // Alterar o Developer
  const developerElement = document.querySelector('.developer');
  developerElement.textContent = gameData.involved_companies;

  // Alterar o Publisher
  const publisherElement = document.querySelector('.publisher');
  publisherElement.textContent = gameData.publisher;

  // Alterar os modos de jogo
  const gameModesElement = document.querySelector('.game-modes');
  gameModesElement.textContent = gameData.game_modes;

  // Preencher a mídia principal (capa)
  const gameMediaDiv = document.querySelector('.game-media');
  const coverImage = gameData.cover
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${gameData.cover}.jpg`
      : 'https://via.placeholder.com/300x400?text=Imagem+não+disponível';
  gameMediaDiv.innerHTML = `<img src="${coverImage}" alt="Game Cover">`;

  // Preencher as screenshots
  const screenshots = gameData.screenshots || [];
  const thumbnailDivs = document.querySelectorAll('.thumbnail');
  screenshots.forEach((sc, index) => {
      if (thumbnailDivs[index]) {
          thumbnailDivs[index].innerHTML = `
              <img src="https://images.igdb.com/igdb/image/upload/t_screenshot_huge/${sc}.jpg" alt="Screenshot ${index + 1}">
          `;
      }
  });

  // Preencher a descrição do jogo
  const descriptionElement = document.querySelector('#description-text');
  descriptionElement.textContent = gameData.summary || 'Descrição não disponível.';

  console.log("gameData.genres:", gameData.genres);
console.log("Tipo de gameData.genres:", typeof gameData.genres);


  // Preencher a lista de gêneros
const genresList = document.querySelector('.tags');
if (genresList) {
    console.log("Elemento <ul class='tags'> encontrado.");
    
    // Converte para array, separando por vírgulas
    const genres = typeof gameData.genres === 'string'
        ? gameData.genres.split(',').map(genre => genre.trim()) // Divide e remove espaços extras
        : Array.isArray(gameData.genres)
            ? gameData.genres
            : []; // Garante que seja um array

    console.log("Gêneros após conversão:", genres);

    genres.forEach(genre => {
        const listItem = document.createElement('li');
        listItem.textContent = genre;
        genresList.appendChild(listItem);
    });
} else {
    console.error("Elemento <ul class='tags'> não encontrado no DOM.");
}


});
