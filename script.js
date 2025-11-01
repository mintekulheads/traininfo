// Fullskärm
document.getElementById('fullscreen-btn').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// === TRAFIKLAB TIMETABLES API (v1) ===
const API_KEY = '0edb3886e0f6456b8c6cd587fd074fe4'; // DIN RIKTIGA NYCKEL!
const STOP_ID = '740001001'; // Arvika station
const BASE_URL = 'https://realtime-api.trafiklab.se/v1';

let currentTab = 'departures';

// Flik-byte
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  document.getElementById('train-list').style.display = tab === 'departures' ? 'block' : 'none';
  document.getElementById('train-list-arrivals').style.display = tab === 'arrivals' ? 'block' : 'none';
}

// Hämta data
async function fetchData(type) {
  const now = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
  const url = `${BASE_URL}/${type}/${STOP_ID}/${now}?key=${API_KEY}&transportMode=TRAIN`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('API-fel:', err);
    return null;
  }
}

// Visa tågtider
function displayTrains(data, listId, isArrival = false) {
  const list = document.getElementById(listId);
  list.innerHTML = '';

  const items = isArrival ? data?.arrivals : data?.departures;
  if (!items || items.length === 0) {
    list.innerHTML = '<li>Inga tågtider just nu.</li>';
    return;
  }

  items.slice(0, 10).forEach(item => {
    const scheduled = item.scheduled.slice(11, 16);
    const realtime = item.realtime.slice(11, 16);
    const delay = item.delay > 0 ? ` +${Math.round(item.delay / 60)} min` : '';
    const canceled = item.canceled ? ' [INSTÄLLD]' : '';
    const platform = item.realtime_platform?.designation || item.scheduled_platform?.designation || '?';
    const line = item.route.designation || 'Okänd';
    const destination = isArrival ? item.route.origin.name : item.route.destination.name;

    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${realtime}</strong>
      ${delay ? `<span class="delay">${delay}</span>` : ''}
      ${canceled ? `<span style="color:#ff4444;">${canceled}</span>` : ''}
      → ${destination} (Spår ${platform}, Linje ${line})
    `;
    list.appendChild(li);
  });
}

// Hämta och visa
async function updateDepartures() {
  const data = await fetchData('departures');
  displayTrains(data, 'train-list', false);
}

async function updateArrivals() {
  const data = await fetchData('arrivals');
  displayTrains(data, 'train-list-arrivals', true);
}

async function updateAll() {
  await updateDepartures();
  await updateArrivals();
}

// Starta
updateAll();
setInterval(updateAll, 60000); // Var 60:e sekund

// Knappar
document.getElementById('refresh-btn').addEventListener('click', updateAll);