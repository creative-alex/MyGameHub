function fetchCategory(genreId) {
  window.location.href = `/category?genre=${genreId}`;
};

function fetchByGameId(gameId) {
  window.location.href = `/game-details/${gameId}`;
}
function fetchByPlatform(platformId) {
  window.location.href = `/platform-games/${platformId}`;
}

function fetchBySearch(searchId) {
  window.location.href = `/game-details/${searchId}`;
}


$(".custom-carousel").owlCarousel({
  autoWidth: true,
  loop: false
});
$(document).ready(function () {
  $(".custom-carousel .item").click(function () {
    $(".custom-carousel .item").not($(this)).removeClass("active");
    $(this).toggleClass("active");
  });
});


const slider = document.querySelector('.slider');
const totalItems = document.querySelectorAll('.slider-item').length;
let currentAngle = 0;
const anglePerSlide = 360 / totalItems;

function rotateSlider(direction) {
  currentAngle += direction * anglePerSlide;
  slider.style.transform = `rotateY(${currentAngle}deg)`;
}

window.rotateSlider = rotateSlider; 

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const platformSelect = document.getElementById('platform-select');
  const resultsContainer = document.getElementById('results-container');

  // Função para buscar resultados
  const fetchResults = async (query, platform) => {
    try {
      const response = await fetch(`/search?query=${query}&platform=${platform}`);
      if (!response.ok) throw new Error('Erro na busca');
      const results = await response.json();

      // Atualizar o contêiner de resultados
      renderResults(results);
    } catch (error) {
      console.error('Erro ao buscar resultados:', error.message);
    }
  };

  // Função para renderizar resultados
  const renderResults = (results) => {
    resultsContainer.innerHTML = ''; // Limpar resultados anteriores
    if (results.length === 0) {
      resultsContainer.innerHTML = '<p class="no-results">Nenhum resultado encontrado.</p>';
      return;
    }
  
    results.forEach((result) => {
      const resultItem = document.createElement('div');
      resultItem.classList.add('result-item');
      resultItem.setAttribute('data-game-id', result.id); // Adiciona o atributo data-game-id
      resultItem.setAttribute('onclick', `fetchBySearch(${result.id})`); // Adiciona o atributo onclick
  
      resultItem.innerHTML = `
        <img src="${result.cover}" alt="${result.name}" class="result-cover">
        <div class="result-details">
          <h3>${result.name}</h3>
          <p>${result.summary}</p>
        </div>
      `;
      resultsContainer.appendChild(resultItem);
    });
  };
  

  // Evento para atualizar os resultados em tempo real
  const handleInputChange = () => {
    const query = searchInput.value.trim();
    const platform = platformSelect.value;

    if (query.length > 0) {
      fetchResults(query, platform);
    } else {
      resultsContainer.innerHTML = ''; // Limpar resultados se o input estiver vazio
    }
  };

  // Listeners para o input e seletor
  searchInput.addEventListener('input', handleInputChange);
  platformSelect.addEventListener('change', handleInputChange);
});
