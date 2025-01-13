const express = require('express');
const axios = require('axios');
const cors = require('cors');
const session = require('express-session'); // Usar sessões para armazenar o jogo gerado

const app = express();
const PORT = 3000;

const IGDB_BASE_URL = 'https://api.igdb.com/v4';
const CLIENT_ID = '0h4zi8h0yj07toculmixdhyhbij8p2';
const AUTH_TOKEN = 'rmnpkjiczadvnn0807c1e5is3rvsjm';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar sessão
app.use(session({
    secret: 'secret-key', 
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }, // Sessão expira após 1 minuto (ajustável)
}));

app.set('view engine', 'ejs');
app.set('views', './views');

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

// Rota inicial para carregar o botão
app.get('/random-game', (req, res) => {
    res.render('random-game');
});

// Rota para buscar informações detalhadas de um jogo aleatório
app.get('/fetch-random-game', async (req, res) => {
    try {
        let validGame = null;

        while (!validGame) {
            const gameResponse = await axios.post(
                `${IGDB_BASE_URL}/games`,
                `fields cover, created_at, first_release_date, genres, involved_companies, name, platforms, screenshots, similar_games, summary, game_modes, multiplayer_modes;
                 sort created_at desc; 
                 where platforms = (6, 9, 12, 14, 34, 37, 39, 41, 48, 49, 130, 162, 163, 167, 169) 
                 & involved_companies != null 
                 & category != (1,2,3,4,5,6,7,10,11,12)
                 & similar_games >= 5; 
                 limit 1; offset ${Math.floor(Math.random() * 10001)};`,
                {
                    headers: {
                        'Client-ID': CLIENT_ID,
                        Authorization: `Bearer ${AUTH_TOKEN}`,
                    },
                }
            );

            const game = gameResponse.data[0];

            if (game.cover && game.screenshots && game.screenshots.length >= 3 && game.involved_companies && game.similar_games && game.similar_games.length >= 5) {
                validGame = game;
            }
        }

        // Detalhar o jogo
        const coverId = validGame.cover;
        const genreIds = validGame.genres || [];
        const platformIds = validGame.platforms || [];
        const screenshotIds = validGame.screenshots || [];

        const cover = coverId ? await fetchFromIGDB('covers', 'image_id', [coverId]) : [];
        const genres = genreIds.length ? await fetchFromIGDB('genres', 'name', genreIds) : [];
        const platforms = platformIds.length ? await fetchFromIGDB('platforms', 'name', platformIds) : [];
        const screenshots = screenshotIds.length ? await fetchFromIGDB('screenshots', 'image_id', screenshotIds) : [];

        const detailedGame = {
            name: validGame.name || 'N/A',
            first_release_date: validGame.first_release_date || 'N/A',
            summary: validGame.summary || 'N/A',
            cover: cover.length ? `https://images.igdb.com/igdb/image/upload/t_720p/${cover[0].image_id}.jpg` : null,
            genres: genres.map(g => g.name).join(', ') || 'N/A',
            platforms: platforms.map(p => p.name).join(', ') || 'N/A',
            screenshots: screenshots.map(sc => `https://images.igdb.com/igdb/image/upload/t_720p/${sc.image_id}.jpg`) || [],
        };

        res.render('surprise-game', { game: detailedGame });
    } catch (error) {
        console.error('Erro ao buscar jogo:', error.message);
        res.status(error.response?.status || 500).send('Erro ao carregar jogo.');
    }
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
});
