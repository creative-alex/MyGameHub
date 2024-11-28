let currentSlide = 0;

function rotateSlider(direction) {
  const slider = document.querySelector('.slider-items');
  const totalSlides = document.querySelectorAll('.slider-item').length;
  currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
  slider.style.transform = `rotateY(${currentSlide * -72 }deg)`;
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


// Função para abrir o modal de login
function openLoginModal() {
  document.getElementById("loginModal").style.display = "flex";
}

// Função para fechar o modal de login
function closeLoginModal() {
  document.getElementById("loginModal").style.display = "none";
}

// Fechar o modal ao clicar fora da janela
window.onclick = function(event) {
  if (event.target == document.getElementById("loginModal")) {
      closeLoginModal();
  }
}






/// Seleciona o link "Register" no formulário de login
const registerLink = document.querySelector('.switch-form-register');

// Adiciona um ouvinte de evento para quando o link for clicado
registerLink.addEventListener('click', function (event) {
    event.preventDefault(); // Evita o comportamento padrão do link (recarregar a página)

    // Seleciona os formulários
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.querySelector('.register-form');

    // Remove o overlay existente do formulário de registro, se houver
    const existingOverlayRegister = registerForm.querySelector('.overlay');
    if (existingOverlayRegister) {
        existingOverlayRegister.remove();
    }

    // Remove o overlay existente do formulário de login, se houver
    const existingOverlayLogin = loginForm.querySelector('.overlay');
    if (existingOverlayLogin) {
        existingOverlayLogin.remove();
    }

    // Cria um novo div de sobreposição
    const newOverlay = document.createElement('div');
    newOverlay.classList.add('overlay');

    // Adiciona o overlay ao formulário de login
    loginForm.appendChild(newOverlay);
});

// Seleciona o link "Sign In" no formulário de registro
const loginLink = document.querySelector('.switch-form-login');

// Adiciona um ouvinte de evento para quando o link for clicado
loginLink.addEventListener('click', function (event) {
    event.preventDefault(); // Evita o comportamento padrão do link (recarregar a página)

    // Seleciona os formulários
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.querySelector('.register-form');

    // Remove o overlay existente do formulário de login, se houver
    const existingOverlayLogin = loginForm.querySelector('.overlay');
    if (existingOverlayLogin) {
        existingOverlayLogin.remove();
    }

    // Remove o overlay existente do formulário de registro, se houver
    const existingOverlayRegister = registerForm.querySelector('.overlay');
    if (existingOverlayRegister) {
        existingOverlayRegister.remove();
    }

    // Cria um novo div de sobreposição
    const newOverlay = document.createElement('div');
    newOverlay.classList.add('overlay');

    // Adiciona o overlay ao formulário de registro
    registerForm.appendChild(newOverlay);
});






