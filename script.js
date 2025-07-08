// Fully Updated script.js with Mini Loop Support and Clear Button in Playbar

let shuffleQueue = [];
let shuffleHistory = [];
let currentSongIndex = 0;
let currentPlaylist = [];
// const audio = new Audio();
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

let isLoop = false;
let isShuffle = false;

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function updateSeekbar() {
  if (audio.paused) return;
  const percent = (audio.currentTime / audio.duration) * 100;
  seekbarFilled.style.width = `${percent}%`;
  currentTimeSpan.textContent = formatTime(audio.currentTime);
  requestAnimationFrame(updateSeekbar);
}

async function loadSongsGrouped(folderName) {
  try {
    const res = await fetch("data.json");
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

      if (isShuffle) {
        generateShuffleQueue();
        shuffleHistory = [];
      } else {
        shuffleQueue = [];
        shuffleHistory = [];
      }

      currentPlaylist.forEach((song, index) => {
        const li = document.createElement("li");
        li.textContent = song.title;
        li.classList.add("song-item");
        li.dataset.index = index;
        li.addEventListener("click", () => playSong(index));
        container.appendChild(li);

        const queueItem = document.createElement("li");
        queueItem.textContent = song.title;
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
  }
}

function playSong(index) {
  if (!currentPlaylist[index]) return;
  currentSongIndex = index;
  const song = currentPlaylist[index];
  audio.src = song.file;

  // ✅ Ensure loop setting is always reapplied
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

  audio.addEventListener("loadedmetadata", function autoStartOnce() {
    totalTimeSpan.textContent = formatTime(audio.duration);
    audio.play().catch(console.error);
    requestAnimationFrame(updateSeekbar);
    audio.removeEventListener("loadedmetadata", autoStartOnce);
  });
}

audio.addEventListener("play", () => {
  playBtn.src = "svg/playbar/play.svg";
  playBtn.classList.add("active");
  requestAnimationFrame(updateSeekbar);
});

audio.addEventListener("pause", () => {
  playBtn.src = "svg/playbar/pause.svg";
  playBtn.classList.remove("active");
});

audio.addEventListener("timeupdate", () => {
  const percent = (audio.currentTime / audio.duration) * 100;
  seekbarFilled.style.width = `${percent}%`;
  currentTimeSpan.textContent = formatTime(audio.currentTime);
});

audio.addEventListener("loadedmetadata", () => {
  totalTimeSpan.textContent = formatTime(audio.duration);
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
  if (isLoop) {
    playSong(currentSongIndex); // restart current song
  } else if (isShuffle) {
    const pos = shuffleQueue.indexOf(currentSongIndex);
    let nextIndex = pos < shuffleQueue.length - 1 ? shuffleQueue[pos + 1] : shuffleQueue[0];
    playSong(nextIndex);
  } else {
    currentSongIndex = (currentSongIndex + 1) % currentPlaylist.length;
    playSong(currentSongIndex);
  }
});


prevBtn.addEventListener("click", () => {
  if (isLoop) {
    playSong(currentSongIndex); // restart current song
  } else if (isShuffle) {
    const pos = shuffleQueue.indexOf(currentSongIndex);
    let prevIndex = pos > 0 ? shuffleQueue[pos - 1] : shuffleQueue[shuffleQueue.length - 1];
    playSong(prevIndex);
  } else {
    currentSongIndex = (currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    playSong(currentSongIndex);
  }
});




loopBtn.addEventListener("click", () => {
  isLoop = !isLoop;
  audio.loop = isLoop; // Actual audio looping
  loopBtn.classList.toggle("active", isLoop);
});

function generateShuffleQueue() {
  shuffleQueue = currentPlaylist.map((_, index) => index);
  for (let i = shuffleQueue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffleQueue[i], shuffleQueue[j]] = [shuffleQueue[j], shuffleQueue[i]];
  }
  const currentIndex = shuffleQueue.indexOf(currentSongIndex);
  if (currentIndex > 0) {
    [shuffleQueue[0], shuffleQueue[currentIndex]] = [shuffleQueue[currentIndex], shuffleQueue[0]];
  }
  shuffleHistory = [];
}

shuffleBtn.addEventListener("click", () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active", isShuffle);
  if (isShuffle) {
    generateShuffleQueue();
    shuffleHistory = [currentSongIndex];
  }
});

audio.addEventListener("ended", () => {
  if (isMiniLoopActive && miniLoopQueue.length > 0) {
    playNextInMiniLoop();
  } else if (isShuffle) {
    playNextShuffle();
  } else {
    playNextInQueue(); // or your normal next song function
  }
});



document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("click", () => {
    const folderName = card.getAttribute("data-folder");
    loadSongsGrouped(folderName);
  });
});

