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
    host: 'sql.freedb.tech',
    user: 'freedb_gamer',
    password: '54SvnP%AzT!Sr&2',
    database: 'freedb_my_game_hub',
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

          // Validar os critérios do jogo
          if (
              game &&
              game.cover?.image_id &&
              game.screenshots?.length >= 3 &&
              game.similar_games?.length >= 4
          ) {
              // Buscar detalhes dos jogos similares
              const similarGamesDetails = await fetchFromIGDB(
                  'games',
                  'id, name, summary, cover.image_id',
                  game.similar_games
              );

              similarGames = similarGamesDetails
                  .filter(similarGame => similarGame.cover?.image_id) // Filtrar apenas jogos com capa
                  .map(similarGame => ({
                      id: similarGame.id, // Adicionar o ID do jogo similar
                      name: similarGame.name || 'N/A',
                      summary: similarGame.summary || 'Resumo indisponível',
                      cover: `https://images.igdb.com/igdb/image/upload/t_cover_big/${similarGame.cover.image_id}.jpg`, // Gerar URL correta
                  }));

              if (similarGames.length >= 4) {
                  valid = true;
              }
          }
      }

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

      const gameId = await insertGameIfNotExists(game.id);

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

      const [genres, platforms, screenshots, gameModes] = await Promise.all([
          game.genres ? fetchFromIGDB('genres', 'name', game.genres).catch(() => []) : [],
          game.platforms ? fetchFromIGDB('platforms', 'name', game.platforms).catch(() => []) : [],
          game.screenshots ? fetchFromIGDB('screenshots', 'image_id', game.screenshots).catch(() => []) : [],
          game.game_modes ? fetchFromIGDB('game_modes', 'name', game.game_modes).catch(() => []) : [],
      ]);


      // Verificar e gerar a URL do cover do jogo principal
      const gameCoverUrl = game.cover?.image_id
          ? `https://images.igdb.com/igdb/image/upload/t_720p/${game.cover.image_id}.jpg`
          : null;

      const detailedGame = {
          gameId: game.id, // Adiciona o ID do jogo gerado
          name: game.name || 'N/A',
          first_release_date: game.first_release_date
              ? format(new Date(game.first_release_date * 1000), 'd MMMM yyyy')
              : 'N/A',
          summary: game.summary || 'N/A',
          cover: gameCoverUrl, // A URL do cover do jogo principal
          genres: genres.map(g => g.name).join(', ') || 'N/A',
          platforms: platforms.map(p => p.name).join(', ') || 'N/A',
          screenshots: screenshots.map(sc =>
              `https://images.igdb.com/igdb/image/upload/t_720p/${sc.image_id}.jpg`
          ),
          developers: developers.join(', ') || 'N/A',
          publishers: publishers.join(', ') || 'N/A',
          game_modes: gameModes.map(gm => gm.name).join(', ') || 'N/A',
          similar_games: similarGames, // Jogos similares filtrados e formatados
      };

      res.render('game', {
          game: detailedGame,
      });
  } catch (error) {
      console.error('Erro ao buscar jogo:', error.message);
      res.status(error.response?.status || 500).send('Erro ao carregar jogo.');
  }
});

let cachedGames = []; // Variável global para armazenar os jogos temporariamente

