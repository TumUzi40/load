
/*
 * เพิ่มรายการหนังใน MOVIES
 * ใช้เฉพาะ URL วิดีโอที่มีสิทธิ์เผยแพร่
 */
const MOVIES = [
  {
    id: 1,
    title: "หนังตัวอย่าง273flix",
    category: "แนะนำ",
    year: 2026,
    poster: "https://raw.githubusercontent.com/TumUzi40/img/refs/heads/main/Screenshot_20261027_134400_Telegram%20Gold.jpg",
    type: "mp4",
    url: "https://tumuzi40.github.io/load/siamlink1/clip1.mp4"
  },
  {
    id: 2,
    title: "หนังตัวอย่าง273flix",
    category: "แอ็กชัน",
    year: 2026,
    poster: "https://raw.githubusercontent.com/TumUzi40/img/refs/heads/main/Screenshot_20261027_134400_Telegram%20Gold.jpg",
    type: "m3u8",
    url: "https://tumuzi40.github.io/load/siamlink1/clip1.mp4"
  }
];

const list = document.getElementById("movieList");
const search = document.getElementById("search");
const category = document.getElementById("category");
const empty = document.getElementById("empty");
const modal = document.getElementById("playerModal");
const video = document.getElementById("videoPlayer");
const title = document.getElementById("movieTitle");
const message = document.getElementById("playerMessage");

let hls = null;

function validUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

// สร้างตัวเลือกหมวดหมู่อัตโนมัติ
[...new Set(MOVIES.map(m => m.category))].forEach(cat => {
  const option = document.createElement("option");
  option.value = cat;
  option.textContent = cat;
  category.appendChild(option);
});

function renderMovies() {
  const q = search.value.trim().toLowerCase();
  const cat = category.value;

  const results = MOVIES.filter(m =>
    `${m.title} ${m.category}`.toLowerCase().includes(q) &&
    (cat === "all" || m.category === cat)
  );

  empty.hidden = results.length > 0;

  list.innerHTML = results.map(m => `
    <article class="movie-card" tabindex="0"
      data-id="${Number(m.id)}" role="button">
      <div class="poster">
        ${validUrl(m.poster || "")
          ? `<img loading="lazy" src="${escapeHTML(m.poster)}"
                 alt="${escapeHTML(m.title)}">`
          : `<div class="poster-placeholder">SF</div>`}
      </div>
      <h3>${escapeHTML(m.title)}</h3>
      <p>${escapeHTML(m.category)} · ${Number(m.year) || ""}</p>
    </article>
  `).join("");
}

function closePlayer() {
  if (hls) {
    hls.destroy();
    hls = null;
  }

  video.pause();
  video.removeAttribute("src");
  video.load();

  modal.hidden = true;
  document.body.style.overflow = "";
}

async function playMovie(movie) {
  if (!movie || !validUrl(movie.url)) {
    alert("กรุณาใส่ URL วิดีโอจริงในไฟล์ app.js");
    return;
  }

  closePlayer();

  title.textContent = movie.title;
  message.textContent = "กำลังโหลดวิดีโอ...";
  modal.hidden = false;
  document.body.style.overflow = "hidden";

  video.poster = validUrl(movie.poster || "")
    ? movie.poster
    : "";

  if (movie.type === "mp4") {
    video.src = movie.url;
    video.load();
    message.textContent = "";
    return;
  }

  if (movie.type !== "m3u8") {
    message.textContent = "รองรับเฉพาะ MP4 และ M3U8";
    return;
  }

  // Safari / iPhone ที่รองรับ HLS ในตัว
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = movie.url;
    video.load();
    message.textContent = "";
    return;
  }

  // เบราว์เซอร์อื่นใช้ HLS.js
  try {
    if (!window.Hls) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    if (window.Hls && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(movie.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        message.textContent = "";
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          message.textContent =
            "เล่นไม่ได้ กรุณาตรวจสอบลิงก์และการตั้งค่า CORS";
        }
      });
    } else {
      message.textContent =
        "เบราว์เซอร์นี้ไม่รองรับ HLS";
    }
  } catch {
    message.textContent = "โหลดตัวเล่น M3U8 ไม่สำเร็จ";
  }
}

list.addEventListener("click", event => {
  const card = event.target.closest("[data-id]");
  if (!card) return;

  const movie = MOVIES.find(
    m => m.id === Number(card.dataset.id)
  );

  playMovie(movie);
});

list.addEventListener("keydown", event => {
  if (!["Enter", " "].includes(event.key)) return;

  const card = event.target.closest("[data-id]");
  if (!card) return;

  event.preventDefault();

  const movie = MOVIES.find(
    m => m.id === Number(card.dataset.id)
  );

  playMovie(movie);
});

search.addEventListener("input", renderMovies);
category.addEventListener("change", renderMovies);

document.getElementById("closePlayer")
  .addEventListener("click", closePlayer);

modal.addEventListener("click", event => {
  if (event.target === modal) closePlayer();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modal.hidden) {
    closePlayer();
  }
});

renderMovies();
