const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;

const IGDB_BASE_URL = 'https://api.igdb.com/v4/artworks';
const CLIENT_ID = '0h4zi8h0yj07toculmixdhyhbij8p2'; // Substituir pelo teu Client ID
const AUTH_TOKEN = 'rmnpkjiczadvnn0807c1e5is3rvsjm'; // Substituir pelo teu Access Token

app.use(cors());
app.use(express.json());

app.get('/languages', async (req, res) => {
  try {
    const response = await axios.post(
      IGDB_BASE_URL,
      'fields alpha_channel,animated,game,height,image_id,width; limit 5;',
      {
        headers: {
          'Client-ID': CLIENT_ID,
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      }
    );

    // Gerar URLs das imagens com base no image_id
    const imageBaseUrl = 'https://images.igdb.com/igdb/image/upload/';
    const imageSize = 't_720p'; // Tamanho da imagem (ex: t_720p, t_cover_big, etc.)
    const artworks = response.data.map(item => ({
      ...item,
      url: `${imageBaseUrl}${imageSize}/${item.image_id}.webp`,
    }));

    // Exibir os URLs no console
    const urls = artworks.map(item => item.url);
    console.log('URLs das artworks:', urls);

    res.json(artworks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao obter dados da IGDB.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor a funcionar em http://localhost:${PORT}`);
});