app.get('/game-details/:id', async (req, res) => {
  try {
    const gameId = req.params.id; // ID do jogo vindo da URL

    if (!gameId) {
        return res.status(400).send('ID do jogo não fornecido.');
    }

    // Verificar se o jogo já existe na tabela 'games'
    const checkGameQuery = 'SELECT id FROM games WHERE igdb_id = ?';
    const insertGameQuery = 'INSERT INTO games (igdb_id) VALUES (?)';

    db.query(checkGameQuery, [gameId], (err, results) => {
        if (err) {
            console.error('Erro ao verificar o jogo no banco:', err.message);
            return res.status(500).send('Erro no banco de dados.');
        }

        if (results.length === 0) {
            // Insere o jogo na tabela 'games' se ele não existir
            db.query(insertGameQuery, [gameId], (insertErr) => {
                if (insertErr) {
                    console.error('Erro ao inserir jogo no banco:', insertErr.message);
                } else {
                    console.log(`Jogo com igdb_id=${gameId} adicionado à tabela 'games'.`);
                }
            });
        }
    });

      if (!gameId) {
          return res.status(400).send('ID do jogo não fornecido.');
      }

      // Busca os detalhes do jogo específico pela API da IGDB
      const gameResponse = await axios.post(
          `${IGDB_BASE_URL}/games`,
          `fields cover.image_id, created_at, first_release_date, genres, involved_companies, name, platforms, screenshots, similar_games, summary, game_modes, multiplayer_modes;
           where id = ${gameId};`,
          {
              headers: {
                  'Client-ID': CLIENT_ID,
                  Authorization: `Bearer ${AUTH_TOKEN}`,
              },
          }
      );

      const game = gameResponse.data?.[0];
      const similarGamesIds = game.similar_games ;

      if (!game || !game.id) {
          return res.status(404).send('Jogo não encontrado.');
      }

      // Buscar detalhes dos jogos similares
      const similarGamesDetails = await fetchFromIGDB(
        'games',
        'id, name, summary, cover.image_id', // Inclua o 'id' aqui
        game.similar_games
    );
    

      const similarGames = similarGamesDetails
    .filter(similarGame => similarGame.cover?.image_id) 
    .map(similarGame => ({
        id: similarGame.id, // Adiciona o ID do jogo similar
        name: similarGame.name || 'N/A',
        summary: similarGame.summary || 'Resumo indisponível',
        cover: `https://images.igdb.com/igdb/image/upload/t_cover_big/${similarGame.cover.image_id}.jpg`,
    }));


      // Buscar detalhes de empresas envolvidas
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

      const [genres, platforms, screenshots, gameModes] = await Promise.all([
          game.genres ? fetchFromIGDB('genres', 'name', game.genres).catch(() => []) : [],
          game.platforms ? fetchFromIGDB('platforms', 'name', game.platforms).catch(() => []) : [],
          game.screenshots ? fetchFromIGDB('screenshots', 'image_id', game.screenshots).catch(() => []) : [],
          game.game_modes ? fetchFromIGDB('game_modes', 'name', game.game_modes).catch(() => []) : [],
      ]);


      // Gerar a URL do cover do jogo principal
      const gameCoverUrl = game.cover?.image_id
          ? `https://images.igdb.com/igdb/image/upload/t_720p/${game.cover.image_id}.jpg`
          : null;

      const detailedGame = {
          gamerId: game.id,
          name: game.name || 'N/A',
          first_release_date: game.first_release_date
              ? format(new Date(game.first_release_date * 1000), 'd MMMM yyyy')
              : 'N/A',
          summary: game.summary || 'N/A',
          cover: gameCoverUrl,
          genres: genres.map(g => g.name).join(', ') || 'N/A',
          platforms: platforms.map(p => p.name).join(', ') || 'N/A',
          screenshots: screenshots.map(sc =>
              `https://images.igdb.com/igdb/image/upload/t_720p/${sc.image_id}.jpg`
          ),
          developers: developers.join(', ') || 'N/A',
          publishers: publishers.join(', ') || 'N/A',
          game_modes: gameModes.map(gm => gm.name).join(', ') || 'N/A',
          similar_games: similarGames,
          similar_games_ids: similarGamesIds,
      };

      res.render('game', {
          game: detailedGame,
      });
  } catch (error) {
      console.error('Erro ao buscar detalhes do jogo:', error.message);
      res.status(error.response?.status || 500).send('Erro ao carregar detalhes do jogo.');
  }
});

