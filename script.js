// Fullskärm
document.getElementById('fullscreen-btn').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Resrobot v2.1 API-inställningar (uppdaterat från Trafiklab docs)
const ACCESS_ID = '67cc086d-ec22-47f2-a7eb-964568ee3756'; // Ersätt med din accessId från trafiklab.se
const STOP_ID = '740001001'; // Rätt ID för Arvika station (från Stop Lookup)
const BASE_URL = 'https://api.resrobot.se/v2.1';
const TRANSPORT_MODE = 'RAIL'; // RAIL för tåg (TRAIN fungerar inte)

let currentTab = 'departures';

// Flik-byte (samma som tidigare)
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  const departuresList = document.getElementById('train-list');
  const arrivalsList = document.getElementById('train-list-arrivals');
  
  if (tab === 'departures') {
    arrivalsList.style.display = 'none';
    departuresList.style.display = 'block';
  } else {
    departuresList.style.display = 'none';
    arrivalsList.style.display = 'block';
  }
}

// Hämta data från Resrobot API
async function fetchData(endpoint) {
  const now = new Date().toISOString().slice(0, 16) + ':00'; // YYYY-MM-DDTHH:MM
  const url = `${BASE_URL}/${endpoint}?id=${STOP_ID}&accessId=${ACCESS_ID}&format=json&timeSpan=60&transportations=${TRANSPORT_MODE}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API-fel: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Visa lista (uppdaterad för v2.1 struktur)
function displayTrains(data, listElement, isArrival = false) {
  if (!data || !data.Trip || !Array.isArray(data.Trip)) {
    listElement.innerHTML = '<li>Inga tågtider just nu. Kontrollera accessId och stopp-ID!</li>';
    return;
  }

  const journeys = data.Trip;
  listElement.innerHTML = journeys.length ? '' : '<li>Inga tågtider just nu.</li>';
  
  journeys.slice(0, 10).forEach(journey => {
    const origin = journey.Origin || {};
    const destination = journey.Destination || {};
    const time = origin.time || ''; // HH:MM
    const date = origin.date || ''; // YYYY-MM-DD
    const fullTime = new Date(`${date}T${time}`).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    
    // Försening: fgColor = "FF0000" för rött (delay), diffMins för minuter
    const fgColor = origin.fgColor || '';
    const diffMins = origin.diffMins || 0;
    const delay = fgColor === 'FF0000' && diffMins > 0 ? ` (+${diffMins} min)` : '';
    
    const direction = isArrival ? `Från ${origin.name || 'Okänd'}` : `Till ${destination.name || 'Okänd'}`;
    const track = origin.track || '?';
    const line = journey.LegList?.Leg[0]?.line || 'Okänd'; // Första benets linje
    
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${fullTime}</strong>
      ${delay ? `<span class="delay">${delay}</span>` : ''}
      → ${direction} (Spår ${track}, Linje ${line})
    `;
    listElement.appendChild(li);
  });
}

// Hämta och visa avgångar
async function fetchDepartures() {
  const data = await fetchData('departureBoard');
  displayTrains(data, document.getElementById('train-list'), false);
}

// Hämta och visa ankomster
async function fetchArrivals() {
  const data = await fetchData('arrivalBoard');
  displayTrains(data, document.getElementById('train-list-arrivals'), true);
}

// Uppdatera allt
async function updateAll() {
  fetchDepartures();
  fetchArrivals();
}

// Event: Uppdatera-knapp
document.getElementById('refresh-btn').addEventListener('click', updateAll);

// Starta
updateAll();

// Auto-uppdatera var 60 sek
setInterval(updateAll, 60000);