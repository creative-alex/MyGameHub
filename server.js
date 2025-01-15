const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'supersecretkey';

const IGDB_BASE_URL = 'https://api.igdb.com/v4';
const CLIENT_ID = '0h4zi8h0yj07toculmixdhyhbij8p2'; // Substituir pelo teu Client ID da IGDB
const AUTH_TOKEN = 'rmnpkjiczadvnn0807c1e5is3rvsjm'; // Substituir pelo teu Access Token da IGDB

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/js', express.static(path.join(__dirname, 'js')));



// Configuração do banco de dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'game_platform',
});

db.connect((err) => {
    if (err) console.error('Erro ao conectar ao banco de dados:', err.message);
    else console.log('Banco de dados conectado!');
});

// Middleware para autenticar o token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token inválido.' });
        req.user = user;
        next();
    });
}

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

// Rotas relacionadas ao IGDB
app.get('/random-game', (req, res) => {
    res.render('random-game');
});

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
                 & category != (1,2,3,4,5,6,7,10,11,12); 
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

        const game = validGame;
        const coverId = game.cover;
        const genreIds = game.genres || [];
        const platformIds = game.platforms || [];
        const screenshotIds = game.screenshots || [];

        const cover = coverId ? await fetchFromIGDB('covers', 'image_id', [coverId]) : [];
        const genres = genreIds.length ? await fetchFromIGDB('genres', 'name', genreIds) : [];
        const platforms = platformIds.length ? await fetchFromIGDB('platforms', 'name', platformIds) : [];
        const screenshots = screenshotIds.length ? await fetchFromIGDB('screenshots', 'image_id', screenshotIds) : [];

        const detailedGame = {
            name: game.name || 'N/A',
            first_release_date: game.first_release_date || 'N/A',
            summary: game.summary || 'N/A',
            cover: cover.length ? `https://images.igdb.com/igdb/image/upload/t_720p/${cover[0].image_id}.jpg` : null,
            genres: genres.map(g => g.name).join(', ') || 'N/A',
            platforms: platforms.map(p => p.name).join(', ') || 'N/A',
            screenshots: screenshots.map(sc => `https://images.igdb.com/igdb/image/upload/t_720p/${sc.image_id}.jpg`) || [],
        };

        res.render('game-details', { game: detailedGame });
    } catch (error) {
        console.error('Erro ao buscar jogo:', error.message);
        res.status(error.response?.status || 500).send('Erro ao carregar jogo.');
    }
});

// Rotas relacionadas a autenticação e usuário
app.get('/', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.render('index', { loggedIn: false });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.render('index', { loggedIn: false });
        }
        res.render('index', { loggedIn: true, username: user.username });
    });
});

// Rota de login
app.get('/login', (req, res) => {
    res.render('user/login'); 
});

app.post('/login', async (req, res) => {
    const { action, username, email, password, repeatPassword } = req.body;

    if (!action || !['login', 'register'].includes(action)) {
        return res.status(400).json({ message: 'Ação inválida. Use "login" ou "register".' });
    }

    if (action === 'register') {
        // Lógica para registro
        if (!username || !email || !password || !repeatPassword) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        if (password !== repeatPassword) {
            return res.status(400).json({ message: 'As senhas não coincidem.' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;

            db.query(query, [username, email, hashedPassword], (err) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ message: 'Email já está em uso.' });
                    }
                    return res.status(500).json({ message: 'Erro no servidor.' });
                }
                res.status(201).json({ message: 'Usuário registrado com sucesso!' });
            });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao registrar o usuário.' });
        }
    } else if (action === 'login') {
        // Lógica para login
        if (!email || !password) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        const query = `SELECT * FROM users WHERE email = ?`;

        db.query(query, [email], async (err, results) => {
            if (err) return res.status(500).json({ message: 'Erro no servidor.' });
            if (results.length === 0) return res.status(401).json({ message: 'Credenciais inválidas.' });

            const user = results[0];
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) return res.status(401).json({ message: 'Credenciais inválidas.' });

            const token = jwt.sign(
                { id: user.id, email: user.email, username: user.username },
                SECRET_KEY,
                { expiresIn: '1h' }
            );

            res.status(200).json({ message: 'Login bem-sucedido!', token });
        });
    }
});


app.get('/auth-status', authenticateToken, (req, res) => {
    res.status(200).json({ loggedIn: true, username: req.user.username });
});

app.get('/dashboard', authenticateToken, (req, res) => {
    res.render('dashboard', { username: req.user.username });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
