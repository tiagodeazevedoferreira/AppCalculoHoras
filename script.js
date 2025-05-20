document.addEventListener('DOMContentLoaded', () => {
  const entryTime = document.getElementById('entryTime');
  const lunchStart = document.getElementById('lunchStart');
  const lunchEnd = document.getElementById('lunchEnd');
  const exitTime = document.getElementById('exitTime');

  // Configurações do GitHub
  const GITHUB_TOKEN = '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'; // Substitua pelo seu token
  const REPO_OWNER = 'tiagodeazevedoferreira';
  const REPO_NAME = 'CalculoHorarioSaida';
  const FILE_PATH = 'data.json';
  const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

  // Função para carregar os dados do GitHub
  async function loadData() {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (!response.ok) {
        throw new Error(`Erro na requisição GET: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      const content = JSON.parse(atob(data.content)); // Decodifica base64
      entryTime.value = content.entryTime || '';
      lunchStart.value = content.lunchStart || '';
      lunchEnd.value = content.lunchEnd || '';
      calculateExitTime();
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      calculateExitTime();
    }
  }

  // Função para salvar os dados no GitHub
  async function saveData() {
    const data = {
      entryTime: entryTime.value,
      lunchStart: lunchStart.value,
      lunchEnd: lunchEnd.value
    };

    try {
      // Obter o SHA atual do arquivo
      const getResponse = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (!getResponse.ok && getResponse.status !== 404) {
        throw new Error(`Erro ao obter SHA: ${getResponse.status} ${getResponse.statusText}`);
      }
      let sha = null;
      if (getResponse.ok) {
        const fileData = await getResponse.json();
        sha = fileData.sha;
      }

      // Salvar os dados
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Atualizar data.json com novos horários',
          content: btoa(JSON.stringify(data)), // Codifica em base64
          sha: sha // Envia o SHA, se existir
        })
      });
      if (!response.ok) {
        throw new Error(`Erro na requisição PUT: ${response.status} ${response.statusText}`);
      }
      console.log('Dados salvos com sucesso:', data);
    } catch (err) {
      console.error('Erro ao salvar dados:', err);
    }
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
    const totalWork = 528; // 8h48min
    const remainingWork = totalWork - morningWork;
    const exitMin = lunchEndMin + remainingWork;

    exitTime.textContent = formatTime(exitMin);
  }

  entryTime.addEventListener('input', () => {
    calculateExitTime();
    saveData();
  });
  lunchStart.addEventListener('input', () => {
    calculateExitTime();
    saveData();
  });
  lunchEnd.addEventListener('input', () => {
    calculateExitTime();
    saveData();
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('Service Worker Registered'))
      .catch(err => console.error('Service Worker Error:', err));
  }
});