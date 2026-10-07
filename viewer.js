const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ago = (t) => { if (!t) return ""; const m = (Date.now() - t) / 6e4; return m < 1 ? "just now" : m < 60 ? ~~m + "m ago" : m < 1440 ? ~~(m / 60) + "h ago" : ~~(m / 1440) + "d ago"; };
const fmtSize = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
const stage = $("#stage"), img = $("#img");
const MIN = 0.05, MAX = 32;

let S = [], cur = null, q = "", imgUrl = null;
const thumbs = {};
const v = { scale: 1, rot: 0, flip: false, tx: 0, ty: 0 };

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 1800);
}

/* ---------- library ---------- */
async function load() { S = await listImages(); draw(); }

function draw() {
  const list = S.filter((s) => !q || s.name.toLowerCase().includes(q));
  $("#list").innerHTML = list.map((s) => `<div class="item ${s.id === cur ? "on" : ""}" tabindex="0" data-id="${s.id}">
    <img class="th" alt="" src="${thumbs[s.id] || (thumbs[s.id] = URL.createObjectURL(s.blob))}">
    <div><b>${esc(s.name)}</b><small>${s.w ? s.w + " × " + s.h + ", " : ""}${fmtSize(s.blob.size)}, ${ago(s.created)}</small></div></div>`).join("")
    || '<p class="empty">No images yet. Paste one to get started.</p>';
}

function show() {
  const s = S.find((x) => x.id === cur);
  $("#empty").hidden = !!s; $("#view").hidden = !s;
  if (!s) return;
  if (imgUrl) URL.revokeObjectURL(imgUrl);
  imgUrl = URL.createObjectURL(s.blob);
  v.rot = 0; v.flip = false;
  img.onload = fit;
  img.src = imgUrl;
  $("#nm").value = s.name;
  $("#meta").textContent = `${s.w ? s.w + " × " + s.h + " px, " : ""}${fmtSize(s.blob.size)}, ${(s.blob.type || "image").replace("image/", "").toUpperCase()}, added ${ago(s.created)}`;
}

function select(id) {
  cur = id;
  history.replaceState(null, "", id ? `viewer.html?id=${id}` : "viewer.html");
  draw(); show();
}

async function addImage(blob, name) {
  const id = crypto.randomUUID();
  await saveImage(id, blob, name || "Pasted image " + new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" }));
  await load(); select(id);
}

/* ---------- view transform ---------- */
function render() {
  img.style.transform = `translate(-50%,-50%) translate(${v.tx}px,${v.ty}px) rotate(${v.rot}deg) scale(${v.flip ? -v.scale : v.scale},${v.scale})`;
  $("#zoom").textContent = Math.round(v.scale * 100) + "%";
}
function fit() {
  const side = v.rot % 180 !== 0;
  const w = side ? img.naturalHeight : img.naturalWidth, h = side ? img.naturalWidth : img.naturalHeight;
  if (!w || !h) return;
  v.scale = Math.max(MIN, Math.min((stage.clientWidth - 48) / w, (stage.clientHeight - 48) / h, 1));
  v.tx = v.ty = 0; render();
}
function zoomAt(f, cx = 0, cy = 0) {
  const next = Math.min(MAX, Math.max(MIN, v.scale * f)), k = next / v.scale;
  v.tx = cx - (cx - v.tx) * k; v.ty = cy - (cy - v.ty) * k; v.scale = next; render();
}

stage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const r = stage.getBoundingClientRect();
  zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
}, { passive: false });

let drag = null;
stage.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, tx: v.tx, ty: v.ty }; stage.setPointerCapture(e.pointerId); stage.classList.add("dragging"); });
stage.addEventListener("pointermove", (e) => { if (drag) { v.tx = drag.tx + e.clientX - drag.x; v.ty = drag.ty + e.clientY - drag.y; render(); } });
const endDrag = () => { drag = null; stage.classList.remove("dragging"); };
stage.addEventListener("pointerup", endDrag); stage.addEventListener("pointercancel", endDrag);
stage.addEventListener("dblclick", fit);
window.addEventListener("resize", () => { if (cur) fit(); });

