// Fullskärm
document.getElementById('fullscreen-btn').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Trafiklab API-inställningar
const API_KEY = '0edb3886e0f6456b8c6cd587fd074fe4'; // Ersätt med din nyckel från trafiklab.se
const STOP_ID = '740000001'; // Arvika
const BASE_URL = 'https://realtime-api.trafiklab.se/v1';
const TRANSPORT_MODE = 'TRAIN'; // Endast tåg

let currentTab = 'departures';

// Flik-byte
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

// Hämta data från API
async function fetchData(endpoint) {
  const now = new Date().toISOString();
  const url = `${BASE_URL}/${endpoint}/${STOP_ID}?key=${API_KEY}&dateTime=${now}&transportMode=${TRANSPORT_MODE}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('API-fel');
    return await response.json();
  } catch (err) {
    console.error(err);
    return { Journeys: [] };
  }
}

// Visa lista
function displayTrains(journeys, listElement, isArrival = false) {
  listElement.innerHTML = journeys.length ? '' : '<li>Inga tågtider just nu.</li>';
  
  journeys.slice(0, 10).forEach(journey => { // Nästa 10
    const time = journey.OriginTime || journey.Time; // Planerad tid
    const estimatedTime = journey.OriginDateTime || journey.DateTime; // Uppskattad
    const delay = estimatedTime !== time ? ` (+${Math.floor((new Date(estimatedTime) - new Date(time)) / 60000)} min)` : '';
    
    const originOrDest = isArrival ? journey.Origin : journey.Destination;
    const direction = isArrival ? `Från ${originOrDest}` : `Till ${originOrDest}`;
    const track = journey.Track || '?';
    const line = journey.LineNumber || 'Okänd';
    
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${new Date(time).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}</strong>
      ${delay ? `<span class="delay">${delay}</span>` : ''}
      → ${direction} (Spår ${track}, Linje ${line})
    `;
    listElement.appendChild(li);
  });
}

// Hämta och visa avgångar
async function fetchDepartures() {
  const data = await fetchData('departures');
  displayTrains(data.Journeys || [], document.getElementById('train-list'), false);
}

// Hämta och visa ankomster
async function fetchArrivals() {
  const data = await fetchData('arrivals');
  displayTrains(data.Journeys || [], document.getElementById('train-list-arrivals'), true);
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