app.get('/search', async (req, res) => {
  const { query, platform } = req.query;

  try {
    // Adicionar filtros à consulta com base na plataforma selecionada
    const platformFilter =
      platform !== 'all' ? `& platforms = (${platform})` : '& platforms = (6, 9, 12, 14, 34, 37, 39, 41, 48, 49, 130, 162, 163, 167, 169)';
    const searchQuery = `
      search "${query}";
      fields name, alternative_names.name, summary, cover.image_id;
      where involved_companies != null
        & category != (1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14)
        ${platformFilter};
      limit 10;
    `;

    // Enviar requisição para a IGDB
    const searchResponse = await axios.post(
      `${IGDB_BASE_URL}/games`,
      searchQuery,
      {
        headers: {
          'Client-ID': CLIENT_ID,
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      }
    );

    // Formatar os resultados para o frontend
    const results = searchResponse.data.map((game) => ({
      id: game.id,
      name: game.name || 'N/A',
      alternative_names: game.alternative_names?.map((alt) => alt.name).join(', ') || 'N/A',
      summary: game.summary || 'No description available.',
      cover: game.cover
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
        : '/images/placeholder.png',
    }));

    res.json(results);
  } catch (error) {
    console.error('Erro na busca:', error.message);
    res.status(500).send('Erro ao realizar a busca.');
  }
});


app.get('/category', async (req, res) => {
    const genreId = req.query.genre;
    const platformIds = req.query.platforms ? req.query.platforms.split(',').map(id => parseInt(id)) : [];
    try {
      const randomOffset = Math.floor(Math.random() * 5000);
  
      // Buscar os gêneros para obter os nomes
      const genresResponse = await axios.post(
        `${IGDB_BASE_URL}/genres`,
        `fields id, name; limit 500;`,
        {
          headers: {
            'Client-ID': CLIENT_ID,
            Authorization: `Bearer ${AUTH_TOKEN}`,
          },
        }
      );
      const genresMap = genresResponse.data.reduce((map, genre) => {
        map[genre.id] = genre.name;
        return map;
      }, {});
  
      // Buscar os jogos
      const response = await axios.post(
        `${IGDB_BASE_URL}/games`,
        `fields name, cover.image_id, summary, platforms.name, genres, artworks.image_id, screenshots.image_id, similar_games;
         where genres = ${genreId}
         & platforms = (${platformIds.join(',') || '6, 9, 12, 14, 34, 37, 39, 41, 48, 49, 130, 162, 163, 167, 169'})
         & involved_companies != null
         & category != (1,2,3,4,5,6,7,10,11,12,13,14)
         & cover != null
         & screenshots != null
         & artworks != null;
         limit 30;`,
        {
          headers: {
            'Client-ID': CLIENT_ID,
            Authorization: `Bearer ${AUTH_TOKEN}`,
          },
        }
      );
  
      // Processar os dados dos jogos
      const games = response.data
        .filter(game =>
          game.name &&
          game.cover &&
          game.cover.image_id &&
          game.screenshots && game.screenshots.length >= 4 &&
          game.artworks && game.artworks.length > 0
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
            ? game.platforms.map(platform => ({ id: platform.id, name: platform.name }))
            : [],
          genres: game.genres ? game.genres.map(genreId => genresMap[genreId]) : [], // Substituir IDs pelos nomes
          similarGames: game.similar_games || [],
        }));
  
      // Remover duplicados e dividir os jogos
      const uniqueGames = games.filter((game, index, self) =>
        index === self.findIndex(g => g.id === game.id)
      );
  
      const popularGames = uniqueGames.slice(0, 14); // Primeiros 14 jogos
      const allGames = uniqueGames.slice(14); // Restantes, sem incluir os populares
  
      res.render('category', { popularGames, allGames });
    } catch (error) {
      console.error('Erro ao buscar jogos por categoria:', error.message);
      res.status(500).send('Erro ao carregar a categoria.');
    }
});

app.get('/platform-games/:platformId', async (req, res) => {
  const platformId = parseInt(req.params.platformId); // Obter o ID da plataforma da URL
  try {
    const randomOffset = Math.floor(Math.random() * 5000);

    // Buscar os jogos por plataforma
    const response = await axios.post(
      `${IGDB_BASE_URL}/games`,
      `fields name, cover.image_id, summary, platforms.name, genres, artworks.image_id, screenshots.image_id, similar_games;
       where platforms = (${platformId})
       & involved_companies != null
       & category != (1,2,3,4,5,6,7,10,11,12,13,14)
       & cover != null
       & screenshots != null
       & artworks != null;
       limit 30;`,
      {
        headers: {
          'Client-ID': CLIENT_ID,
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      }
    );

    // Processar os dados dos jogos
    const games = response.data
      .filter(game =>
        game.name &&
        game.cover &&
        game.cover.image_id &&
        game.screenshots && game.screenshots.length >= 4 &&
        game.artworks && game.artworks.length > 0
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
          ? game.platforms.map(platform => ({ id: platform.id, name: platform.name }))
          : [],
        genres: game.genres || [], // IDs dos gêneros
        similarGames: game.similar_games || [],
      }));

    // Remover duplicados
    const uniqueGames = games.filter((game, index, self) =>
      index === self.findIndex(g => g.id === game.id)
    );

    // Dividir jogos em populares e restantes
    const popularGames = uniqueGames.slice(0, 14); // Primeiros 14 jogos
    const allGames = uniqueGames.slice(14); // Restantes

    // Renderizar a página com os jogos divididos
    res.render('category', { platformId, popularGames, allGames });
  } catch (error) {
    console.error('Erro ao buscar jogos por plataforma:', error.message);
    res.status(500).send('Erro ao carregar os jogos da plataforma.');
  }
});

