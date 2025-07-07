let shuffleQueue = [];
let shuffleHistory = [];
let currentSongIndex = 0;
let currentPlaylist = [];
const audio = new Audio();
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

let isLoop = false;
let isShuffle = false;

// Load songs from selected playlist
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

      // Clear existing UI
      queueList.innerHTML = "";

      // Reset shuffle state if enabled
      if (isShuffle) {
        generateShuffleQueue();
        shuffleHistory = [];
      } else {
        shuffleQueue = [];
        shuffleHistory = [];
      }

      // Render songs in playlist and queue
      currentPlaylist.forEach((song, index) => {
        // Playlist item
        const li = document.createElement("li");
        li.textContent = song.title;
        li.classList.add("song-item");
        li.dataset.index = index;
        li.addEventListener("click", () => playSong(index));
        container.appendChild(li);

        // Queue item
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


// Play a selected song
function playSong(index) {
  if (!currentPlaylist[index]) return;

  currentSongIndex = index;
  const song = currentPlaylist[index];
  audio.src = song.file;

  // Reset playbar UI immediately
  const songInfo = document.getElementById("songInfo");
  if (songInfo) {
    songInfo.textContent = song.title || "Unknown Song";
  }

  const playBtn = document.getElementById("playBtn");
  playBtn.src = "svg/playbar/pause.svg";
  playBtn.classList.add("active");

  // Add highlighting for selected song
  document.querySelectorAll("#audioList .song-item").forEach(item => item.classList.remove("active"));
  document.querySelector(`#audioList .song-item[data-index="${index}"]`)?.classList.add("active");

  document.querySelectorAll("#queueList .song-item").forEach(item => item.classList.remove("active"));
  document.querySelector(`#queueList .song-item[data-index="${index}"]`)?.classList.add("active");

  // Play song after metadata is loaded (to get duration)
  audio.addEventListener("loadedmetadata", function autoStartOnce() {
    totalTimeSpan.textContent = formatTime(audio.duration);
    audio.play().catch(console.error);
    requestAnimationFrame(updateSeekbar); // Start UI update loop
    audio.removeEventListener("loadedmetadata", autoStartOnce);
  });
}



// Event: audio playing
audio.addEventListener("play", () => {
  requestAnimationFrame(updateSeekbar);
  playBtn.src = "svg/playbar/play.svg";
  playBtn.classList.add("active");
});

// Event: audio paused
audio.addEventListener("pause", () => {
  playBtn.src = "svg/playbar/pause.svg";
  playBtn.classList.remove("active");
});

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}
audio.addEventListener("timeupdate", () => {
  const percent = (audio.currentTime / audio.duration) * 100;
  seekbarFilled.style.width = `${percent}%`;
  currentTimeSpan.textContent = formatTime(audio.currentTime);
});

audio.addEventListener("loadedmetadata", () => {
  totalTimeSpan.textContent = formatTime(audio.duration);
});

audio.addEventListener("play", () => {
  requestAnimationFrame(updateSeekbar);
});


// Event: seekbar click
seekbar.addEventListener("click", (e) => {
  seekbarFilled.style.transition = "width 0.2s ease";
  const rect = seekbar.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const percent = offsetX / rect.width;
  audio.currentTime = percent * audio.duration;
  setTimeout(() => seekbarFilled.style.transition = "none", 300);
});

// Play/Pause button
playBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play().catch(console.error); // always handle play() promise
  } else {
    audio.pause();
  }
});

audio.addEventListener("play", () => {
  playBtn.src = "svg/playbar/play.svg";
  playBtn.classList.add("active");
  requestAnimationFrame(updateSeekbar);
});

audio.addEventListener("pause", () => {
  playBtn.src = "svg/playbar/pause.svg";
  playBtn.classList.remove("active");
});

// Volume control
volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});

nextBtn.addEventListener("click", () => {
  if (isShuffle) {
    let nextIndex;
    const currentShufflePosition = shuffleQueue.indexOf(currentSongIndex);

    if (currentShufflePosition >= 0 && currentShufflePosition < shuffleQueue.length - 1) {
      nextIndex = shuffleQueue[currentShufflePosition + 1];
    } else {
      generateShuffleQueue(); // Start fresh if at end
      nextIndex = shuffleQueue[0];
    }

    playSong(nextIndex);
  } else {
    currentSongIndex = (currentSongIndex + 1) % currentPlaylist.length;
    playSong(currentSongIndex);
  }
});

prevBtn.addEventListener("click", () => {
  if (isShuffle) {
    let prevIndex;
    const currentShufflePosition = shuffleQueue.indexOf(currentSongIndex);

    if (currentShufflePosition > 0) {
      prevIndex = shuffleQueue[currentShufflePosition - 1];
    } else {
      prevIndex = shuffleQueue[shuffleQueue.length - 1];
    }

    playSong(prevIndex);
  } else {
    currentSongIndex = (currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    playSong(currentSongIndex);
  }
});




// Loop toggle
loopBtn.addEventListener("click", () => {
  isLoop = !isLoop;
  loopBtn.classList.toggle("active", isLoop);
});

// Shuffle toggle

function generateShuffleQueue() {
  shuffleQueue = currentPlaylist.map((_, index) => index);

  // Fisher-Yates Shuffle
  for (let i = shuffleQueue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffleQueue[i], shuffleQueue[j]] = [shuffleQueue[j], shuffleQueue[i]];
  }

  // Optional: Start from the current song
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
    shuffleHistory = [currentSongIndex];  // start history from current
  }
});

// Auto play next / loop
audio.addEventListener("ended", () => {
  if (isLoop) {
    playSong(currentSongIndex);
  } else if (isShuffle) {
    const currentShufflePosition = shuffleQueue.indexOf(currentSongIndex);
    let nextIndex;

    if (currentShufflePosition >= 0 && currentShufflePosition < shuffleQueue.length - 1) {
      nextIndex = shuffleQueue[currentShufflePosition + 1];
    } else {
      generateShuffleQueue(); // restart
      nextIndex = shuffleQueue[0];
    }

    playSong(nextIndex);
  } else {
    currentSongIndex = (currentSongIndex + 1) % currentPlaylist.length;
    playSong(currentSongIndex);
  }
});




// Load playlist on card click
document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("click", () => {
    const folderName = card.getAttribute("data-folder");
    loadSongsGrouped(folderName);
  });
});
