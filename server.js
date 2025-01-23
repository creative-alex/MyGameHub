const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const bodyParser = require('body-parser');
const { format } = require('date-fns'); 
require('dotenv').config();

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkey';

// Configuração da API IGDB
const IGDB_BASE_URL = 'https://api.igdb.com/v4';
const CLIENT_ID = process.env.IGDB_CLIENT_ID || 'teu_client_id';
const AUTH_TOKEN = process.env.IGDB_AUTH_TOKEN || 'teu_access_token';

// Configuração do Express
app.set('view engine', 'ejs'); // Define o motor de visualização como EJS
app.set('views', path.join(__dirname, 'views')); // Define o diretório das views

app.use(express.static(path.join(__dirname, 'public'))); // Servir arquivos estáticos
app.use(cors()); // Ativa o CORS para permitir requisições de outras origens
app.use(express.json()); // Para processar JSON
app.use(bodyParser.json()); // Middleware para parsing do corpo das requisições
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


// Função genérica para buscar dados da API IGDB
// Facilita consultas dinâmicas para diferentes endpoints e parâmetros.
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

// Renderiza a página do jogo
app.get('/game', (req, res) => {
    res.render('game'); // game.ejs será procurado dentro da pasta 'views'
});

// Rota para buscar um jogo aleatório
app.get('/randomGame', async (req, res) => {
    try {
        const totalGames = 10000; // Número estimado de jogos
        if (totalGames <= 0) {
            return res.status(404).send('Nenhum jogo disponível após os filtros.');
        }

        let game = null;
        let similarGames = [];
        let valid = false;

        while (!valid) {
            const randomOffset = Math.floor(Math.random() * totalGames);

            // Busca um jogo aleatório da IGDB
            const gameResponse = await axios.post(
                `${IGDB_BASE_URL}/games`,
                `fields  cover.image_id, created_at, first_release_date, genres, involved_companies, name, platforms, screenshots, similar_games, summary, game_modes, multiplayer_modes;
                 sort created_at desc;
                 where platforms = (6, 9, 12, 14, 34, 37, 39, 41, 48, 49, 130, 162, 163, 167, 169)
                 & involved_companies != null
                 & category != (1,2,3,4,5,6,7,10,11,12,13,14);
                 limit 1; offset ${randomOffset};`,
                {
                    headers: {
                        'Client-ID': CLIENT_ID,
                        Authorization: `Bearer ${AUTH_TOKEN}`,
                    },
                }
            );

            game = gameResponse.data?.[0];

            // Validar os critérios do jogo:
            if (
                game &&
                game.cover?.image_id &&
                game.screenshots?.length >= 3 &&
                game.similar_games?.length >= 4
            ) {
                // Buscar detalhes dos jogos similares
                const similarGamesDetails = await fetchFromIGDB(
                    'games',
                    'name, summary, cover.image_id',
                    game.similar_games
                );

                similarGames = similarGamesDetails
                    .filter(similarGame => similarGame.cover?.image_id) // Filtrar apenas jogos com capa
                    .map(similarGame => ({
                        name: similarGame.name || 'N/A',
                        summary: similarGame.summary || 'Resumo indisponível',
                        cover: `https://images.igdb.com/igdb/image/upload/t_cover_big/${similarGame.cover.image_id}.jpg`, // Gerar URL correta
                    }));

                if (similarGames.length >= 4) {
                    valid = true;

                    // Log para depuração (opcional)
                    console.log('Jogos similares validados:', similarGames);
                }
            }
        }

        // Carregar os detalhes do jogo encontrado
        const involvedCompaniesDetails = await fetchFromIGDB(
            'involved_companies',
            'company,developer,publisher',
            game.involved_companies
        );

        const companyIds = involvedCompaniesDetails.map(ic => ic.company);
        const companyDetails = await fetchFromIGDB('companies', 'name', companyIds);

        const companies = involvedCompaniesDetails.map(ic => {
            const company = companyDetails.find(c => c.id === ic.company);
            return {
                name: company?.name || 'N/A',
                developer: ic.developer || false,
                publisher: ic.publisher || false,
            };
        });

        const developers = companies.filter(c => c.developer).map(c => c.name);
        const publishers = companies.filter(c => c.publisher).map(c => c.name);

        const [cover, genres, platforms, screenshots, gameModes] = await Promise.all([
            game.cover ? fetchFromIGDB('covers', 'image_id', [game.cover.image_id]).catch(() => []) : [],
            game.genres ? fetchFromIGDB('genres', 'name', game.genres).catch(() => []) : [],
            game.platforms ? fetchFromIGDB('platforms', 'name', game.platforms).catch(() => []) : [],
            game.screenshots ? fetchFromIGDB('screenshots', 'image_id', game.screenshots).catch(() => []) : [],
            game.game_modes ? fetchFromIGDB('game_modes', 'name', game.game_modes).catch(() => []) : [],
        ]);

        const limitedScreenshots = screenshots.slice(0, 3);

        // Verificar e gerar a URL do cover do jogo principal
        const gameCoverUrl = game.cover?.image_id
            ? `https://images.igdb.com/igdb/image/upload/t_720p/${game.cover.image_id}.jpg`
            : null;

            if (!game || !game.id) {
                return res.status(500).send('Erro: Jogo não definido ou ID ausente.');
            }
            
            const detailedGame = {
                gamerId: game.id, // Adiciona o ID do jogo gerado
                name: game.name || 'N/A',
                first_release_date: game.first_release_date
                    ? format(new Date(game.first_release_date * 1000), 'd MMMM yyyy')
                    : 'N/A',
                summary: game.summary || 'N/A',
                cover: gameCoverUrl, // A URL do cover do jogo principal
                genres: genres.map(g => g.name).join(', ') || 'N/A',
                platforms: platforms.map(p => p.name).join(', ') || 'N/A',
                screenshots: limitedScreenshots.map(sc =>
                    `https://images.igdb.com/igdb/image/upload/t_720p/${sc.image_id}.jpg`
                ),
                developers: developers.join(', ') || 'N/A',
                publishers: publishers.join(', ') || 'N/A',
                game_modes: gameModes.map(gm => gm.name).join(', ') || 'N/A',
                similar_games: similarGames, // Jogos similares filtrados e formatados
            };
            
        // Buscar comentários do jogo
        const buscarComentarios = async (gameId) => {
            return new Promise((resolve, reject) => {
                db.query(
                    'SELECT r.rating, r.review_text, r.is_recommended, u.username FROM reviews r INNER JOIN users u ON r.user_id = u.id WHERE r.game_id = ?',
                    [gameId],
                    (err, results) => {
                        if (err) {
                            console.error('Erro ao buscar comentários:', err);
                            return reject(err);
                        }
                        resolve(results);
                    }
                );
            });
        };

        // Inserir jogo na base de dados, caso não exista
        const insertGameIfNotExists = async (igdbId) => {
            return new Promise((resolve, reject) => {
                db.query(
                    `INSERT INTO games (igdb_id) VALUES (?)
                     ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);`,
                    [igdbId],
                    (err, result) => {
                        if (err) {
                            console.error('Erro ao inserir jogo:', err);
                            return reject(err);
                        }
                        resolve(result.insertId);
                    }
                );
            });
        };

        const gameId = await insertGameIfNotExists(
            game.id,
        );

        const comentarios = await buscarComentarios(gameId).catch(() => []);

        res.render('game', {
            game: detailedGame,
            comentarios,
        });
    } catch (error) {
        console.error('Erro ao buscar jogo:', error.message);
        res.status(error.response?.status || 500).send('Erro ao carregar jogo.');
    }
});

