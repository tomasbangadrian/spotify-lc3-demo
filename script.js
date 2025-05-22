let accessToken = null;

function getHashParams() {
  let hashParams = {};
  let e, r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
  while ( e = r.exec(q)) {
    hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}

window.onload = function() {
  let params = getHashParams();
  accessToken = params.access_token;
  if (accessToken) {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('loggedIn').style.display = 'block';
  }
};

document.getElementById('loginBtn').onclick = () => {
  window.location = '/login';
};

document.getElementById('searchBtn').onclick = () => {
  const q = document.getElementById('searchInput').value;
  fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track,artist&limit=10`, {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  })
  .then(res => res.json())
  .then(data => {
    const results = document.getElementById('results');
    results.innerHTML = '';
    (data.tracks && data.tracks.items || []).forEach(track => {
      const li = document.createElement('li');
      li.textContent = track.artists[0].name + " - " + track.name;
      li.onclick = () => playTrack(track.uri);
      results.appendChild(li);
    });
  });
};

function playTrack(trackUri) {
  // Her må du initialisere Spotify Web Playback SDK med token
  // Eksempel:
  const player = new Spotify.Player({
    name: 'Web Playback SDK Quick Start Player',
    getOAuthToken: cb => { cb(accessToken); },
    volume: 0.5
  });

  player.connect();

  player.on('ready', ({ device_id }) => {
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
      method: 'PUT',
      body: JSON.stringify({ uris: [trackUri] }),
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken }
    });
  });
}
