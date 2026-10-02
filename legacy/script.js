let shuffleQueue = [];
let shuffleHistory = [];
let currentSongIndex = 0;
let currentPlaylist = [];
let isMiniLoopActive = false;
let miniLoopQueue = [];
let audio = new Audio();
audio.loop = false;

const audioList = document.getElementById("audioList");
const seekbar = document.getElementById("seekbar");
const seekbarFilled = document.getElementById("seekbar-filled");
const currentTimeSpan = document.getElementById("currentTime");
const totalTimeSpan = document.getElementById("totalTime");
const volumeSlider = document.getElementById("volumeSlider");
const playBtn = document.getElementById("playBtn");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const loopBtn = document.getElementById("loopBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const queueList = document.getElementById("queueList");
const songInfo = document.getElementById("songInfo");
const miniLoopBtn = document.getElementById("miniLoopToggle");
const clearMiniLoopBtn = document.getElementById("clearMiniLoopBtn");
const miniLoopModal = document.getElementById("miniLoopModal");
const miniLoopSongList = document.getElementById("miniLoopSongList");
const addMiniLoopBtn = document.getElementById("addMiniLoopBtn");
const closeMiniLoopBtn = document.getElementById("closeMiniLoop");

let isLoop = false;
let isShuffle = false;

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function updateSeekbar() {
  if (audio.paused) return;
  if (!isNaN(audio.duration)) {
    const percent = (audio.currentTime / audio.duration) * 100;
    seekbarFilled.style.width = `${percent}%`;
    currentTimeSpan.textContent = formatTime(audio.currentTime);
  }
  requestAnimationFrame(updateSeekbar);
}

async function loadSongsGrouped(folderName) {
  try {
    const res = await fetch("/data.json");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    const container = document.getElementById("audioList");
    container.innerHTML = "";

    const heading = document.createElement("h2");
    heading.textContent = folderName.toUpperCase();
    heading.style.marginBottom = "15px";
    container.appendChild(heading);

    if (data[folderName]) {
      currentPlaylist = data[folderName];
      currentSongIndex = 0;
      queueList.innerHTML = "";

      if (currentPlaylist.length === 0) {
        container.innerHTML += "<p>No songs in this playlist.</p>";
        return;
      }

      if (isShuffle) {
        generateShuffleQueue();
        shuffleHistory = [];
      } else {
        shuffleQueue = [];
        shuffleHistory = [];
      }

      currentPlaylist.forEach((song, index) => {
        const li = document.createElement("li");
        li.textContent = song.title || `Song ${index + 1}`;
        li.classList.add("song-item");
        li.dataset.index = index;
        li.addEventListener("click", () => playSong(index));
        container.appendChild(li);

        const queueItem = document.createElement("li");
        queueItem.textContent = song.title || `Song ${index + 1}`;
        queueItem.classList.add("song-item");
        queueItem.dataset.index = index;
        queueItem.addEventListener("click", () => playSong(index));
        queueList.appendChild(queueItem);
      });
    } else {
      container.innerHTML += `<p>No songs found for "${folderName}"</p>`;
    }
  } catch (err) {
    console.error("Failed to load songs for", folderName, err);
    const container = document.getElementById("audioList");
    container.innerHTML = `<p>Error loading songs: ${err.message}. Please check the console for details.</p>`;
  }
}

function playSong(index) {
  if (!currentPlaylist[index]) return;
  currentSongIndex = index;
  const song = currentPlaylist[index];
  audio.src = song.file;
  audio.loop = isLoop;

  if (song.title) {
    songInfo.style.display = "block";
    songInfo.innerHTML = `<span class="scrolling-text">${song.title}</span>`;
  } else {
    songInfo.style.display = "none";
  }

  playBtn.src = "svg/playbar/pause.svg";
  playBtn.classList.add("active");

  document.querySelectorAll("#audioList .song-item").forEach(item => item.classList.remove("active"));
  document.querySelector(`#audioList .song-item[data-index="${index}"]`)?.classList.add("active");

  document.querySelectorAll("#queueList .song-item").forEach(item => item.classList.remove("active"));
  document.querySelector(`#queueList .song-item[data-index="${index}"]`)?.classList.add("active");

  audio.play().catch(console.error);
  if (!isNaN(audio.duration)) {
    totalTimeSpan.textContent = formatTime(audio.duration);
    requestAnimationFrame(updateSeekbar);
  }
}

function playNextInMiniLoop() {
  if (miniLoopQueue.length > 0) {
    currentSongIndex = (currentSongIndex + 1) % miniLoopQueue.length;
    playSong(miniLoopQueue[currentSongIndex]);
  }
}

function playNextInQueue() {
  currentSongIndex = (currentSongIndex + 1) % currentPlaylist.length;
  playSong(currentSongIndex);
}

function playNextShuffle() {
  const pos = shuffleQueue.indexOf(currentSongIndex);
  let nextIndex = pos < shuffleQueue.length - 1 ? shuffleQueue[pos + 1] : shuffleQueue[0];
  shuffleHistory.push(currentSongIndex);
  playSong(nextIndex);
}

audio.addEventListener("play", () => {
  playBtn.src = "svg/playbar/pause.svg";
  playBtn.classList.add("active");
  requestAnimationFrame(updateSeekbar);
});

audio.addEventListener("pause", () => {
  playBtn.src = "svg/playbar/play.svg";
  playBtn.classList.remove("active");
});

audio.addEventListener("timeupdate", () => {
  if (!isNaN(audio.duration)) {
    const percent = (audio.currentTime / audio.duration) * 100;
    seekbarFilled.style.width = `${percent}%`;
    currentTimeSpan.textContent = formatTime(audio.currentTime);
  }
});

audio.addEventListener("loadedmetadata", () => {
  if (!isNaN(audio.duration)) {
    totalTimeSpan.textContent = formatTime(audio.duration);
  }
});

seekbar.addEventListener("click", (e) => {
  const rect = seekbar.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  audio.currentTime = percent * audio.duration;
});

playBtn.addEventListener("click", () => {
  if (audio.paused) audio.play().catch(console.error);
  else audio.pause();
});

volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});

