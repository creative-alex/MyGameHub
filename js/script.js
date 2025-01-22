document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggle-button');
  const formsWrapper = document.querySelector('.forms-wrapper');
  const switchForms = document.querySelectorAll('.switch-form');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginMessage = document.getElementById('loginMessage');
  const registerMessage = document.getElementById('registerMessage');
  const accountSpan = document.querySelector('#toggle-button span');
  const dropdownMenu = document.createElement('div');
  const centerBox = document.querySelector('.centered-box');
  const button = document.querySelector('.box-button');
  
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
  
  // Manipular envio do formulário de registro
  registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const data = Object.fromEntries(formData.entries());
  
      try {
          const response = await fetch('http://localhost:3000/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
          });
  
          const result = await response.json();
          if (response.ok) {
              registerMessage.textContent = result.message;
              registerMessage.style.color = 'green';
              registerForm.reset();
          } else {
              registerMessage.textContent = result.message;
              registerMessage.style.color = 'red';
          }
      } catch (error) {
          registerMessage.textContent = 'Erro ao registrar. Tente novamente.';
          registerMessage.style.color = 'red';
      }
  });
  
  // Manipular envio do formulário de login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        if (response.ok) {
            // Exibir mensagem de sucesso
            loginMessage.textContent = result.message;
            loginMessage.style.color = 'green';

            // Atualizar o texto do span com o nome do usuário
            accountSpan.textContent = result.username;

            // Ocultar o formulário e preparar o dropdown
            formsWrapper.remove();
            centerBox.remove();
            localStorage.setItem('username', result.username);

            // Configurar o botão de alternância
            toggleButton.addEventListener('click', () => {
                dropdownMenu.classList.toggle('hidden');
            });

            // Configurar o botão de logout
            document.getElementById('logoutButton').addEventListener('click', () => {
                localStorage.removeItem('username');
                accountSpan.textContent = 'Sign In/Sign Up';
                dropdownMenu.classList.add('hidden');
                location.reload();
            });
        } else {
            // Exibir mensagem de erro
            loginMessage.textContent = result.message;
            loginMessage.style.color = 'red';
        }
    } catch (error) {
        // Exibir erro de conexão
        loginMessage.textContent = 'Erro ao fazer login. Tente novamente.';
        loginMessage.style.color = 'red';
    }
});

  
  // Verificar usuário logado
  const savedUsername = localStorage.getItem('username');
  if (savedUsername) {
      accountSpan.textContent = savedUsername;
      formsWrapper.remove();
  
      toggleButton.addEventListener('click', () => {
          dropdownMenu.classList.toggle('hidden');
      });
  
      document.getElementById('logoutButton').addEventListener('click', () => {
          localStorage.removeItem('username');
          accountSpan.textContent = 'Sign In/Sign Up';
          dropdownMenu.classList.add('hidden');
          location.reload();
      });
  }
  


searchInput.addEventListener('input', async () => {
  const query = searchInput.value.trim();
  const platform = platformSelect.value; // Obtém o valor do filtro selecionado

  if (query.length === 0) {
    resultsContainer.innerHTML = ''; // Limpa os resultados
    resultsContainer.style.display = 'none'; // Esconde o contêiner de resultados
    return;
  }

  try {
    const response = await fetch(`/search?q=${encodeURIComponent(query)}&platform=${platform}`);
    const games = await response.json();
    renderResults(games);
  } catch (error) {
    console.error('Erro ao buscar jogos:', error.message);
  }
});

// Função para buscar jogos com base no input e no filtro
async function fetchAndRenderResults() {
  const query = searchInput.value.trim(); // Valor do input
  const platform = platformSelect.value; // Valor do filtro

  if (query.length === 0) {
    resultsContainer.innerHTML = ''; // Limpa os resultados
    resultsContainer.style.display = 'none'; // Esconde o contêiner
    return;
  }

  try {
    const response = await fetch(`/search?q=${encodeURIComponent(query)}&platform=${platform}`);
    const games = await response.json();
    renderResults(games);
  } catch (error) {
    console.error('Erro ao buscar jogos:', error.message);
  }
}

// Adiciona evento ao campo de busca
searchInput.addEventListener('input', fetchAndRenderResults);

// Adiciona evento ao filtro de plataforma
platformSelect.addEventListener('change', fetchAndRenderResults);

// Renderiza os resultados no contêiner
function renderResults(games) {
  resultsContainer.innerHTML = ''; // Limpa os resultados antigos
  resultsContainer.style.display = 'block'; // Exibe o contêiner

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
    resultsContainer.appendChild(gameElement);
  });
}

document.getElementById('randomGame').addEventListener('click', () => {
  window.location.href = '/randomGame';
});
  

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




});


const slider = document.querySelector('.slider');
const totalItems = document.querySelectorAll('.slider-item').length;
let currentAngle = 0;
const anglePerSlide = 360 / totalItems;

function rotateSlider(direction) {
  currentAngle += direction * anglePerSlide;
  slider.style.transform = `rotateY(${currentAngle}deg)`;
}

window.rotateSlider = rotateSlider; // Torna a função acessível no escopo global