document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggle-button');
  const formsWrapper = document.querySelector('.forms-wrapper');
  const switchForms = document.querySelectorAll('.switch-form');
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');
  const accountSpan = document.querySelector('#toggle-button span');
  const dropdownMenu = document.createElement('div');
  const centerBox = document.querySelector('.centered-box');
  const button = document.querySelector('.box-button');
  const searchInput = document.getElementById('search-input');
  const searchContainer = document.querySelector('.search-container');
  const resultsContainer = document.getElementById('results-container');
  resultsContainer.classList.add('results-container');
  searchContainer.appendChild(resultsContainer);
  
  // Alterna exibição do wrapper de formulários
  toggleButton.addEventListener('click', () => {
    formsWrapper.classList.toggle('hidden');
  });

  // Alterna entre login e registro
  switchForms.forEach((switchForm) => {
    switchForm.addEventListener('click', (e) => {
      const targetFormId = e.target.dataset.target;
      document.querySelectorAll('.forms-wrapper form').forEach((form) => {
        form.classList.remove('active-form');
      });
      document.getElementById(targetFormId).classList.add('active-form');
    });
  });
 

  // Manipular o envio do formulário de registro
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData.entries());

    console.log('Dados enviados:', data); // Log dos dados enviados

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        console.log('Resposta do servidor:', result); // Log da resposta do servidor

        if (response.ok) {
            registerMessage.textContent = result.message;
            registerMessage.style.color = 'green';
            registerForm.reset(); // Limpar o formulário após registro bem-sucedido
        } else {
            registerMessage.textContent = result.message;
            registerMessage.style.color = 'red';
        }
    } catch (error) {
        console.error('Erro ao enviar registro:', error); // Log do erro
        registerMessage.textContent = 'Erro ao registrar. Tente novamente.';
        registerMessage.style.color = 'red';
    }
});

// Configuração do menu dropdown
dropdownMenu.className = 'dropdown-menu hidden';
dropdownMenu.innerHTML = `
    <ul>
        <li><a href="/user/profile">Profile</a></li>
        <li><a href="/account-settings">Account Settings</a></li>
        <li id="logoutButton">Logout</li>
    </ul>
`;
toggleButton.parentNode.insertBefore(dropdownMenu, toggleButton.nextSibling);

// Manipular o envio do formulário de login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        if (response.ok) {
            loginMessage.textContent = result.message;
            loginMessage.style.color = 'green';

            // Atualizar o texto do span com o nome de usuário
            accountSpan.textContent = result.username;

            // Ocultar ou remover o forms-wrapper
            formsWrapper.remove();
            centerBox.remove();

            // Tornar o dropdown funcional
            toggleButton.addEventListener('click', () => {
                dropdownMenu.classList.toggle('hidden');
            });

            // Logout
            document.getElementById('logoutButton').addEventListener('click', () => {
                localStorage.removeItem('username');
                accountSpan.textContent = 'Sign In/Sign Up';
                dropdownMenu.classList.add('hidden');

                // Opcional: Exibir novamente os formulários
                location.reload(); // ou recriar os formulários dinamicamente
            });

            // Salvar o nome do usuário no localStorage
            localStorage.setItem('username', result.username);
        } else {
            loginMessage.textContent = result.message;
            loginMessage.style.color = 'red';
        }
    } catch (error) {
        loginMessage.textContent = 'Erro ao fazer login. Tente novamente.';
        loginMessage.style.color = 'red';
    }
});

// Carregar estado logado do usuário
const savedUsername = localStorage.getItem('username');
if (savedUsername) {
    accountSpan.textContent = savedUsername;
    formsWrapper.remove();

    // Tornar o dropdown funcional
    toggleButton.addEventListener('click', () => {
        dropdownMenu.classList.toggle('hidden');
    });

    // Logout
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('username');
        accountSpan.textContent = 'Sign In/Sign Up';
        dropdownMenu.classList.add('hidden');

        // Opcional: Exibir novamente os formulários
        location.reload(); // ou recriar os formulários dinamicamente
    });
}

 // Adiciona o evento de clique ao botão
 button.addEventListener('click', () => {
  // Rola a página para o topo
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Remove a classe 'hidden' da div
  formsWrapper.classList.remove('hidden');
});