nextBtn.addEventListener("click", () => {
  if (isMiniLoopActive && miniLoopQueue.length > 0) {
    playNextInMiniLoop();
  } else if (isLoop) {
    playSong(currentSongIndex);
  } else if (isShuffle) {
    playNextShuffle();
  } else {
    playNextInQueue();
  }
});

prevBtn.addEventListener("click", () => {
  if (isMiniLoopActive && miniLoopQueue.length > 0) {
    currentSongIndex = (currentSongIndex - 1 + miniLoopQueue.length) % miniLoopQueue.length;
    playSong(miniLoopQueue[currentSongIndex]);
  } else if (isLoop) {
    playSong(currentSongIndex);
  } else if (isShuffle && shuffleHistory.length > 0) {
    const prevIndex = shuffleHistory.pop();
    playSong(prevIndex);
  } else {
    currentSongIndex = (currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    playSong(currentSongIndex);
  }
});

loopBtn.addEventListener("click", () => {
  isLoop = !isLoop;
  audio.loop = isLoop;
  loopBtn.classList.toggle("active", isLoop);
});

function generateShuffleQueue() {
  shuffleQueue = currentPlaylist.map((_, index) => index);
  for (let i = shuffleQueue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffleQueue[i], shuffleQueue[j]] = [shuffleQueue[j], shuffleQueue[i]];
  }
  shuffleHistory = [currentSongIndex];
}

shuffleBtn.addEventListener("click", () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active", isShuffle);
  if (isShuffle) generateShuffleQueue();
});

audio.addEventListener("ended", () => {
  if (isMiniLoopActive && miniLoopQueue.length > 0) {
    playNextInMiniLoop();
  } else if (isShuffle) {
    playNextShuffle();
  } else {
    playNextInQueue();
  }
});

document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("click", () => {
    const folderName = card.getAttribute("data-folder");
    loadSongsGrouped(folderName);
  });
});

// Mini Loop Functionality
miniLoopBtn.addEventListener("click", async () => {
  if (!isMiniLoopActive) {
    try {
      miniLoopModal.classList.remove("hidden");
      miniLoopSongList.innerHTML = "";
      const res = await fetch("/data.json");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();

      for (const folder in data) {
        data[folder].forEach((song, index) => {
          const li = document.createElement("li");
          li.innerHTML = `
            <label>
              <input type="checkbox" value="${song.file}" data-title="${song.title}" data-folder="${folder}" data-index="${index}">
              ${song.title}
            </label>
          `;
          miniLoopSongList.appendChild(li);
        });
      }
    } catch (err) {
      console.error("Failed to load songs for Mini Loop", err);
      miniLoopSongList.innerHTML = `<p>Error loading songs: ${err.message}</p>`;
    }
  } else {
    isMiniLoopActive = false;
    miniLoopQueue = [];
    miniLoopModal.classList.add("hidden");
  }
});

addMiniLoopBtn.addEventListener("click", async () => {
  const selected = document.querySelectorAll("#miniLoopSongList input[type='checkbox']:checked");
  if (selected.length > 7) {
    alert("Select up to 7 songs only");
    return;
  }

  try {
    const res = await fetch("/data.json");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();

    miniLoopQueue = Array.from(selected).map(cb => ({
      title: cb.dataset.title,
      file: cb.value,
      folder: cb.dataset.folder,
      index: parseInt(cb.dataset.index)
    }));

    if (miniLoopQueue.length > 0) {
      isMiniLoopActive = true;
      currentPlaylist = miniLoopQueue.map(item => ({
        title: item.title,
        file: item.file
      }));
      currentSongIndex = 0;

      audioList.innerHTML = "<h2>Mini Loop</h2>";
      queueList.innerHTML = "";
      currentPlaylist.forEach((song, index) => {
        const li = document.createElement("li");
        li.classList.add("song-item");
        li.textContent = song.title;
        li.dataset.index = index;
        li.addEventListener("click", () => playSong(index));
        audioList.appendChild(li);

        const queueItem = document.createElement("li");
        queueItem.classList.add("song-item");
        queueItem.textContent = song.title;
        queueItem.dataset.index = index;
        queueItem.addEventListener("click", () => playSong(index));
        queueList.appendChild(queueItem);
      });

      playSong(0);
    }
    miniLoopModal.classList.add("hidden");
  } catch (err) {
    console.error("Failed to update Mini Loop", err);
    alert("Error updating Mini Loop: " + err.message);
  }
});

