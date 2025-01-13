const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

const IGDB_BASE_URL = 'https://api.igdb.com/v4';
const CLIENT_ID = '0h4zi8h0yj07toculmixdhyhbij8p2'; // Substituir pelo teu Client ID
const AUTH_TOKEN = 'rmnpkjiczadvnn0807c1e5is3rvsjm'; // Substituir pelo teu Access Token

app.use(cors());
app.use(express.json());

// Função para buscar plataformas
async function fetchPlatforms() {
    try {
        const response = await axios.post(
            `${IGDB_BASE_URL}/platforms`,
            `fields id, name; limit 500;`, // Solicitar os campos desejados
            {
                headers: {
                    'Client-ID': CLIENT_ID,
                    Authorization: `Bearer ${AUTH_TOKEN}`,
                },
            }
        );
        return response.data; // Retorna os dados
    } catch (error) {
        console.error('Erro ao buscar plataformas:', error.response?.data || error.message);
        return [];
    }
}

// Rota para servir o arquivo HTML
app.get('/platforms', async (req, res) => {
    const filePath = path.join(__dirname, '..', 'views', 'platforms.html');  // Ajuste o caminho
    console.log('Caminho do arquivo HTML:', filePath); // Verifique se o caminho está correto

    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Erro ao carregar o arquivo HTML:', err);
            res.status(500).send('Erro ao carregar o arquivo HTML');
        }
    });
});

// Rota para retornar dados das plataformas
app.get('/platforms-data', async (req, res) => {
    const platforms = await fetchPlatforms();
    // Ordena os dados pelo 'id' de forma crescente
    platforms.sort((a, b) => a.id - b.id);
    res.json(platforms);  // Retorna as plataformas em formato JSON
    
});

app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});
