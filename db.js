// Shared by the popup and the viewer tab (same extension origin = same IndexedDB)
const DB_NAME = "paste-image-viewer";
const STORE = "images";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const run = (mode, fn) => openDb().then((db) => new Promise((resolve, reject) => {
  const tx = db.transaction(STORE, mode);
  const out = fn(tx.objectStore(STORE));
  tx.oncomplete = () => resolve(out && "result" in out ? out.result : undefined);
  tx.onerror = () => reject(tx.error);
}));

async function dims(blob) {
  try {
    const bmp = await createImageBitmap(blob);
    const d = { w: bmp.width, h: bmp.height };
    bmp.close && bmp.close();
    return d;
  } catch { return { w: 0, h: 0 }; }
}

async function saveImage(id, blob, name) {
  const { w, h } = await dims(blob);
  return run("readwrite", (s) => s.put({ blob, name, created: Date.now(), w, h }, id));
}

const loadImage = (id) => run("readonly", (s) => s.get(id));
const deleteImage = (id) => run("readwrite", (s) => s.delete(id));
const clearImages = () => run("readwrite", (s) => s.clear());

async function updateImage(id, patch) {
  const rec = await loadImage(id);
  if (rec) await run("readwrite", (s) => s.put({ ...rec, ...patch }, id));
}

function listImages() {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const items = [];
    const req = db.transaction(STORE).objectStore(STORE).openCursor();
    req.onsuccess = () => {
      const c = req.result;
      if (c) { items.push({ id: c.key, ...c.value }); c.continue(); }
      else resolve(items.sort((a, b) => (b.created || 0) - (a.created || 0)));
    };
    req.onerror = () => reject(req.error);
  }));
}
