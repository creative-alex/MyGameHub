function fetchCategory(genreId) {
  window.location.href = `/category?genre=${genreId}`;
};

function fetchByCategory(gameId) {
  window.location.href = `/game-details/${gameId}`;
}
function fetchByPlatform(platformId) {
  window.location.href = `/platform-games/${platformId}`;
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