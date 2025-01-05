const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Importar o CORS

const app = express();
const PORT = 3000;

const IGDB_BASE_URL = 'https://api.igdb.com/v4';
const CLIENT_ID = '0h4zi8h0yj07toculmixdhyhbij8p2'; // Substituir pelo teu Client ID da IGDB
const AUTH_TOKEN = 'rmnpkjiczadvnn0807c1e5is3rvsjm'; // Substituir pelo teu Access Token da IGDB

app.use(cors());
app.use(express.json());

// Função genérica para buscar dados da API IGDB
async function fetchFromIGDB(endpoint, fields, ids) {
    try {
        const response = await axios.post(
            `${IGDB_BASE_URL}/${endpoint}`,
            `fields ${fields}; where id = (${ids.join(',')});`,
            {
                headers: {
                    'Client-ID': CLIENT_ID,
                    Authorization: `Bearer ${AUTH_TOKEN}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar ${endpoint}:`, error.message);
        return [];
    }
}

// Rota para buscar informações detalhadas de um jogo aleatório
app.get('/api/random-game', async (req, res) => {
    try {
        // Buscar jogo aleatório
        const gameResponse = await axios.post(
            `${IGDB_BASE_URL}/games`,
            `fields cover, created_at, genres, involved_companies, name, platforms, screenshots, similar_games, summary, game_modes, multiplayer_modes;
            sort created_at desc; 
            where platforms = (6, 9, 12, 14, 34, 37, 39, 41, 48, 49, 130, 162, 163, 167, 169); 
            limit 1; offset ${Math.floor(Math.random() * 100001)};`,
            {
                headers: {
                    'Client-ID': CLIENT_ID,
                    Authorization: `Bearer ${AUTH_TOKEN}`,
                },
            }
        );

        const game = gameResponse.data[0];

        // Variáveis para armazenar detalhes adicionais
        const coverId = game.cover;
        const genreIds = game.genres || [];
        const platformIds = game.platforms || [];
        const similarGameIds = game.similar_games || [];
        const companyIds = game.involved_companies || [];
        const screenshotIds = game.screenshots || [];
        const gameModeIds = game.game_modes || [];
        const multiplayerModeIds = game.multiplayer_modes || [];

        // Fazer pedidos às APIs relacionadas
        const cover = coverId ? await fetchFromIGDB('covers', 'image_id, height, width, url', [coverId]) : [];
        const genres = genreIds.length ? await fetchFromIGDB('genres', 'name', genreIds) : [];
        const platforms = platformIds.length ? await fetchFromIGDB('platforms', 'name', platformIds) : [];
        const similarGames = similarGameIds.length ? await fetchFromIGDB('games', 'name', similarGameIds) : [];
        const companies = companyIds.length ? await fetchFromIGDB('involved_companies', 'name', companyIds) : [];
        const screenshots = screenshotIds.length ? await fetchFromIGDB('screenshots', 'image_id', screenshotIds) : [];
        const gameModes = gameModeIds.length ? await fetchFromIGDB('game_modes', 'name', gameModeIds) : [];
        const multiplayerModes = multiplayerModeIds.length ? await fetchFromIGDB('multiplayer_modes', 'name', multiplayerModeIds) : [];

        // Construir a resposta detalhada
        const detailedGame = {
            name: game.name || 'N/A',
            created_at: game.created_at || 'N/A',
            summary: game.summary || 'N/A',
            cover: cover.length
               ? `${cover[0].image_id}`
               : 'Imagem não disponível',      
            genres: genres.map(g => g.name).join(', ') || 'N/A',
            platforms: platforms.map(p => p.name).join(', ') || 'N/A',
            similar_games: similarGames.map(sg => sg.name).join(', ') || 'N/A',
            involved_companies: companies.map(c => c.name).join(', ') || 'N/A',
            screenshots: screenshots.length
                ? screenshots.map(sc => `${sc.image_id}`)
                : ['Sem capturas de tela disponíveis'],
            game_modes: gameModes.map(gm => gm.name).join(', ') || 'N/A',
            multiplayer_modes: multiplayerModes.map(mm => mm.name).join(', ') || 'N/A',
        };

        res.json(detailedGame);
    } catch (error) {
        console.error('Erro ao buscar jogo:', error.message);
        res.status(error.response?.status || 500).json({ error: error.message });
    }
});




// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
});