app.get('/category', async (req, res) => {
    const genreId = req.query.genre; // Captura o ID da categoria da query string
    try {
        // Gera um número aleatório para o offset (assumindo um máximo de 500 jogos no gênero)
        const randomOffset = Math.floor(Math.random() * 500);

        // Consulta à API da IGDB para buscar jogos por gênero com os filtros adicionais
        const response = await axios.post(
            `${IGDB_BASE_URL}/games`,
            `fields name, cover.image_id, summary, platforms.name, genres, artworks.image_id, screenshots.image_id;
             where genres = ${genreId}
             & platforms = (6, 9, 12, 14, 34, 37, 39, 41, 48, 49, 130, 162, 163, 167, 169)
             & involved_companies != null
             & category != (1,2,3,4,5,6,7,10,11,12,13,14)
             & cover != null
             & screenshots != null
             & artworks != null;
             limit 20;
             offset ${randomOffset};`,
            {
                headers: {
                    'Client-ID': CLIENT_ID,
                    Authorization: `Bearer ${AUTH_TOKEN}`,
                },
            }
        );

        // Processar os jogos e filtrar apenas os válidos
        const games = response.data
            .filter(game => 
                game.name && // Verifica se o nome do jogo está presente
                game.cover && game.cover.image_id && // Verifica se há uma capa
                game.screenshots && game.screenshots.length >= 4 && // Verifica se há pelo menos 4 screenshots
                game.artworks && game.artworks.length > 0 // Verifica se há pelo menos um artwork
            )
            .map(game => ({
                id: game.id,
                name: game.name,
                cover: `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`,
                artwork: `https://images.igdb.com/igdb/image/upload/t_screenshot_big/${game.artworks[0].image_id}.jpg`,
                screenshots: game.screenshots.map(
                    screenshot =>
                        `https://images.igdb.com/igdb/image/upload/t_screenshot_big/${screenshot.image_id}.jpg`
                ),
                summary: game.summary || 'Descrição indisponível',
                platforms: game.platforms
                    ? game.platforms.map(platform => platform.name)
                    : [],
            }));

        // Renderizar a página da categoria
        if (games.length > 0) {
            res.render('category', { games });
        } else {
            // Caso nenhum jogo seja válido
            res.status(404).send('Nenhum jogo válido encontrado para esta categoria.');
        }
    } catch (error) {
        console.error('Erro ao buscar jogos por categoria:', error.message);
        res.status(500).send('Erro ao carregar a categoria.');
    }
});