closeMiniLoopBtn.addEventListener("click", () => {
  miniLoopModal.classList.add("hidden");
});

clearMiniLoopBtn.addEventListener("click", () => {
  isMiniLoopActive = false;
  miniLoopQueue = [];
  currentPlaylist = [];
  currentSongIndex = 0;
  audio.pause();
  audio.src = "";
  songInfo.textContent = "";
  songInfo.style.display = "none";
  currentTimeSpan.textContent = "0:00";
  totalTimeSpan.textContent = "0:00";
  seekbarFilled.style.width = "0%";
  audioList.innerHTML = "<h2>Your Library</h2>";
  queueList.innerHTML = "";
  document.querySelectorAll(".song-item").forEach(item => item.classList.remove("active"));
  miniLoopModal.classList.add("hidden");
});

document.getElementById("clearLibraryBtn").addEventListener("click", () => {
  isMiniLoopActive = false;
  miniLoopQueue = [];
  currentPlaylist = [];
  currentSongIndex = 0;
  audio.pause();
  audio.src = "";
  songInfo.textContent = "";
  songInfo.style.display = "none";
  currentTimeSpan.textContent = "0:00";
  totalTimeSpan.textContent = "0:00";
  seekbarFilled.style.width = "0%";
  audioList.innerHTML = "<h2>Your Library</h2>";
  document.querySelectorAll(".song-item").forEach(item => item.classList.remove("active"));
});

document.getElementById("clearQueueBtn").addEventListener("click", () => {
  queueList.innerHTML = "";
});

const themeToggleBtn = document.getElementById("themeToggleBtn");
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    themeToggleBtn.textContent = document.body.classList.contains("light-mode") ? "Dark Mode" : "Light Mode";
  });
}

window.addEventListener("load", () => {
  if (typeof ColorThief === "undefined") {
    console.error("ColorThief library is not loaded.");
    return;
  }

  const colorThief = new ColorThief();
  const cards = document.querySelectorAll(".card");

  function applyGlowColor(card, img) {
    try {
      if (!img.complete || img.naturalWidth === 0) {
        console.warn("Image not loaded or invalid:", img.src);
        card.style.setProperty("--glow-color", "rgba(128, 128, 128, 0.5)");
        return;
      }

      const color = colorThief.getColor(img);
      let [r, g, b] = color;

      if (document.body.classList.contains("light-mode") || document.body.classList.contains("invert-mode")) {
        r = Math.max(50, r - 100);
        g = Math.max(50, g - 100);
        b = Math.max(50, b - 100); // Fixed typo from Code 2
      }

      const rgb = `rgba(${r}, ${g}, ${b}, 0.5)`; // Use rgba like Code 1
      card.style.setProperty("--glow-color", rgb);

      if (document.body.classList.contains("light-mode")) {
        card.classList.add("enhanced-glow");
      } else {
        card.classList.remove("enhanced-glow");
      }
    } catch (err) {
      console.warn("Couldn't extract color from image:", img.src, err);
      card.style.setProperty("--glow-color", "rgba(128, 128, 128, 0.5)");
    }
  }

  cards.forEach(card => {
    const img = card.querySelector(".main-img");
    if (!img) {
      console.warn("No .main-img found in card:", card);
      return;
    }

    img.crossOrigin = "anonymous";
    applyGlowColor(card, img);

    if (img.complete && img.naturalWidth !== 0) {
      applyGlowColor(card, img);
    } else {
      img.addEventListener("load", () => applyGlowColor(card, img), { once: true });
      img.addEventListener("error", () => {
        console.warn("Image failed to load:", img.src);
        card.style.setProperty("--glow-color", "rgba(128, 128, 128, 0.5)");
      }, { once: true });
    }

    card.addEventListener("mouseenter", () => {
      card.classList.add("glow-hover");
      applyGlowColor(card, img); // Reapply on hover like Code 1
    });

    card.addEventListener("mouseleave", () => {
      card.classList.remove("glow-hover");
    });

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", () => {
        setTimeout(() => applyGlowColor(card, img), 0); // Reapply on theme change
      }, { once: true });
    }
  });

  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    .enhanced-glow.glow-hover {
      box-shadow: 0 0 30px 10px var(--glow-color) !important;
    }
  `;
  document.head.appendChild(styleSheet);
});