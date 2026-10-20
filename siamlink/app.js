/*
  SIAMLINK MOVIE
  เปลี่ยน title, category, poster, video, type และ description ตามข้อมูลจริงของคุณ
  type รองรับ "mp4" หรือ "m3u8"
*/
const DEMO_MP4 = "http://tbtv.me:2095/play/live.php?mac=00:1A:79:E7:32:0C&stream=813033&extension=m3u8";

const movies = [
  {
    id: 1,
    title: "ตัวอย่างวิดีโอ",
    category: "สารคดี",
    year: "2026",
    type: "mp4",
    poster: "http://tbtv.me:2095/play/live.php?mac=00:1A:79:E7:32:0C&stream=813033&extension=m3u8",
    video: DEMO_MP4,
    description: "รายการนี้เป็นวิดีโอทดสอบสำหรับตรวจสอบว่าเครื่องเล่นทำงานได้"
  },
  {
    id: 2,
    title: "ภาพยนตร์แอ็กชันของคุณ",
    category: "แอ็กชัน",
    year: "2026",
    type: "m3u8",
    poster: "https://raw.githubusercontent.com/TumUzi40/img2/refs/heads/main/1777541322782.jpg",
    video: "http://tbtv.me:2095/play/live.php?mac=00:1A:79:E7:32:0C&stream=115620&extension=m3u8",
    description: "เปลี่ยน URL ใน app.js เป็นไฟล์ MP4 ที่คุณมีสิทธิ์ใช้งาน"
  },
  {
    id: 3,
    title: "ซีรีส์ตัวอย่าง M3U8",
    category: "ดราม่า",
    year: "2026",
    type: "m3u8",
    poster: "https://raw.githubusercontent.com/TumUzi40/img2/refs/heads/main/1777541322782.jpg",
    video: "http://tbtv.me:2095/play/live.php?mac=00:1A:79:E7:32:0C&stream=115620&extension=m3u8",
    description: "ใส่ URL สตรีม HLS .m3u8 ที่ใช้งานได้และได้รับอนุญาต"
  },
  {
    id: 4,
    title: "หนังตลกของคุณ",
    category: "ตลก",
    year: "2025",
    type: "mp4",
    poster: "https://raw.githubusercontent.com/TumUzi40/img2/refs/heads/main/1777541322782.jpg",
    video: "https://ezycdn.com/playlist-4bff4t6e-FHD.m3u8",
    description: "ใส่ลิงก์ MP4 ของคุณในช่อง video"
  },
  {
    id: 5,
    title: "test ระบบ",
    category: "สารคดี",
    year: "2025",
    type: "m3u8",
    poster: "https://raw.githubusercontent.com/TumUzi40/img2/refs/heads/main/1777541322782.jpg",
    video: "https://ezycdn.com/playlist-pkr7g7b1-FHD.m3u8",
    description: "รายการตัวอย่างสำหรับหมวดสารคดี"
  }
];

const searchInput = document.querySelector("#searchInput");
const movieGrid = document.querySelector("#movieGrid");
const emptyState = document.querySelector("#emptyState");
const resultCount = document.querySelector("#resultCount");
const playerSection = document.querySelector("#playerSection");
const videoPlayer = document.querySelector("#videoPlayer");
const playerTitle = document.querySelector("#playerTitle");
const playerDescription = document.querySelector("#playerDescription");
const playerMessage = document.querySelector("#playerMessage");

let activeCategory = "ทั้งหมด";
let hlsInstance = null;

function safeText(value) {
  return String(value ?? "");
}

