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
        let validGame = null;

        // Tentar buscar um jogo até encontrar um que seja válido
        while (!validGame) {
            const gameResponse = await axios.post(
                `${IGDB_BASE_URL}/games`,
                `fields cover, created_at, first_release_date, genres, involved_companies, name, platforms, screenshots, similar_games, summary, game_modes, multiplayer_modes;
                sort created_at desc; 
                where platforms = (6, 9, 12, 14, 34, 37, 39, 41, 48, 49, 130, 162, 163, 167, 169) & involved_companies != null; 
                limit 1; offset ${Math.floor(Math.random() * 100001)};`,
                {
                    headers: {
                        'Client-ID': CLIENT_ID,
                        Authorization: `Bearer ${AUTH_TOKEN}`,
                    },
                }
            );

            const game = gameResponse.data[0];

            // Verificar se o jogo tem uma capa, pelo menos 3 capturas de tela e empresas envolvidas
            if (game.cover && game.screenshots && game.screenshots.length >= 3 && game.involved_companies) {
                validGame = game;
            }
        }

        const game = validGame;

        // Variáveis para armazenar detalhes adicionais
        const coverId = game.cover;
        const genreIds = game.genres || [];
        const platformIds = game.platforms || [];
        const similarGameIds = game.similar_games || [];
        const involvedCompanyIds = game.involved_companies || [];
        const screenshotIds = game.screenshots || [];
        const gameModeIds = game.game_modes || [];
        const multiplayerModeIds = game.multiplayer_modes || [];

        // Fazer pedidos às APIs relacionadas
        const cover = coverId ? await fetchFromIGDB('covers', 'image_id, height, width, url', [coverId]) : [];
        const genres = genreIds.length ? await fetchFromIGDB('genres', 'name', genreIds) : [];
        const platforms = platformIds.length ? await fetchFromIGDB('platforms', 'name', platformIds) : [];
        const similarGames = similarGameIds.length ? await fetchFromIGDB('games', 'name', similarGameIds) : [];
        const screenshots = screenshotIds.length ? await fetchFromIGDB('screenshots', 'image_id', screenshotIds) : [];
        const gameModes = gameModeIds.length ? await fetchFromIGDB('game_modes', 'name', gameModeIds) : [];
        const multiplayerModes = multiplayerModeIds.length ? await fetchFromIGDB('multiplayer_modes', 'name', multiplayerModeIds) : [];

        // Buscar informações das empresas associadas
        let companyNames = [];
        let publishers = [];
        if (involvedCompanyIds.length) {
            // Buscar os dados completos de `involved_companies`
            const involvedCompanies = await fetchFromIGDB('involved_companies', 'company, publisher', involvedCompanyIds);
            const companyIds = involvedCompanies.map(ic => ic.company);

            // Identificar os publishers
            publishers = involvedCompanies
                .filter(ic => ic.publisher) // Filtrar apenas os que têm o campo `publisher` como `true`
                .map(ic => ic.company);    // Obter os IDs das empresas que são publishers

            // Usar os IDs para buscar os nomes das empresas no endpoint `companies`
            if (companyIds.length) {
                const companies = await fetchFromIGDB('companies', 'name', companyIds);
                companyNames = companies.map(c => c.name);

                // Obter os nomes dos publishers
                publishers = companies
                    .filter(c => publishers.includes(c.id)) // Filtrar pelos IDs dos publishers
                    .map(c => c.name);                     // Obter os nomes dos publishers
            }
        }

        // Converter first_release_date (Unix Timestamp) para mês e ano com a primeira letra maiúscula
let releaseDate = 'Data não disponível';
if (game.first_release_date) {
    const timestamp = game.first_release_date * 1000; // Converter de segundos para milissegundos
    const date = new Date(timestamp);
    const month = date.toLocaleString('en', { month: 'long' }); 
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1); 
    releaseDate = `${capitalizedMonth} de ${date.getFullYear()}`;
}


        // Construir a resposta detalhada
        const detailedGame = {
            name: game.name || 'N/A',
            created_at: game.created_at || 'N/A',
            first_release_date: releaseDate, // Usar o valor formatado
            summary: game.summary || 'N/A',
            cover: cover.length
                ? `${cover[0].image_id}`
                : 'Imagem não disponível',
            genres: genres.map(g => g.name).join(', ') || 'N/A',
            platforms: platforms.map(p => p.name).join(', ') || 'N/A',
            similar_games: similarGames.map(sg => sg.name).join(', ') || 'N/A',
            involved_companies: companyNames.length ? companyNames.join(', ') : 'N/A',
            publisher: publishers.length ? publishers.join(', ') : 'N/A',
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