$("#zi").onclick = () => zoomAt(1.25); $("#zo").onclick = () => zoomAt(1 / 1.25);
$("#fit").onclick = fit; $("#act").onclick = () => { v.scale = 1; v.tx = v.ty = 0; render(); };
$("#rl").onclick = () => { v.rot = (v.rot + 270) % 360; fit(); };
$("#rr").onclick = () => { v.rot = (v.rot + 90) % 360; fit(); };
$("#fl").onclick = () => { v.flip = !v.flip; render(); };
const bgs = ["default", "light", "dark", "checker"]; let bgi = 0;
$("#bg").onclick = () => { bgi = (bgi + 1) % bgs.length; stage.dataset.bg = bgs[bgi]; $("#bg").textContent = "Background: " + (bgs[bgi] === "checker" ? "checkered" : bgs[bgi]); };

/* ---------- actions ---------- */
$("#copy").onclick = async () => {
  const s = S.find((x) => x.id === cur); if (!s) return;
  try {
    let out = s.blob;
    if (out.type !== "image/png") {
      const bmp = await createImageBitmap(out), c = new OffscreenCanvas(bmp.width, bmp.height);
      c.getContext("2d").drawImage(bmp, 0, 0); out = await c.convertToBlob({ type: "image/png" });
    }
    await navigator.clipboard.write([new ClipboardItem({ "image/png": out })]);
    toast("Copied to clipboard");
  } catch (err) { toast("Couldn't copy: " + err.message); }
};

$("#dl").onclick = () => {
  const s = S.find((x) => x.id === cur); if (!s) return;
  const ext = (s.blob.type.split("/")[1] || "png").replace("jpeg", "jpg").replace("svg+xml", "svg");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(s.blob);
  a.download = (s.name.replace(/[\\/:*?"<>|]+/g, "-").replace(/\.\w{2,4}$/, "")) + "." + ext;
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

$("#del").onclick = async () => {
  const s = S.find((x) => x.id === cur); if (!s || !confirm(`Delete "${s.name}"?`)) return;
  await deleteImage(s.id); URL.revokeObjectURL(thumbs[s.id]); delete thumbs[s.id];
  await load(); select(null);
};

$("#clr").onclick = async () => {
  if (!S.length || !confirm(`Delete all ${S.length} saved images? This can't be undone.`)) return;
  await clearImages(); Object.values(thumbs).forEach(URL.revokeObjectURL);
  for (const k in thumbs) delete thumbs[k];
  await load(); select(null);
};

$("#nm").onchange = async (e) => {
  const s = S.find((x) => x.id === cur); if (!s) return;
  s.name = e.target.value.trim() || s.name; e.target.value = s.name;
  await updateImage(s.id, { name: s.name }); draw();
};

$("#open").onclick = () => $("#file").click();
$("#file").onchange = (e) => { const f = e.target.files[0]; if (f) addImage(f, f.name); e.target.value = ""; };

/* ---------- events ---------- */
$("#list").onclick = (e) => { const i = e.target.closest(".item"); if (i) select(i.dataset.id); };
$("#list").onkeydown = (e) => { if (e.key === "Enter") { const i = e.target.closest(".item"); if (i) select(i.dataset.id); } };
$("#q").oninput = (e) => { q = e.target.value.toLowerCase(); draw(); };

document.addEventListener("paste", (e) => {
  const item = [...e.clipboardData.items].find((i) => i.type.startsWith("image/"));
  const blob = item && item.getAsFile();
  if (blob) { e.preventDefault(); addImage(blob); }
  else if (!/INPUT|TEXTAREA/.test(document.activeElement.tagName)) toast("No image on the clipboard");
});
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => {
  e.preventDefault();
  const f = [...e.dataTransfer.files].find((x) => x.type.startsWith("image/"));
  if (f) addImage(f, f.name);
});
document.addEventListener("keydown", (e) => {
  if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (e.key === "/") { e.preventDefault(); $("#q").focus(); }
  else if (e.ctrlKey || e.metaKey || e.altKey || !cur) return;
  else if (e.key === "+" || e.key === "=") zoomAt(1.25);
  else if (e.key === "-") zoomAt(1 / 1.25);
  else if (e.key === "0") fit();
  else if (e.key === "1") $("#act").click();
  else if (e.key === "r") $("#rr").click();
});

(async function init() {
  await load();
  const id = new URLSearchParams(location.search).get("id");
  if (id && S.some((x) => x.id === id)) select(id); else show();
})();
