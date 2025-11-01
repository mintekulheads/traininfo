// Fullskärm
document.getElementById('fullscreen-btn').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Hämta tågtider (exempel med Trafikverkets API)
const TRAIN_API_URL = 'https://api.trafikinfo.trafikverket.se/v2/data.json';

async function fetchTrains() {
  const list = document.getElementById('train-list');
  list.innerHTML = '<li>Laddar tågtider...</li>';

  try {
    const response = await fetch(TRAIN_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: `
        <REQUEST>
          <LOGIN authenticationkey='92c6d90058994e3c889eb44c2ed50744' />
          <QUERY objecttype="TrainAnnouncement" schemaversion="1.8">
            <FILTER>
              <EQ name="LocationSignature" value="Cst" />
              <EQ name="ActivityType" value="Avgang" />
            </FILTER>
            <INCLUDE>AdvertisedTimeAtLocation</INCLUDE>
            <INCLUDE>ToLocation</INCLUDE>
            <INCLUDE>TrackAtLocation</INCLUDE>
          </QUERY>
        </REQUEST>
      `
    });

    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const announcements = xml.querySelectorAll('TrainAnnouncement');

    list.innerHTML = '';
    announcements.forEach(ann => {
      const time = ann.querySelector('AdvertisedTimeAtLocation')?.textContent || '';
      const dest = ann.querySelector('ToLocation')?.getAttribute('LocationName') || 'Okänd';
      const track = ann.querySelector('TrackAtLocation')?.textContent || '?';

      const li = document.createElement('li');
      li.innerHTML = `<strong>${time.slice(11, 16)}</strong> → ${dest} (Spår ${track})`;
      list.appendChild(li);
    });

    if (announcements.length === 0) {
      list.innerHTML = '<li>Inga avgångar just nu.</li>';
    }

  } catch (err) {
    list.innerHTML = '<li>Fel vid hämtning av tågtider.</li>';
    console.error(err);
  }
}

// Uppdatera vid klick
document.getElementById('refresh-btn').addEventListener('click', fetchTrains);

// Ladda första gången
fetchTrains();

// Uppdatera varje minut
setInterval(fetchTrains, 60000);