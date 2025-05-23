import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

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

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
  const entryTime = document.getElementById('entryTime');
  const lunchStart = document.getElementById('lunchStart');
  const lunchEnd = document.getElementById('lunchEnd');
  const exitTime = document.getElementById('exitTime');

  // Função para carregar os dados do Firebase
  function loadData() {
    const horariosRef = ref(database, 'horarios');
    onValue(horariosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        entryTime.value = data.entryTime || '';
        lunchStart.value = data.lunchStart || '';
        lunchEnd.value = data.lunchEnd || '';
      }
      calculateExitTime();
    }, (err) => {
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

    const horariosRef = ref(database, 'horarios');
    set(horariosRef, data)
      .then(() => {
        console.log('Dados salvos com sucesso:', data);
      })
      .catch((err) => {
        console.error('Erro ao salvar dados:', err);
      });
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