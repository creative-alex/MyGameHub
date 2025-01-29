document.addEventListener("DOMContentLoaded", async function () {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) return; // Se não houver token, ignora o processo

  const userData = parseJwt(authToken);
  if (!userData || !userData.user_id) return;

  const userId = userData.user_id;

  // Obtém a lista de jogos do utilizador
  const response = await fetch(`/api/user-games?user_id=${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
  });

  if (!response.ok) return;
  const userGames = await response.json();

  // Verificar se o botão "Adicionar à Lista" precisa ser substituído por um select
  document.querySelectorAll(".btn.add-to-list").forEach(button => {
      const gameId = button.getAttribute("data-game-id");
      const userGame = userGames.find(game => game.igdb_id == gameId);

      // Se o jogo já estiver na lista, substitui o botão por um select
      if (userGame) {
          button.replaceWith(createSelect(gameId, userGame.game_status));
      } else {
          // Se o jogo não estiver na lista, mantém o botão
          button.addEventListener("click", () => addToList(gameId));
      }
  });

  // Adiciona o evento para o botão "Adicionar aos Favoritos"
  document.querySelectorAll(".btn.add-to-favorites").forEach(button => {
      const gameId = button.getAttribute("data-game-id");
      button.addEventListener("click", () => addToFavorites(gameId));
  });
});

// Função para criar o select
function createSelect(gameId, selectedStatus) {
  const select = document.createElement("select");
  select.classList.add("game-status");
  select.setAttribute("data-game-id", gameId);

  const options = ["current", "dropped", "on_hold", "wishlisted", "completed"];
  options.forEach(status => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status.toUpperCase();
      if (status === selectedStatus) option.selected = true;
      select.appendChild(option);
  });

  // Quando o valor do select mudar, dispara a função de atualização
  select.addEventListener("change", function () {
      updateGameStatus(gameId, this.value);
  });

  return select;
}

// Função para atualizar o status do jogo no backend
async function updateGameStatus(gameId, newStatus) {
  try {
      const response = await fetch("/user/update-game-status", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("authToken")}`
          },
          body: JSON.stringify({ gameId, status: newStatus })
      });

      if (!response.ok) {
          throw new Error("Falha ao atualizar o status.");
      }
  } catch (error) {
      console.error(error);
      alert("Erro ao atualizar o status do jogo.");
  }
}

// Função para adicionar o jogo à lista
async function addToList(gameId) {
  try {
      const response = await fetch("/user/add-to-list", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("authToken")}`
          },
          body: JSON.stringify({ gameId })
      });

      if (!response.ok) {
          throw new Error("Falha ao adicionar jogo à lista.");
      }

      // Após sucesso, substitui o botão por select
      document.querySelector(`[data-game-id="${gameId}"]`).replaceWith(createSelect(gameId, "current"));
  } catch (error) {
      console.error(error);
      alert("Erro ao adicionar jogo à lista.");
  }
}

// Função para adicionar o jogo aos favoritos
async function addToFavorites(gameId) {
  try {
      const response = await fetch('/user/add-to-favorites', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('authToken')}`, // Token do usuário
          },
          body: JSON.stringify({ gameId }),
      });

      const data = await response.json();
      alert(data.message || 'Jogo adicionado aos favoritos!');
  } catch (error) {
      console.error(error);
      alert('Erro ao adicionar aos favoritos.');
  }
}

// Função para decodificar JWT
function parseJwt(token) {
  try {
      return JSON.parse(atob(token.split(".")[1]));
  } catch {
      return null;
  }
}
