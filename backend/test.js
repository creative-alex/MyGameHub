const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;

const IGDB_BASE_URL = 'https://api.igdb.com/v4/language_supports'; // Corrigido o endpoint
const CLIENT_ID = '0h4zi8h0yj07toculmixdhyhbij8p2'; // Substituir pelo teu Client ID
const AUTH_TOKEN = 'rmnpkjiczadvnn0807c1e5is3rvsjm'; // Substituir pelo teu Access Token

app.use(cors());
app.use(express.json());

app.get('/languages', async (req, res) => {
  try {
    const response = await axios.post(
      IGDB_BASE_URL,
      'fields game,language,language_support_type; limit 500; where language = (7, 8, 9, 10, 20, 21);', // Limite aumentado para 500
      {
        headers: {
          'Client-ID': CLIENT_ID,
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao obter dados da IGDB.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor a funcionar em http://localhost:${PORT}`);
});