searchInput.addEventListener('input', async () => {
  const query = searchInput.value.trim();
  if (query.length === 0) {
      resultsContainer.innerHTML = ''; // Limpa os resultados.
      return;
  }

  try {
      const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
          throw new Error('Erro ao buscar os jogos.');
      }

      const games = await response.json();
      renderResults(games);
  } catch (error) {
      console.error('Erro ao buscar jogos:', error.message);
  }
});

function renderResults(games) {
  resultsContainer.innerHTML = ''; // Limpa os resultados antigos.

  if (games.length === 0) {
      resultsContainer.innerHTML = '<p>Nenhum jogo encontrado.</p>';
      return;
  }

  games.forEach((game) => {
      const gameElement = document.createElement('div');
      gameElement.classList.add('game-result');
      gameElement.innerHTML = `
          <img src="${game.cover}" alt="${game.name} cover" />
          <div class="game-info">
              <h3>${game.name}</h3>
              <p>${game.summary}</p>
          </div>
      `;
      resultsContainer.appendChild(gameElement); // Adiciona o jogo ao contêiner correto.
  });
}


  

  // Slider logic
  let currentSlide = 0;

  function rotateSlider(direction) {
    const slider = document.querySelector('.slider-items');
    const totalSlides = document.querySelectorAll('.slider-item').length;
    currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
    slider.style.transform = `rotateY(${currentSlide * -72}deg)`;
  }

  function main() {
    const sliders = document.querySelectorAll(".slider_popular");

    sliders.forEach((slider) => {
      let index = 0;
      const wrapper = slider.querySelector(".slider-wrapper");
      const slides = slider.querySelectorAll(".slide");
      const slidesControls = slider.querySelector(".slider-controls");
      const leftBtn = slider.querySelector(".slide-control-left");
      const rightBtn = slider.querySelector(".slide-control-right");

      if (!slides) return;

      function controls() {
        if (index === 0) {
          leftBtn.classList.add("slide-control-disabled");
        } else {
          leftBtn.classList.remove("slide-control-disabled");
        }

        if (index === slides.length - 2) {
          rightBtn.classList.add("slide-control-disabled");
        } else {
          rightBtn.classList.remove("slide-control-disabled");
        }
      }

      function setSlides() {
        slides.forEach((slide) => {
          slide.style.left =
            -(
              slidesControls.clientWidth * index +
              (window.innerWidth >= 768 ? 24 : 36) * index
            ) + "px";
          slide.classList.remove("slide-active");
        });

        slides[index].classList.add("slide-active");
      }

      if (leftBtn && rightBtn) {
        leftBtn.addEventListener("click", () => {
          if (index > 0 && index <= slides.length) {
            index--;
            setSlides();
          }

          controls();
        });

        rightBtn.addEventListener("click", () => {
          if (index >= 0 && index < slides.length - 2) {
            index++;
            setSlides();
          }

          controls();
        });
      }

      const resize = () => {
        slider.classList.remove("slider-transitions");
        setSlides();
        slider.classList.add("slider-transitions");
      };

      setSlides();
      controls();
      window.addEventListener("load", () => {
        setTimeout(() => {
          slider.classList.add("slider-transitions");
        }, 1000);
      });
      window.addEventListener("resize", resize);
    });
  }

  main();

  // Fetch random game logic
  async function fetchRandomGame() {
    const resultDiv = document.getElementById('result');

    try {
      const response = await fetch('http://localhost:3000/api/random-game');
      const game = await response.json();

      // Store data in localStorage
      localStorage.setItem('gameData', JSON.stringify(game));

      // Redirect to game.html
      window.location.href = 'game.html';
    } catch (error) {
      console.error(error);
      resultDiv.textContent = 'Erro ao buscar jogo!';
    }

    const gameData = JSON.parse(localStorage.getItem('gameData'));
    console.log('Game cover:', gameData.cover);
  }

  const gameData = JSON.parse(localStorage.getItem('gameData'));
  console.log('Dados carregados:', gameData);
  if (!gameData) {
    console.error('Erro: Dados do jogo não encontrados no localStorage.');
  }

  document.getElementById('fetchRandomGame').addEventListener('click', fetchRandomGame);
});