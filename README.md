# Paste Image Viewer

Paste an image from your clipboard, view it full size in a tab, and keep it in a searchable library. Paste Image Viewer lets you zoom, pan, rotate, and flip images, then copy or download them again. Everything is stored locally in your browser.

Built as a Manifest V3 Chrome extension with no dependencies and no build step.

## Features

- **Paste to view**: click the toolbar icon, press `Ctrl+V` (`Cmd+V` on Mac), and the image opens in a full tab.
- **Drag and drop**: drop an image file onto the popup or the viewer, or use **Open file** to pick one.
- **Image library**: every image you paste is kept, newest first, with a thumbnail, dimensions, file size, and age. Click any image to view it again.
- **Zoom and pan**: scroll to zoom toward the cursor, drag to pan, and double-click to fit the image to the window. Zoom ranges from 5% to 3200%.
- **Rotate and flip**: turn the image left or right, or flip it horizontally.
- **Background switcher**: cycle the viewing background between default, light, dark, and checkered, which is handy for transparent PNGs.
- **Copy and download**: copy the image back to your clipboard (non-PNG images are converted to PNG), or download it with its original format.
- **Search**: filter the library by name. Press `/` to jump to search.
- **Organise**: rename images, delete one, or clear the whole library.
- **Themes**: follows your system light or dark setting.

## Installation

Paste Image Viewer isn't on the Chrome Web Store, so load it as an unpacked extension:

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome (or any Chromium browser such as Edge, Brave, or Opera).
3. Turn on **Developer mode** in the top right.
4. Click **Load unpacked** and select the `Image-Paste-Viewer` folder (the one containing `manifest.json`).
5. Pin the Paste Image Viewer icon to your toolbar for quick access.

## Usage

### Popup

Click the toolbar icon to:

- **Paste** an image with `Ctrl+V` (`Cmd+V` on Mac), or drop an image file onto the dashed box. The viewer opens in a new tab.
- **Open viewer** to browse your whole library
- Click any of your five most recent images to view it

### Viewer

Browse images in the sidebar and select one to view it. You can also paste or drop images straight into the viewer at any time.

Above the image you can rename it (edit the name and press `Enter` or click away), copy it, download it, or delete it. The toolbar below that controls zoom, fit, rotation, flip, and background.

### Mouse and keyboard shortcuts

| Action | How |
| --- | --- |
| Zoom in or out | Scroll wheel, the `+` / `−` buttons, or `+` / `-` keys |
| Pan | Click and drag the image |
| Fit to window | Double-click the image, the **Fit** button, or `0` |
| Actual size (100%) | The **100%** button or `1` |
| Rotate right | `r` |
| Focus search | `/` |
| Paste an image | `Ctrl+V` or `Cmd+V` |

## Privacy

- **Your data stays on your machine.** Images are kept in your browser's IndexedDB. Nothing is uploaded, and there is no account, analytics, or telemetry.
- **No network requests.** The extension makes none.
- **Only images are read from the clipboard.** If the clipboard has no image, nothing is saved.

Images are not encrypted. Anyone with access to your browser profile can read them, so avoid pasting anything sensitive on a shared computer, and use **Delete** or **Clear all** when you're done.

## Permissions

| Permission | Why it's needed |
| --- | --- |
| `unlimitedStorage` | Store full-size images locally without hitting the default quota |

## Project structure

```
Image-Paste-Viewer/
├── manifest.json     # Extension manifest (MV3)
├── db.js             # Shared IndexedDB helpers: save, load, list, update, delete
├── popup.html / .js  # Toolbar popup: paste, drop, and recent images
├── viewer.html / .js # Full viewer tab: library, zoom, pan, rotate, copy, download
├── style.css         # Shared styles
├── icons/            # Extension icons
└── LICENSE
```

## Data format

Images are stored in an IndexedDB database named `paste-image-viewer`, in an object store called `images`. Each record is keyed by a random UUID and looks like this:

```json
{
  "blob": "<Blob>",
  "name": "Pasted image 7 Oct 2026, 20:44",
  "created": 1791405840000,
  "w": 1920,
  "h": 1080
}
```

`blob` is the original image data, exactly as it was pasted or dropped. `w` and `h` are `0` if the browser couldn't read the dimensions. A specific image can be opened directly with `viewer.html?id=<id>`.

## Limitations

- Chromium browsers only. The styles use the CSS `light-dark()` function, which needs a recent version of Chrome (123 or later).
- Rotate and flip only change how the image is displayed. They are not saved, and **Copy** and **Download** always give you the original image.
- Search matches image names only.
- Pasting several images at once saves only the first one.
- Images are stored in your browser profile, so clearing site data for the extension or removing the extension deletes your library. There is no export or backup.

## License

CC0-1.0 license