app.get('/top-rated-games', async (req, res) => {
  try {
    const allGames = [];
    let offset = 0;
    const limit = 500; // Número de jogos buscados por requisição (máximo permitido pela IGDB)

    // Busca paginada para acessar todos os jogos na base da IGDB
    while (true) {
      const response = await axios.post(
        `${IGDB_BASE_URL}/games`,
        `fields name, rating, rating_count, first_release_date, platforms.name, cover.image_id;
         where rating_count >= 1000 & rating != null;
         limit ${limit};
         offset ${offset};`,
        {
          headers: {
            'Client-ID': CLIENT_ID,
            Authorization: `Bearer ${AUTH_TOKEN}`,
          },
        }
      );

      const games = response.data;

      if (games.length === 0) break; // Para o loop quando não há mais jogos para buscar

      allGames.push(...games);
      offset += limit; // Incrementa o offset para a próxima página
    }

    // Ordenar os jogos por rating em ordem decrescente
    const sortedGames = allGames.sort((a, b) => b.rating - a.rating);

    // Mapear apenas os dados necessários
    const detailedGames = sortedGames.map(game => ({
      name: game.name || 'N/A',
      rating: game.rating ? game.rating.toFixed(1) : 'N/A',
      rating_count: game.rating_count || 0,
      first_release_date: game.first_release_date
        ? format(new Date(game.first_release_date * 1000), 'd MMMM yyyy')
        : 'N/A',
      platforms: game.platforms
        ? game.platforms.map(p => p.name).join(', ')
        : 'N/A',
      cover: game.cover?.image_id
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
        : 'https://via.placeholder.com/120x170?text=Sem+Capa',
    }));

    // Renderizar os dados no template "top.ejs"
    res.render('top-games', {
      games: detailedGames,
    });
  } catch (error) {
    console.error('Erro ao buscar os jogos:', error.message);
    res.status(error.response?.status || 500).send('Erro ao carregar os jogos.');
  }
});

// Estabelece conexão com o banco de dados e trata erros
// Verifica se a conexão inicial ao banco é bem-sucedida e exibe mensagens de erro, caso contrário.
db.connect((err) => {
    if (err) console.error('Erro ao conectar ao banco de dados:', err.message);
    else console.log('Banco de dados conectado!');
});

// Rota de registro
app.post('/register', async (req, res) => {
  const { username, email, password, repeatPassword } = req.body;

  // Validações de entrada
  if (!username || !email || !password || !repeatPassword) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  if (password !== repeatPassword) {
      return res.status(400).json({ message: 'As senhas não coincidem.' });
  }

  try {
      // Verifica se o e-mail já está registrado
      const [existingUser] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUser.length > 0) {
          return res.status(400).json({ message: 'E-mail já está registrado.' });
      }

      // Criptografa a senha e registra o usuário
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

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  try {
      // Verifica o e-mail no banco de dados
      const [user] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
      if (user.length === 0) {
          return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
      }

      const foundUser = user[0];
      const passwordMatch = await bcrypt.compare(password, foundUser.password);
      if (!passwordMatch) {
          return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
      }

      // Gera o token JWT
      const token = jwt.sign(
          { id: foundUser.id, username: foundUser.username },
          SECRET_KEY,
          { expiresIn: '1h' }
      );

      res.status(200).json({ message: 'Login bem-sucedido!', token, username: foundUser.username });
  } catch (err) {
      console.error('Erro ao realizar login:', err.message);
      res.status(500).json({ message: 'Erro ao realizar login.' });
  }
});

