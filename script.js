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
  const entryTime = document.getElementById('entryTime');
  const lunchStart = document.getElementById('lunchStart');
  const lunchEnd = document.getElementById('lunchEnd');
  const exitTime = document.getElementById('exitTime');

  // Função para carregar os dados do Firebase
  function loadData() {
    const horariosRef = firebase.database().ref('horarios');
    horariosRef.once('value')
      .then(snapshot => {
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
        console.error('Erro ao carregar dados:', err);
        calculateExitTime();
      });
  }

  // Função para salvar os dados no Firebase
  function saveData() {
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
        console.log('Conectividade:', navigator.onLine ? 'Online' : 'Offline');
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
    const entry = entryTime.value;
    const lunchS = lunchStart.value;
    const lunchE = lunchEnd.value;

    console.log('Entradas:', { entry, lunchS, lunchE });

    if (!entry || !lunchS || !lunchE) {
      exitTime.textContent = '--:--';
      return null;
    }

    const entryMin = toMinutes(entry);
    const lunchStartMin = toMinutes(lunchS);
    const lunchEndMin = toMinutes(lunchE);

    if (lunchStartMin <= entryMin || lunchEndMin <= lunchStartMin) {
      exitTime.textContent = 'Erro';
      return null;
    }

    const morningWork = lunchStartMin - entryMin;
    const totalWork = 528; // 8h48min
    const remainingWork = totalWork - morningWork;
    const exitMin = lunchEndMin + remainingWork;

    exitTime.textContent = formatTime(exitMin);
    return exitMin;
  }

  // Função para verificar permissão de notificação
  function checkNotificationPermission() {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        console.log('Permissão de notificação já concedida');
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('Permissão de notificação concedida');
          } else {
            console.log('Permissão de notificação negada');
          }
        });
      }
    }
  }

  // Função para verificar e disparar notificação
  function checkNotification() {
    const exitMin = calculateExitTime();
    if (!exitMin) return;

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const timeDiff = exitMin - currentMin;

    console.log('Tempo restante até a saída (minutos):', timeDiff);

    if (timeDiff <= ALERT_THRESHOLD && timeDiff >= 0 && Notification.permission === 'granted') {
      new Notification('Aviso de Saída', {
        body: `Você está a menos de ${ALERT_THRESHOLD} minutos do horário de saída!`,
        icon: '/AppCalculoHoras/icon.png'
      });
      console.log('Notificação disparada!');
    }
  }

  // Iniciar verificação a cada 10 segundos (para teste)
  function startNotificationCheck() {
    checkNotification(); // Verificação imediata
    setInterval(checkNotification, 10000); // Verifica a cada 10 segundos
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
    navigator.serviceWorker.register('/AppCalculoHoras/sw.js')
      .then(() => console.log('Service Worker Registered - New Version'))
      .catch(err => console.error('Service Worker Error:', err));
  }

  console.log('Nova versão da PWA carregada - AppCalculoHoras');
  console.log('Conectividade inicial:', navigator.onLine ? 'Online' : 'Offline');
  loadData();
});