miniLoopBtn.addEventListener("click", async () => {
  const modal = document.getElementById("miniLoopModal");
  modal.classList.remove("hidden");

  const listContainer = document.getElementById("miniLoopSongList");
  listContainer.innerHTML = "";

  const res = await fetch("data.json");
  const data = await res.json();

  for (const folder in data) {
    data[folder].forEach(song => {
      const li = document.createElement("li");
      li.innerHTML = `
        <label>
          <input type="checkbox" value="${song.file}" data-title="${song.title}">
          ${song.title}
        </label>
      `;
      listContainer.appendChild(li);
    });
  }
});

document.getElementById("closeMiniLoop").addEventListener("click", () => {
  document.getElementById("miniLoopModal").classList.add("hidden");
});

document.getElementById("addMiniLoopBtn").addEventListener("click", () => {
  const selected = document.querySelectorAll("#miniLoopSongList input[type='checkbox']:checked");
  if (selected.length > 7) return alert("Select up to 7 songs only");

  const queue = [];
  selected.forEach(cb => {
    queue.push({ title: cb.dataset.title, file: cb.value });
  });

  currentPlaylist = queue;
  currentSongIndex = 0;

  audioList.innerHTML = "<h2>Mini Loop</h2>";
  queueList.innerHTML = "";
  queue.forEach((song, index) => {
    const li = document.createElement("li");
    li.classList.add("song-item");
    li.textContent = song.title;
    li.dataset.index = index;
    li.dataset.src = song.file;
    li.addEventListener("click", () => playSong(index));
    audioList.appendChild(li);
  });

  if (queue.length > 0) playSong(0);
  document.getElementById("miniLoopModal").classList.add("hidden");
});

clearMiniLoopBtn.addEventListener("click", () => {
  document.getElementById("audioList").innerHTML = "<h2>Your Library</h2>";
  document.querySelectorAll("#miniLoopSongList input[type='checkbox']").forEach(cb => cb.checked = false);
  currentPlaylist = [];
  currentSongIndex = 0;
  audio.pause();
  audio.src = "";
  songInfo.textContent = "";
  songInfo.style.display = "none";
  currentTimeSpan.textContent = "0:00";
  totalTimeSpan.textContent = "0:00";
  seekbarFilled.style.width = "0%";
  queueList.innerHTML = "";
  document.querySelectorAll(".song-item").forEach(item => item.classList.remove("active"));
});

// Clear Library Button
document.getElementById("clearLibraryBtn").addEventListener("click", () => {
  document.getElementById("audioList").innerHTML = "<h2>Your Library</h2>";
  currentPlaylist = [];
  currentSongIndex = 0;
  audio.pause();
  audio.src = "";
  songInfo.textContent = "";
  songInfo.style.display = "none";
  currentTimeSpan.textContent = "0:00";
  totalTimeSpan.textContent = "0:00";
  seekbarFilled.style.width = "0%";
  document.querySelectorAll(".song-item").forEach(item => item.classList.remove("active"));
});

// Clear Queue Button
document.getElementById("clearQueueBtn").addEventListener("click", () => {
  document.getElementById("queueList").innerHTML = "";
});

// ✅ Theme toggle fix
const themeToggleBtn = document.getElementById("themeToggleBtn");
themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");

  if (document.body.classList.contains("light-mode")) {
    themeToggleBtn.textContent = "Dark Mode";
  } else {
    themeToggleBtn.textContent = "Light Mode";
  }
});