app.get('/profile/:userId', (req, res) => {
  const userId = req.params.userId;

  // 1. Consultar os dados do usuário
  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, userResult) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro ao acessar os dados do usuário.');
    }

    if (!userResult || userResult.length === 0) {
      return res.status(404).send('Usuário não encontrado.');
    }

    const user = userResult[0];

    // 2. Obter os jogos do usuário e o status
    db.query(`
      SELECT user_games.game_status, games.*
      FROM user_games
      JOIN games ON user_games.game_id = games.igdb_id
      WHERE user_games.user_id = ?
    `, [userId], (err, userGamesResult) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Erro ao acessar os jogos do usuário.');
      }

      // Filtrar os jogos por status
      const currentGames = userGamesResult.filter(game => game.game_status === 'current');
      const completedGames = userGamesResult.filter(game => game.game_status === 'completed');
      const wishlistedGames = userGamesResult.filter(game => game.game_status === 'wishlisted');
      const droppedGames = userGamesResult.filter(game => game.game_status === 'dropped');
      const onHoldGames = userGamesResult.filter(game => game.game_status === 'on_hold');

      // 3. Consultar as análises feitas pelo usuário (opcional)
      db.query(`
        SELECT reviews.*, games.*
        FROM reviews
        JOIN games ON reviews.game_id = games.id
        WHERE reviews.user_id = ?
      `, [userId], (err, reviewsResult) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Erro ao acessar as análises do usuário.');
        }

        // 4. Consultar as classificações de jogos (opcional)
        db.query(`
          SELECT user_game_rating.*, games.*
          FROM user_game_rating
          JOIN games ON user_game_rating.game_id = games.id
          WHERE user_game_rating.user_id = ?
        `, [userId], (err, ratingsResult) => {
          if (err) {
            console.error(err);
            return res.status(500).send('Erro ao acessar as classificações dos jogos.');
          }

          // Dados prontos, renderizando a página
          res.render('user/profile-test', { 
            user, 
            currentGames, 
            completedGames, 
            wishlistedGames, 
            droppedGames, 
            onHoldGames, 
            reviewsResult, 
            ratingsResult
          });
        });
      });
    });
  });
});




// Middleware para verificar autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const user = jwt.verify(token, SECRET_KEY); // Substitua `SECRET_KEY` por sua chave secreta
    req.user = user; // Adiciona os dados do usuário à requisição
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};

// Rota para verificar se o usuário está autenticado
app.get('/check-auth', authenticateToken, (req, res) => {
  res.status(200).json({ username: req.user.username });
});

app.post('/user/add-to-list', authenticateToken, async (req, res) => {
  const { gameId } = req.body; // Esse gameId corresponde ao igdb_id
  const userId = req.user.id; // ID do usuário autenticado

  try {
      // Buscar o ID correto do jogo (id) na tabela games com base no igdb_id
      const [rows] = await db.promise().query('SELECT id FROM games WHERE igdb_id = ?', [gameId]);
      if (rows.length === 0) {
          return res.status(404).json({ message: 'Jogo não encontrado.' });
      }

      const gameDatabaseId = rows[0].id; // Pegar o ID correto do banco de dados

      // Inserir o jogo na lista do usuário
      await db.promise().query(
          `INSERT INTO user_games (user_id, game_id, game_status) 
           VALUES (?, ?, 'current') 
           ON DUPLICATE KEY UPDATE game_status = 'current'`,
          [userId, gameDatabaseId]
      );

      res.status(200).json({ message: 'Jogo adicionado à lista com sucesso!' });
  } catch (error) {
      console.error('Erro ao adicionar jogo à lista:', error.message);
      res.status(500).json({ message: 'Erro ao adicionar jogo à lista.' });
  }
});


app.post('/user/add-to-favorites', authenticateToken, async (req, res) => {
  const { gameId } = req.body; // Esse gameId corresponde ao igdb_id
  const userId = req.user.id; // ID do usuário autenticado

  try {
    // Buscar o ID correto do jogo (id) na tabela games com base no igdb_id
    const [rows] = await db.promise().query('SELECT id FROM games WHERE igdb_id = ?', [gameId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Jogo não encontrado.' });
    }

    const gameDatabaseId = rows[0].id; // Pegar o ID correto do banco de dados

    // Inserir ou atualizar o status de favorito para o jogo do usuário
    await db.promise().query(
      `INSERT INTO user_games (user_id, game_id, game_status, is_favorite) 
       VALUES (?, ?, 'current', 1) 
       ON DUPLICATE KEY UPDATE is_favorite = 1`,
      [userId, gameDatabaseId]
    );

    res.status(200).json({ message: 'Jogo adicionado aos favoritos com sucesso!' });
  } catch (error) {
    console.error('Erro ao adicionar jogo aos favoritos:', error.message);
    res.status(500).json({ message: 'Erro ao adicionar jogo aos favoritos.' });
  }
});



// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor iniciado em http://localhost:${PORT}`);
});