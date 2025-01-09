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




async function fetchRandomGame() {
  const resultDiv = document.getElementById('result');

  try {
      const response = await fetch('http://localhost:3000/api/random-game');
      const game = await response.json();

      // Armazenar os dados no localStorage
      localStorage.setItem('gameData', JSON.stringify(game));

      // Redirecionar para a página game.html
      window.location.href = 'game.html';
  } catch (error) {
      console.error(error);
      resultDiv.textContent = 'Erro ao buscar jogo!';
  }
  console.log(gameData.cover); // Verifique o conteúdo da capa

}

const gameData = JSON.parse(localStorage.getItem('gameData'));
console.log('Dados carregados:', gameData);
if (!gameData) {
    console.error('Erro: Dados do jogo não encontrados no localStorage.');
}


document.getElementById('fetchRandomGame').addEventListener('click', fetchRandomGame);
