const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const say = (t) => ($("#msg").textContent = t);
const ago = (t) => { const m = (Date.now() - t) / 6e4; return m < 1 ? "just now" : m < 60 ? ~~m + "m ago" : m < 1440 ? ~~(m / 60) + "h ago" : ~~(m / 1440) + "d ago"; };
const openTab = (id) => { chrome.tabs.create({ url: chrome.runtime.getURL("viewer.html" + (id ? "?id=" + id : "")) }); close(); };

async function addImage(blob, name) {
  const id = crypto.randomUUID();
  try {
    await saveImage(id, blob, name || "Pasted image " + new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" }));
    openTab(id);
  } catch (err) { say("Couldn't open the viewer: " + err.message); }
}

async function recent() {
  const list = (await listImages()).slice(0, 5);
  $("#r").innerHTML = list.map((x) => `<div class="item" data-id="${x.id}">
    <img class="th" alt="" src="${URL.createObjectURL(x.blob)}">
    <div><b>${esc(x.name)}</b><small>${x.w ? x.w + " × " + x.h + ", " : ""}${ago(x.created)}, click to view</small></div></div>`).join("");
}

document.addEventListener("paste", (e) => {
  e.preventDefault();
  const item = [...e.clipboardData.items].find((i) => i.type.startsWith("image/"));
  const blob = item && item.getAsFile();
  if (blob) addImage(blob);
  else say("No image on the clipboard. Copy an image first, then paste.");
});

const drop = $("#drop");
drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", (e) => {
  e.preventDefault(); drop.classList.remove("over");
  const f = [...e.dataTransfer.files].find((x) => x.type.startsWith("image/"));
  if (f) addImage(f, f.name);
});

$("#mg").onclick = () => openTab();
$("#r").onclick = (e) => { const i = e.target.closest(".item"); if (i) openTab(i.dataset.id); };

drop.focus();
recent();
