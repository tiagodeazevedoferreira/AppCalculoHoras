const ALERT_THRESHOLD = 5;

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

// Inicializar o Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Habilitar persistência offline
firebase.database().goOffline();
firebase.database().goOnline();

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded disparado - Iniciando execução do script');
  const entryTime = document.getElementById('entryTime');
  const lunchStart = document.getElementById('lunchStart');
  const lunchEnd = document.getElementById('lunchEnd');
  const exitTime = document.getElementById('exitTime');

  if (!entryTime || !lunchStart || !lunchEnd || !exitTime) {
    console.error('Erro: Um ou mais elementos HTML não foram encontrados');
    return;
  }

  // Função para carregar os dados do Firebase
  function loadData() {
    console.log('Iniciando loadData');
    const horariosRef = firebase.database().ref('horarios');
    horariosRef.once('value')
      .then(snapshot => {
        console.log('Dados carregados do Firebase');
        const data = snapshot.val();
        if (data) {
          entryTime.value = data.entryTime || '';
          lunchStart.value = data.lunchStart || '';
          lunchEnd.value = data.lunchEnd || '';
        }
        calculateExitTime();
        checkNotificationPermission();
        startNotificationCheck();
      })
      .catch(err => {
        console.error('Erro ao carregar dados do Firebase:', err);
        calculateExitTime();
      });
  }

  // Função para salvar os dados no Firebase
  function saveData() {
    console.log('Iniciando saveData');
    const data = {
      entryTime: entryTime.value,
      lunchStart: lunchStart.value,
      lunchEnd: lunchEnd.value
    };

    const horariosRef = firebase.database().ref('horarios');
    horariosRef.set(data)
      .then(() => {
        console.log('Dados salvos com sucesso:', data);
        console.log('Conectividade:', navigator.onLine ? 'Online' : 'Offline');
        calculateExitTime();
        startNotificationCheck();
      })
      .catch(err => {
        console.error('Erro ao salvar dados:', err);
        console.log('Conectividade:', navigator.onLine ? 'Online' : 'Offline'); // Corrigido
      });
  }

  // Função para calcular o horário de saída
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
    console.log('Iniciando calculateExitTime');
    const entry = entryTime.value;
    const lunchS = lunchStart.value;
    const lunchE = lunchEnd.value;

    console.log('Entradas:', { entry, lunchS, lunchE });

    if (!entry || !lunchS || !lunchE) {
      exitTime.textContent = '--:--';
      console.log('Horário de saída não calculado: campos vazios');
      return null;
    }

    const entryMin = toMinutes(entry);
    const lunchStartMin = toMinutes(lunchS);
    const lunchEndMin = toMinutes(lunchE);

    if (lunchStartMin <= entryMin || lunchEndMin <= lunchStartMin) {
      exitTime.textContent = 'Erro';
      console.log('Erro: Horários inválidos');
      return null;
    }

    const morningWork = lunchStartMin - entryMin;
    const totalWork = 528; // 8h48min
    const remainingWork = totalWork - morningWork;
    const exitMin = lunchEndMin + remainingWork;

    exitTime.textContent = formatTime(exitMin);
    console.log('Horário de saída calculado:', formatTime(exitMin));
    return exitMin;
  }

  // Função para verificar permissão de notificação
  function checkNotificationPermission() {
    console.log('Verificando permissão de notificação');
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        console.log('Permissão de notificação já concedida');
      } else if (Notification.permission !== 'denied') {
        console.log('Solicitando permissão de notificação...');
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('Permissão de notificação concedida');
          } else {
            console.log('Permissão de notificação negada');
          }
        });
      } else {
        console.log('Permissão de notificação está bloqueada (denied)');
      }
    } else {
      console.log('API de Notificação não suportada neste dispositivo');
    }
  }

  // Função para verificar e enviar mensagem ao Service Worker
  function checkNotification() {
    console.log('Iniciando checkNotification');
    const exitMin = calculateExitTime();
    if (!exitMin) {
      console.log('Horário de saída não calculado, notificação não será disparada');
      return;
    }

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const timeDiff = exitMin - currentMin;

    console.log('Horário atual (minutos desde 00:00):', currentMin);
    console.log('Horário de saída (minutos desde 00:00):', exitMin);
    console.log('Tempo restante até a saída (minutos):', timeDiff);

    if (timeDiff <= ALERT_THRESHOLD && timeDiff >= 0) {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        console.log('Enviando mensagem ao Service Worker para notificação...');
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: 'Aviso de Saída',
          body: `Você está a menos de ${ALERT_THRESHOLD} minutos do horário de saída!`,
          icon: '/AppCalculoHoras/icon.png'
        });
      } else {
        console.log('Service Worker não disponível para enviar notificação');
      }
    } else {
      console.log('Notificação não disparada: tempo restante fora do intervalo');
    }
  }

  // Iniciar verificação a cada 10 segundos (para teste)
  function startNotificationCheck() {
    console.log('Iniciando startNotificationCheck');
    checkNotification(); // Verificação imediata
    setInterval(checkNotification, 10000); // Verifica a cada 10 segundos
  }

  entryTime.addEventListener('input', () => {
    console.log('Evento input detectado em entryTime');
    calculateExitTime();
    saveData();
  });
  lunchStart.addEventListener('input', () => {
    console.log('Evento input detectado em lunchStart');
    calculateExitTime();
    saveData();
  });
  lunchEnd.addEventListener('input', () => {
    console.log('Evento input detectado em lunchEnd');
    calculateExitTime();
    saveData();
  });

  if ('serviceWorker' in navigator) {
    console.log('Registrando Service Worker...');
    navigator.serviceWorker.register('/AppCalculoHoras/sw.js')
      .then(registration => {
        console.log('Service Worker Registered - New Version', registration);
      })
      .catch(err => console.error('Service Worker Error:', err));
  }

  console.log('Nova versão da PWA carregada - AppCalculoHoras');
  console.log('Conectividade inicial:', navigator.onLine ? 'Online' : 'Offline');
  loadData();
});