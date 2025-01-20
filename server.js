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
                `fields cover.image_id, created_at, first_release_date, genres, involved_companies, name, platforms, screenshots, similar_games, summary, game_modes, multiplayer_modes;
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

        const detailedGame = {
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

        res.render('game', { game: detailedGame });
    } catch (error) {
        console.error('Erro ao buscar jogo:', error.message);
        res.status(error.response?.status || 500).send('Erro ao carregar jogo.');
    }
});





// Configuração do banco de dados
const db = mysql.createConnection({
    host: 'sql7.freesqldatabase.com',
    user: 'sql7758514',
    password: 's9VaqTkalD',
    database: 'sql7758514',
});

// Estabelece conexão com o banco de dados e trata erros
// Verifica se a conexão inicial ao banco é bem-sucedida e exibe mensagens de erro, caso contrário.
db.connect((err) => {
    if (err) console.error('Erro ao conectar ao banco de dados:', err.message);
    else console.log('Banco de dados conectado!');
});

// Middleware para autenticar o token
// Valida o token JWT presente no cabeçalho de autorização da requisição.
// Se válido, o token é decodificado e as informações do usuário são anexadas ao objeto da requisição.
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

// Rota de busca de jogos com filtro por plataforma e validações.
// Permite buscar jogos no IGDB com base em critérios fornecidos pelo usuário.
app.get('/search', async (req, res) => {
    const searchQuery = req.query.q; // Termo de pesquisa
    const platform = req.query.platform; // Plataforma específica opcional
  
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
  
      // Faz a solicitação para o IGDB com filtros e critérios definidos
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
  
      // Formata os resultados da API em um formato mais simples para o cliente
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
  

// Rota de registro de novos usuários
// Valida os dados recebidos, verifica duplicação de e-mail e registra o usuário no banco de dados.
// Agora retorna um token JWT após o registro.
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

        // Criar hash da senha para armazenamento seguro
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserir o usuário no banco de dados
        await db.promise().query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [
            username,
            email,
            hashedPassword,
        ]);

        // Gerar um token JWT para o usuário registrado
        const token = jwt.sign({ username, email }, SECRET_KEY, { expiresIn: '1h' });

        return res.status(201).json({ message: 'Registro bem-sucedido! Você já pode fazer login.', token });
    } catch (error) {
        console.error('Erro no registro:', error.message);
        return res.status(500).json({ message: 'Erro no servidor. Tente novamente mais tarde.' });
    }
});

// Rota de login
// Verifica credenciais do usuário e autentica se as informações forem válidas.
// Agora retorna um token JWT após o login bem-sucedido.
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

        // Gerar um token JWT para o usuário autenticado
        const token = jwt.sign({ username: foundUser.username, email: foundUser.email }, SECRET_KEY, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login bem-sucedido!', token });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao realizar login.' });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor iniciado em http://localhost:${PORT}`);
});