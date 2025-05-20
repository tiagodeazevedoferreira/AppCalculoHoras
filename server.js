const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 3001;

// Middleware para permitir CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

// Middleware para parsear JSON
app.use(express.json());

// URL do Google Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwrgqXQ138YEoruV6LOzgB1rQTk0zkINdjcqNCYYhIN43X1qWIMW5NBteQjTiBmdHu0Cw/exec';

// Rota para carregar os dados (GET)
app.get('/load', async (req, res) => {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'GET',
      redirect: 'follow'
    });
    if (!response.ok) {
      throw new Error(`Erro na requisição GET: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    res.status(500).json({ error: 'Erro ao carregar dados' });
  }
});

// Rota para salvar os dados (POST)
app.post('/save', async (req, res) => {
  try {
    const data = req.body;
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`Erro na requisição POST: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error('Erro ao salvar dados:', err);
    res.status(500).json({ error: 'Erro ao salvar dados' });
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});