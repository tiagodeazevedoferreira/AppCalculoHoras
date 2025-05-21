```javascript
document.addEventListener('DOMContentLoaded', () => {
  const entryTime = document.getElementById('entryTime');
  const lunchStart = document.getElementById('lunchStart');
  const lunchEnd = document.getElementById('lunchEnd');
  const exitTime = document.getElementById('exitTime');

  // Configuração do Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyAbmCGZF1KBVyDNNE73Slcvn5YiWBZ61Do",
    authDomain: "apphoras-6e79c.firebaseapp.com",
    databaseURL: "https://apphoras-6e79c-default-rtdb.firebaseio.com",
    projectId: "apphoras-6e79c",
    storageBucket: "apphoras-6e79c.firebasestorage.app",
    messagingSenderId: "1029932334742",
    appId: "1:1029932334742:web:121173d396edda9625ccb7",
    measurementId: "G-SSL97JP1NE"
  };

  // Inicializar Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  // Função para carregar dados
  function loadData() {
    db.ref('horario').once('value').then((snapshot) => {
      const data = snapshot.val() || { entryTime: '', lunchStart: '', lunchEnd: '' };
      console.log('Dados carregados do Firebase:', data);
      entryTime.value = data.entryTime || '';
      lunchStart.value = data.lunchStart || '';
      lunchEnd.value = data.lunchEnd || '';
      calculateExitTime();
    }).catch((err) => {
      console.error('Erro ao carregar dados:', err);
      calculateExitTime();
    });
  }

  // Função para salvar dados
  function saveData() {
    const data = {
      entryTime: entryTime.value,
      lunchStart: lunchStart.value,
      lunchEnd: lunchEnd.value
    };
    console.log('Salvando dados no Firebase:', data);
    db.ref('horario').set(data).then(() => {
      console.log('Dados salvos com sucesso');
    }).catch((err) => {
      console.error('Erro ao salvar dados:', err);
    });
  }

  // Carregar dados ao iniciar
  loadData();

  // Função para converter tempo em minutos
  const toMinutes = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Função para formatar minutos em HH:MM
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

    console.log('Calculando saída:', { entry, lunchS, lunchE });

    if (!entry || !lunchS || !lunchE) {
      exitTime.textContent = '--:--';
      console.log('Campos incompletos, saída não calculada');
      return;
    }

    const entryMin = toMinutes(entry);
    const lunchStartMin = toMinutes(lunchS);
    const lunchEndMin = toMinutes(lunchE);

    if (lunchStartMin <= entryMin || lunchEndMin <= lunchStartMin) {
      exitTime.textContent = 'Erro';
      console.log('Erro: Horários inválidos');
      return;
    }

    const morningWork = lunchStartMin - entryMin;
    const totalWork = 528; // 8h48min
    const remainingWork = totalWork - morningWork;
    const exitMin = lunchEndMin + remainingWork;

    exitTime.textContent = formatTime(exitMin);
    console.log('Saída calculada:', formatTime(exitMin));
  }

  // Listeners para salvar e recalcular ao alterar os campos
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

  // Registrar o Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('Service Worker Registrado'))
      .catch(err => console.error('Erro no Service Worker:', err));
  }
});
```