function renderMovies() {
  const query = searchInput.value.trim().toLocaleLowerCase("th");
  const visibleMovies = movies.filter(movie => {
    const matchesQuery =
      safeText(movie.title).toLocaleLowerCase("th").includes(query);
    const matchesCategory =
      activeCategory === "ทั้งหมด" || movie.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  movieGrid.replaceChildren();
  resultCount.textContent = `${visibleMovies.length} รายการ`;

  for (const movie of visibleMovies) {
    const card = document.createElement("article");
    card.className = "movie-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `เล่น ${movie.title}`);

    const poster = document.createElement("div");
    poster.className = "poster";

    const fallback = document.createElement("div");
    fallback.className = "poster-fallback";
    fallback.textContent = movie.title;
    poster.appendChild(fallback);

    if (movie.poster) {
      const img = document.createElement("img");
      img.src = movie.poster;
      img.alt = `โปสเตอร์ ${movie.title}`;
      img.loading = "lazy";
      img.addEventListener("load", () => fallback.remove());
      img.addEventListener("error", () => img.remove());
      poster.appendChild(img);
    }

    const playBubble = document.createElement("span");
    playBubble.className = "play-bubble";
    playBubble.setAttribute("aria-hidden", "true");
    playBubble.textContent = "▶";
    poster.appendChild(playBubble);

    const info = document.createElement("div");
    info.className = "movie-info";

    const title = document.createElement("h3");
    title.textContent = movie.title;

    const meta = document.createElement("div");
    meta.className = "movie-meta";
    meta.textContent = `${movie.category} • ${movie.year}`;

    const type = document.createElement("span");
    type.className = "type-pill";
    type.textContent = safeText(movie.type).toUpperCase();

    info.append(title, meta, type);
    card.append(poster, info);
    card.addEventListener("click", () => playMovie(movie.id));
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        playMovie(movie.id);
      }
    });
    movieGrid.appendChild(card);
  }

  emptyState.hidden = visibleMovies.length !== 0;
}

function destroyHls() {
  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }
}

function playMovie(id) {
  const movie = movies.find(item => item.id === id);
  if (!movie) return;

  playerSection.hidden = false;
  playerTitle.textContent = movie.title;
  playerDescription.textContent = movie.description || "";
  playerMessage.textContent = "กำลังเตรียมวิดีโอ...";
  playerSection.scrollIntoView({ behavior: "smooth", block: "start" });

  destroyHls();
  videoPlayer.pause();
  videoPlayer.removeAttribute("src");
  videoPlayer.load();

  const url = safeText(movie.video).trim();
  const type = safeText(movie.type).toLowerCase();

  if (!url || url.startsWith("PASTE_YOUR_")) {
    playerMessage.textContent =
      "ยังไม่ได้ใส่ URL วิดีโอ: แก้ไขค่า video ของรายการนี้ในไฟล์ app.js";
    return;
  }

  if (type === "m3u8" || /\.m3u8($|\?)/i.test(url)) {
    // Safari บางรุ่นเล่น HLS ได้โดยตรง
    if (videoPlayer.canPlayType("application/vnd.apple.mpegurl")) {
      videoPlayer.src = url;
      videoPlayer.load();
      playerMessage.textContent = "โหลดสตรีม HLS แล้ว กดเล่นเพื่อเริ่มรับชม";
    } else if (window.Hls && Hls.isSupported()) {
      hlsInstance = new Hls({
        enableWorker: true,
        maxBufferLength: 30
      });
      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(videoPlayer);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        playerMessage.textContent = "สตรีมพร้อมเล่น กดปุ่มเล่นเพื่อเริ่มรับชม";
      });

      hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          playerMessage.textContent =
            "เล่นสตรีมไม่ได้ ตรวจสอบ URL, CORS, token และความพร้อมของเซิร์ฟเวอร์";
          destroyHls();
        }
      });
    } else {
      playerMessage.textContent =
        "เบราว์เซอร์นี้ไม่รองรับ HLS โปรดลองใช้ Safari หรือเบราว์เซอร์รุ่นใหม่";
      return;
    }
  } else {
    // MP4 หรือไฟล์วิดีโอที่เบราว์เซอร์รองรับ
    videoPlayer.src = url;
    videoPlayer.load();
    playerMessage.textContent = "วิดีโอพร้อมโหลด กดเล่นเพื่อเริ่มรับชม";
  }

  videoPlayer.play().catch(() => {
    // การเล่นอัตโนมัติอาจถูกบล็อก ให้ผู้ใช้กดปุ่มเล่นเอง
  });
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    document.querySelectorAll(".filter").forEach(item => {
      item.classList.toggle("active", item === button);
    });
    renderMovies();
  });
});

searchInput.addEventListener("input", renderMovies);
document.querySelector("#featuredPlay").addEventListener("click", () => {
  playMovie(movies[0].id);
});

document.querySelector("#closePlayer").addEventListener("click", () => {
  videoPlayer.pause();
  destroyHls();
  videoPlayer.removeAttribute("src");
  videoPlayer.load();
  playerSection.hidden = true;
});

videoPlayer.addEventListener("error", () => {
  if (!playerSection.hidden) {
    playerMessage.textContent =
      "ไม่สามารถเล่นวิดีโอได้ ตรวจสอบ URL, รูปแบบไฟล์, HTTPS, CORS และสิทธิ์เข้าถึง";
  }
});

renderMovies();
