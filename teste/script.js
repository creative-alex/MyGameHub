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
            <p><strong>Developer:</strong> ${game.involved_companies || 'Não disponível'}</p>
            <p><strong>Publisher:</strong> ${game.publisher || 'Não disponível'}</p>
            <p><strong>Release Date:</strong> ${game.first_release_date || 'Não disponível'}</p>
            <p><strong>Modos de Jogo:</strong> ${game.game_modes || 'Não disponível'}</p>
            <p><strong>Data de Criação:</strong> ${game.created_at !== 'N/A' ? new Date(game.created_at * 1000).toLocaleDateString() : 'Não disponível'}</p>
            <div><strong>ScreenShots:</strong></div>
            <div>
                ${
                    game.screenshots && game.screenshots.length > 0
                        ? game.screenshots
                              .map(
                                  sc =>
                                      `<img src="https://images.igdb.com/igdb/image/upload/t_720p/${sc}.jpg" alt="Screenshot">`
                              )
                              .join('')
                        : 'Sem capturas de tela disponíveis'
                }
            </div>
            <div>
                <h3>Jogos Similares</h3>
                ${
                    game['similar-game-name-1'] || game['similar-game-summary-1'] || game['similar-game-artwork-1']
                        ? `
                            <div>
                                <h4>${game['similar-game-name-1'] || 'N/A'}</h4>
                                <p>${game['similar-game-summary-1'] || 'N/A'}</p>
                                <img src="${
                                    game['similar-game-artwork-1'] !== 'Imagem não disponível'
                                        ? game['similar-game-artwork-1']
                                        : ''
                                }" alt="Artwork do jogo similar">
                            </div>
                            <div>
                                <h4>${game['similar-game-name-2'] || 'N/A'}</h4>
                                <p>${game['similar-game-summary-2'] || 'N/A'}</p>
                                <img src="${
                                    game['similar-game-artwork-2'] !== 'Imagem não disponível'
                                        ? game['similar-game-artwork-2']
                                        : ''
                                }" alt="Artwork do jogo similar">
                            </div>
                            <div>
                                <h4>${game['similar-game-name-3'] || 'N/A'}</h4>
                                <p>${game['similar-game-summary-3'] || 'N/A'}</p>
                                <img src="${
                                    game['similar-game-artwork-3'] !== 'Imagem não disponível'
                                        ? game['similar-game-artwork-3']
                                        : ''
                                }" alt="Artwork do jogo similar">
                            </div>
                            <div>
                                <h4>${game['similar-game-name-4'] || 'N/A'}</h4>
                                <p>${game['similar-game-summary-4'] || 'N/A'}</p>
                                <img src="${
                                    game['similar-game-artwork-4'] !== 'Imagem não disponível'
                                        ? game['similar-game-artwork-4']
                                        : ''
                                }" alt="Artwork do jogo similar">
                            </div>
                            <div>
                                <h4>${game['similar-game-name-5'] || 'N/A'}</h4>
                                <p>${game['similar-game-summary-5'] || 'N/A'}</p>
                                <img src="${
                                    game['similar-game-artwork-5'] !== 'Imagem não disponível'
                                        ? game['similar-game-artwork-5']
                                        : ''
                                }" alt="Artwork do jogo similar">
                            </div>
                        `
                        : 'Sem jogos similares disponíveis'
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
