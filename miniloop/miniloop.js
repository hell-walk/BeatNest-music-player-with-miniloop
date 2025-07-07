document.getElementById("miniLoopToggle").addEventListener("click", async () => {
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

  const queue = [];
  selected.forEach(cb => {
    queue.push({ title: cb.dataset.title, file: cb.value });
  });

  const audioList = document.getElementById("audioList");
  audioList.innerHTML = "<h2>Mini Loop</h2>";

  queue.forEach(song => {
    const li = document.createElement("li");
    li.classList.add("song-item");
    li.textContent = song.title;
    li.dataset.src = song.file;
    audioList.appendChild(li);
  });

  document.getElementById("miniLoopModal").classList.add("hidden");
});
document.getElementById("addMiniLoopBtn").addEventListener("click", () => {
  const selected = document.querySelectorAll("#miniLoopSongList input[type='checkbox']:checked");

  if (selected.length > 7) {
    alert("You can select a maximum of 7 songs for Mini Loop.");
    return;
  }

  const queue = [];
  selected.forEach(cb => {
    queue.push({ title: cb.dataset.title, file: cb.value });
  });

  const audioList = document.getElementById("audioList");
  audioList.innerHTML = "<h2>Mini Loop</h2>";

  queue.forEach(song => {
    const li = document.createElement("li");
    li.classList.add("song-item");
    li.textContent = song.title;
    li.dataset.src = song.file;
    audioList.appendChild(li);
  });

  document.getElementById("miniLoopModal").classList.add("hidden");
});
const maxMiniLoopSongs = 7;

document.getElementById("miniLoopSongList").addEventListener("change", () => {
  const checked = document.querySelectorAll("#miniLoopSongList input[type='checkbox']:checked");
  if (checked.length > maxMiniLoopSongs) {
    alert(`Only ${maxMiniLoopSongs} songs can be added.`);
    checked[checked.length - 1].checked = false;
  }
});
document.getElementById("miniLoopToggle").addEventListener("click", async () => {
  const modal = document.getElementById("miniLoopModal");
  modal.classList.remove("hidden");

  const listContainer = document.getElementById("miniLoopSongList");
  listContainer.innerHTML = ""; // ⬅️ This clears the song list on every open

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