app.get('/genres-categories', async (req, res) => {
    try {
        // Consulta à API da IGDB para buscar todos os gêneros
        const genresResponse = await axios.post(
            `${IGDB_BASE_URL}/genres`,
            `fields id, name;
             limit 100;`, // Limite de 100 gêneros
            {
                headers: {
                    'Client-ID': CLIENT_ID,
                    Authorization: `Bearer ${AUTH_TOKEN}`,
                },
            }
        );

        // Consulta à API da IGDB para buscar todas as categorias
        const categoriesResponse = await axios.post(
            `${IGDB_BASE_URL}/game_modes`,
            `fields id, name;
             limit 100;`, // Limite de 100 categorias
            {
                headers: {
                    'Client-ID': CLIENT_ID,
                    Authorization: `Bearer ${AUTH_TOKEN}`,
                },
            }
        );

        // Organizar os dados
        const genres = genresResponse.data.map(genre => ({
            id: genre.id,
            name: genre.name,
        }));

        const categories = categoriesResponse.data.map(category => ({
            id: category.id,
            name: category.name,
        }));

        // Renderizar a página com os gêneros e categorias
        res.render('genres-categories', { genres, categories });
    } catch (error) {
        console.error('Erro ao buscar gêneros e categorias:', error.message);
        res.status(500).send('Erro ao carregar os gêneros e categorias.');
    }
});





// Estabelece conexão com o banco de dados e trata erros
// Verifica se a conexão inicial ao banco é bem-sucedida e exibe mensagens de erro, caso contrário.
db.connect((err) => {
    if (err) console.error('Erro ao conectar ao banco de dados:', err.message);
    else console.log('Banco de dados conectado!');
});

// Rota de registro de novos usuários
// Valida os dados recebidos, verifica duplicação de e-mail e registra o usuário no banco de dados.
app.post('/register', async (req, res) => {
    const { username, email, password, repeatPassword } = req.body;

    if (!username || !email || !password || !repeatPassword) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    if (password !== repeatPassword) {
        return res.status(400).json({ message: 'As senhas não coincidem.' });
    }

    try {
        const [existingUser] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'E-mail já está registrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.promise().query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [
            username,
            email,
            hashedPassword,
        ]);

        res.status(201).json({ message: 'Registro bem-sucedido! Você já pode fazer login.' });
    } catch (error) {
        console.error('Erro no registro:', error.message);
        res.status(500).json({ message: 'Erro no servidor. Tente novamente mais tarde.' });
    }
});

// Rota de login
// Verifica credenciais do usuário e autentica se as informações forem válidas.
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

        const token = jwt.sign(
            { id: foundUser.id, username: foundUser.username },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: 'Login bem-sucedido!', token, username: foundUser.username });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao realizar login.' });
    }
});



app.get('/check-auth', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const user = jwt.verify(token, SECRET_KEY);
        res.status(200).json({ username: user.username });
    } catch (err) {
        res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
});

// Endpoint para adicionar à lista
app.post('/add-to-list', (req, res) => {
    const { gameId } = req.body;
    const query = 'INSERT INTO user_games (game_id) VALUES (?)';
  
    db.query(query, [gameId], (error, results) => {
      if (error) {
        console.error('Erro ao inserir na lista:', error);
        return res.json({ success: false, message: 'Erro ao adicionar à lista.' });
      }
      res.json({ success: true, message: 'Jogo adicionado à lista com sucesso.' });
    });
  });
  
  // Endpoint para adicionar aos favoritos
  app.post('/add-to-favorites', (req, res) => {
    const { gameId } = req.body;
    const query = 'INSERT INTO fav_games (game_id) VALUES (?)';
  
    db.query(query, [gameId], (error, results) => {
      if (error) {
        console.error('Erro ao inserir nos favoritos:', error);
        return res.json({ success: false, message: 'Erro ao adicionar aos favoritos.' });
      }
      res.json({ success: true, message: 'Jogo adicionado aos favoritos com sucesso.' });
    });
  });





// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor iniciado em http://localhost:${PORT}`);
});