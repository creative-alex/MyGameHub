async function fetchRandomGame() {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = 'A buscar jogo aleatório...';

    try {
        const response = await fetch('http://localhost:3000/api/random-game');
        const game = await response.json();

        // Mostra os dados do jogo no frontend
        resultDiv.innerHTML = `
            <h2>${game.name}</h2>
            <p><strong>Géneros:</strong> ${game.genres}</p>
            <p><strong>História:</strong> ${game.summary}</p>
            <p><strong>Plataformas:</strong> ${game.platforms}</p>
            <img src="${game.cover ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover}.jpg` : ''}" alt="Capa">
            <p><strong>Jogos Similares:</strong> ${game.similar_games}</p>
            <p><strong>Companhias Envolvidas:</strong> ${game.involved_companies}</p>
            <p><strong>Modos de Jogo:</strong> ${game.game_modes}</p>
            <p><strong>Modos Multiplayer:</strong> ${game.multiplayer_modes}</p>
            <p><strong>Data de Criação:</strong> ${new Date(game.created_at * 1000).toLocaleDateString()}</p>
            <div><strong>ScreenShots:</strong></div>
            <div>
                ${game.screenshots.map(sc => `<img src="https://images.igdb.com/igdb/image/upload/t_screenshot_huge/${sc}.jpg" alt="Screenshot">`).join('')}
            </div>
        `;
    } catch (error) {
        console.error(error);
        resultDiv.textContent = 'Erro ao buscar jogo!';
    }
}

document.getElementById('fetchRandomGame').addEventListener('click', fetchRandomGame);
