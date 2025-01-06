async function fetchRandomGame() {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = 'A buscar jogo aleatório...';

    try {
        const response = await fetch('http://localhost:3000/api/random-game');
        if (!response.ok) {
            throw new Error('Erro ao buscar jogo.');
        }

        const game = await response.json();

        // Mostra os dados do jogo no frontend
        resultDiv.innerHTML = `
            <h2>${game.name}</h2>
            <p><strong>Géneros:</strong> ${game.genres || 'Não disponível'}</p>
            <p><strong>História:</strong> ${game.summary || 'Não disponível'}</p>
            <p><strong>Plataformas:</strong> ${game.platforms || 'Não disponível'}</p>
            <img src="${game.cover ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover}.jpg` : ''}" alt="Capa">
            <p><strong>Jogos Similares:</strong> ${game.similar_games || 'Não disponível'}</p>
            <p><strong>Developer:</strong> ${game.involved_companies || 'Não disponível'}</p>
            <p><strong>Publisher:</strong> ${game.publisher || 'Não disponível'}</p>
            <p><strong>Release Date:</strong> ${ game.first_release_date || 'Não disponível'}</p>
            <p><strong>Modos de Jogo:</strong> ${game.game_modes || 'Não disponível'}</p>
            <p><strong>Data de Criação:</strong> ${game.created_at !== 'N/A' ? new Date(game.created_at * 1000).toLocaleDateString() : 'Não disponível'}</p>
            <div><strong>ScreenShots:</strong></div>
            <div>
                ${
                    game.screenshots && game.screenshots.length > 0
                        ? game.screenshots
                              .map(
                                  sc =>
                                      `<img src="https://images.igdb.com/igdb/image/upload/t_screenshot_huge/${sc}.jpg" alt="Screenshot">`
                              )
                              .join('')
                        : 'Sem capturas de tela disponíveis'
                }
            </div>
        `;
    } catch (error) {
        console.error(error);
        resultDiv.textContent = 'Erro ao buscar jogo!';
    }
}

// Adicionar evento ao botão
document.getElementById('fetchRandomGame').addEventListener('click', fetchRandomGame);
