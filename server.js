const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkey';

// Configuração da API IGDB
const IGDB_BASE_URL = 'https://api.igdb.com/v4';
const CLIENT_ID = process.env.IGDB_CLIENT_ID || 'teu_client_id';
const AUTH_TOKEN = process.env.IGDB_AUTH_TOKEN || 'teu_access_token';

// Configuração do Express
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
    host: 'sql7.freesqldatabase.com',
    user: 'sql7758514',
    password: 's9VaqTkalD',
    database: 'sql7758514',
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

// Rota base
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/game', (req, res) => {
    res.render('game');  // game.ejs será procurado dentro da pasta 'views'
  });

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
                 & category != (1,2,3,4,5,6,7,10,11,12,13,14); 
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
        const [cover, genres, platforms, screenshots] = await Promise.all([
            game.cover ? fetchFromIGDB('covers', 'image_id', [game.cover]) : [],
            game.genres ? fetchFromIGDB('genres', 'name', game.genres) : [],
            game.platforms ? fetchFromIGDB('platforms', 'name', game.platforms) : [],
            game.screenshots ? fetchFromIGDB('screenshots', 'image_id', game.screenshots) : [],
        ]);

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

app.get('/search', async (req, res) => {
    const searchQuery = req.query.q;
    const platform = req.query.platform;
  
    // Verifica se o termo de pesquisa foi fornecido
    if (!searchQuery) {
      return res.status(400).json({ message: 'Por favor, insira um termo de pesquisa.' });
    }
  
    // Mapeamento das plataformas para IDs do IGDB
    const platformMap = {
      pc: [6, 14, 162, 163], // IDs de PC
      console: [9, 12, 48, 49, 167, 169, 41, 130, 37], // IDs de consoles
      mobile: [34, 39], // IDs de Mobile
    };
  
    const platformIds = platform && platformMap[platform] ? platformMap[platform] : null;
  
    try {
      // Constrói o filtro de plataforma, se aplicável
      const platformFilter = platformIds ? `& platforms = (${platformIds.join(',')})` : '';
  
      // Faz a solicitação para o IGDB
      const response = await axios.post(
        `${IGDB_BASE_URL}/games`,
        `fields name, cover.image_id, summary, alternative_names.name; 
         search "${searchQuery}"; 
         where cover != null & summary != null ${platformFilter}
           & category != (1,2,3,4,5,6,7,10,11,12,13,14) 
           & involved_companies != null; 
         limit 10;`,
        {
          headers: {
            'Client-ID': CLIENT_ID,
            Authorization: `Bearer ${AUTH_TOKEN}`,
          },
        }
      );
  
      // Mapeia os resultados
      const games = response.data.map((game) => ({
        id: game.id,
        name: game.name,
        alternativeNames: game.alternative_names?.map((name) => name.name) || [],
        summary: game.summary,
        cover: game.cover
          ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
          : '/images/placeholder.png',
      }));
  
      res.json(games);
    } catch (error) {
      console.error('Erro ao buscar jogos:', error.message);
      res.status(500).json({ message: 'Erro ao realizar a pesquisa.' });
    }
  });
  

app.post('/register', async (req, res) => {
    const { username, email, password, repeatPassword } = req.body;

    // Validar campos obrigatórios
    if (!username || !email || !password || !repeatPassword) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    // Validar se as senhas coincidem
    if (password !== repeatPassword) {
        return res.status(400).json({ message: 'As senhas não coincidem.' });
    }

    try {
        // Verificar se o e-mail já está registrado
        const [existingUser] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'E-mail já está registrado.' });
        }

        // Criar hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserir o usuário no banco de dados
        await db.promise().query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [
            username,
            email,
            hashedPassword,
        ]);

        return res.status(201).json({ message: 'Registro bem-sucedido! Você já pode fazer login.' });
    } catch (error) {
        console.error('Erro no registro:', error.message);
        return res.status(500).json({ message: 'Erro no servidor. Tente novamente mais tarde.' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [user] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
        }

        const foundUser = user[0];
        const passwordMatch = await bcrypt.compare(password, foundUser.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
        }

        // Retorna o nome de usuário junto com a mensagem de sucesso
        res.status(200).json({ message: 'Login bem-sucedido!', username: foundUser.username });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao realizar login.' });
    }
});



// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor iniciado em http://localhost:${PORT}`);
});
