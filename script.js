// Arquivo: tailwind.config.js
module.exports = {
  content: ["./index.html", "./script.js"],
  theme: {
    extend: {},
  },
  plugins: [],
};

// Arquivo: server.js
const express = require('express');
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

// Endpoint fictício para simular dados
const mockData = {
  entryTime: '08:00',
  lunchStart: '12:00',
  lunchEnd: '13:00'
};

// Rota para carregar os dados (GET)
app.get('/load', (req, res) => {
  res.json(mockData);
});

// Rota para salvar os dados (POST)
app.post('/save', (req, res) => {
  console.log('Dados recebidos:', req.body);
  res.json({ status: 'Dados salvos com sucesso!' });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

// Arquivo: script.js
document.addEventListener('DOMContentLoaded', () => {
  const entryTime = document.getElementById('entryTime');
  const lunchStart = document.getElementById('lunchStart');
  const lunchEnd = document.getElementById('lunchEnd');
  const exitTime = document.getElementById('exitTime');

  // URL do backend local
  const BACKEND_URL = 'https://tiagodeazevedoferreira.github.io/AppCalculoHoras/data.json';

  // Função para carregar os dados da planilha
  async function loadData() {
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'GET'
      });
      if (!response.ok) {
        throw new Error(`Erro na requisição GET: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      entryTime.value = data.entryTime || '';
      lunchStart.value = data.lunchStart || '';
      lunchEnd.value = data.lunchEnd || '';
      calculateExitTime();
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      calculateExitTime();
    }
  }

  // Função para salvar os dados na planilha
  async function saveData() {
    const data = {
      entryTime: entryTime.value,
      lunchStart: lunchStart.value,
      lunchEnd: lunchEnd.value
    };
    console.log('Novo estado (manual update necessário):', data);
  }

  loadData();

  const toMinutes = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  function calculateExitTime() {
    const entry = entryTime.value;
    const lunchS = lunchStart.value;
    const lunchE = lunchEnd.value;

    if (!entry || !lunchS || !lunchE) {
      exitTime.textContent = '--:--';
      return;
    }

    const entryMin = toMinutes(entry);
    const lunchStartMin = toMinutes(lunchS);
    const lunchEndMin = toMinutes(lunchE);

    if (lunchStartMin <= entryMin || lunchEndMin <= lunchStartMin) {
      exitTime.textContent = 'Erro';
      return;
    }

    const morningWork = lunchStartMin - entryMin;
    const totalWork = 528;
    const remainingWork = totalWork - morningWork;
    const exitMin = lunchEndMin + remainingWork;

    exitTime.textContent = formatTime(exitMin);
  }

  entryTime.addEventListener('input', saveData);
  lunchStart.addEventListener('input', saveData);
  lunchEnd.addEventListener('input', saveData);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('Service Worker Registered'))
      .catch(err => console.error('Service Worker Error:', err));
  }
});
