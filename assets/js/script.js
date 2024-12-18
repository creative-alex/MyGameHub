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
const iframe = document.getElementById('loginIframe');
const accountDiv = document.querySelector('.account');

// Função para abrir o iframe
function showLogin() {
    iframe.style.display = 'block';
}

// Adiciona o evento de clique na conta (div inteira)
accountDiv.addEventListener('click', showLogin);

// Fechar o iframe quando clicar fora dele
window.addEventListener('click', function(event) {
    // Verifica se o clique ocorreu fora do iframe e da conta
    if (event.target !== iframe && !iframe.contains(event.target) && event.target !== accountDiv && !accountDiv.contains(event.target)) {
        iframe.style.display = 'none';
    }
});




