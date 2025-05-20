document.addEventListener('DOMContentLoaded', () => {
  const entryTime = document.getElementById('entryTime');
  const lunchStart = document.getElementById('lunchStart');
  const lunchEnd = document.getElementById('lunchEnd');
  const exitTime = document.getElementById('exitTime');

  // URL do backend local
  const BACKEND_URL = 'http://localhost:3001';

  // Função para carregar os dados da planilha
  async function loadData() {
    try {
      const response = await fetch(`${BACKEND_URL}/load`, {
        method: 'GET'
      });
      if (!response.ok) {
        throw new Error(`Erro na requisição GET: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Dados carregados:', data);
      entryTime.value = data.entryTime || '';
      lunchStart.value = data.lunchStart || '';
      lunchEnd.value = data.lunchEnd || '';
      calculateExitTime();
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      // Mesmo que a requisição falhe, ainda podemos calcular o horário de saída
      calculateExitTime();
    }
  }

  // Função para salvar os dados na planilha
  async function saveData() {
    try {
      const data = {
        entryTime: entryTime.value,
        lunchStart: lunchStart.value,
        lunchEnd: lunchEnd.value
      };
      const response = await fetch(`${BACKEND_URL}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error(`Erro na requisição POST: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      console.log('Dados salvos:', result);
    } catch (err) {
      console.error('Erro ao salvar dados:', err);
    }
    // Calcular o horário de saída independentemente do sucesso da requisição
    calculateExitTime();
  }

  // Carregar os dados ao iniciar
  loadData();

  // Função para converter horário em minutos
  const toMinutes = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Função para converter minutos de volta para formato HH:MM
  const formatTime = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Função para calcular o horário de saída
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

    // Validar a sequência de horários
    if (lunchStartMin <= entryMin || lunchEndMin <= lunchStartMin) {
      exitTime.textContent = 'Erro';
      return;
    }

    // Calcular os minutos trabalhados antes do almoço
    const morningWork = lunchStartMin - entryMin;
    // Jornada total de trabalho: 8h48 = 528 minutos
    const totalWork = 528;
    // Minutos restantes após o almoço
    const remainingWork = totalWork - morningWork;
    // Horário de saída em minutos
    const exitMin = lunchEndMin + remainingWork;

    // Exibir o horário de saída formatado
    exitTime.textContent = formatTime(exitMin);
  }

  // Salvar os dados e recalcular o horário de saída ao alterar os campos
  entryTime.addEventListener('input', () => {
    saveData();
  });
  lunchStart.addEventListener('input', () => {
    saveData();
  });
  lunchEnd.addEventListener('input', () => {
    saveData();
  });

  // Registrar o service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('Service Worker Registered'))
      .catch(err => console.error('Service Worker Error:', err));
  }
});