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



