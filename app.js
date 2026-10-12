let onlineLibrary = [];
let localDeviceTracks = [];
let playlists = JSON.parse(localStorage.getItem('south_playlists')) || {
  "Telugu Vibes": [],
  "Tamil Chill": []
};
let currentQueue = [];
let currentIndex = -1;

const audio = document.getElementById('audioElement');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const seekBar = document.getElementById('seekBar');
const currentTimeEl = document.getElementById('currentTime');
const durationTimeEl = document.getElementById('durationTime');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const searchInput = document.getElementById('searchInput');

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`${btn.dataset.tab}Tab`).classList.add('active');
  });
});

// Fetch Remote Catalog
async function fetchOnlineTracks() {
  try {
    const res = await fetch('songs.json');
    if (!res.ok) throw new Error('Catalog missing');
    onlineLibrary = await res.json();
    renderTrackList(onlineLibrary, 'onlineTrackList');
  } catch (err) {
    console.error("Error loading songs:", err);
  }
}

function renderTrackList(tracks, elementId) {
  const container = document.getElementById(elementId);
  container.innerHTML = '';
  tracks.forEach((track, idx) => {
    const li = document.createElement('li');
    li.className = 'track-item';
    li.innerHTML = `
      <div>
        <div class="title">${track.title}</div>
        <div class="meta">${track.artist} • ${track.language || 'Local'}</div>
      </div>
      <button class="action-btn" style="padding: 4px 10px; font-size: 0.8rem;">+ Add</button>
    `;
    li.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        promptAddToPlaylist(track);
      } else {
        playTrack(tracks, idx);
      }
    });
    container.appendChild(li);
  });
}

function playTrack(queue, index) {
  currentQueue = queue;
  currentIndex = index;
  const track = queue[index];
  audio.src = track.url;
  playerTitle.textContent = track.title;
  playerArtist.textContent = track.artist || 'Local Audio';
  audio.play();
  playPauseBtn.textContent = '⏸';
}

playPauseBtn.addEventListener('click', () => {
  if (!audio.src) return;
  if (audio.paused) {
    audio.play();
    playPauseBtn.textContent = '⏸';
  } else {
    audio.pause();
    playPauseBtn.textContent = '▶';
  }
});

nextBtn.addEventListener('click', () => {
  if (currentIndex + 1 < currentQueue.length) playTrack(currentQueue, currentIndex + 1);
});

prevBtn.addEventListener('click', () => {
  if (currentIndex > 0) playTrack(currentQueue, currentIndex - 1);
});

audio.addEventListener('timeupdate', () => {
  if (!isNaN(audio.duration)) {
    seekBar.max = Math.floor(audio.duration);
    seekBar.value = Math.floor(audio.currentTime);
    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationTimeEl.textContent = formatTime(audio.duration);
  }
});

seekBar.addEventListener('input', () => {
  audio.currentTime = seekBar.value;
});

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Device file selection
document.getElementById('filePicker').addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  files.forEach((f, i) => {
    localDeviceTracks.push({
      id: `dev-${Date.now()}-${i}`,
      title: f.name.replace(/\.[^/.]+$/, ""),
      artist: "Device Storage",
      language: "Offline",
      url: URL.createObjectURL(f)
    });
  });
  renderTrackList(localDeviceTracks, 'localDeviceTrackList');
});

// Search functionality
searchInput.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = onlineLibrary.filter(t => 
    t.title.toLowerCase().includes(term) || 
    t.artist.toLowerCase().includes(term) ||
    t.language.toLowerCase().includes(term)
  );
  renderTrackList(filtered, 'onlineTrackList');
});

// Playlists
function promptAddToPlaylist(track) {
  const names = Object.keys(playlists);
  const choice = prompt(`Select playlist name:\n${names.join(', ')}`);
  if (choice && playlists[choice]) {
    playlists[choice].push(track);
    localStorage.setItem('south_playlists', JSON.stringify(playlists));
    renderPlaylists();
    alert(`Added to "${choice}"`);
  }
}

document.getElementById('createPlaylistBtn').addEventListener('click', () => {
  const input = document.getElementById('newPlaylistName');
  const name = input.value.trim();
  if (name && !playlists[name]) {
    playlists[name] = [];
    localStorage.setItem('south_playlists', JSON.stringify(playlists));
    input.value = '';
    renderPlaylists();
  }
});

function renderPlaylists() {
  const container = document.getElementById('playlistContainer');
  container.innerHTML = '';
  Object.keys(playlists).forEach(name => {
    const div = document.createElement('div');
    div.className = 'playlist-block';
    div.innerHTML = `
      <h4>${name} (${playlists[name].length} songs)</h4>
      <button class="action-btn" style="margin-top: 8px; font-size: 0.8rem;">Play All</button>
    `;
    div.querySelector('button').addEventListener('click', () => {
      if (playlists[name].length > 0) playTrack(playlists[name], 0);
    });
    container.appendChild(div);
  });
}

document.getElementById('refreshFeedBtn').addEventListener('click', fetchOnlineTracks);

// Initialize
fetchOnlineTracks();
renderPlaylists();
