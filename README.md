# Markdown → PDF

A premium, browser-based Markdown editor that previews your content live and exports it as a beautifully styled PDF. Write or paste Markdown on the left, watch the rendered preview on the right, pick a theme, and export — no build step, no accounts, no cloud.

A lightweight Python static server is included so you can also save, list, and delete `.md` files in a local `storage/` folder.

---

## Features

- **Live preview** — Markdown is rendered as you type (GitHub-flavored styling).
- **One-click PDF export** — high-quality PDF output via `html2pdf.js`, with a custom filename.
- **Theme presets** — Corporate Slate, Classic Navy, Modern Teal, and Minimalist.
- **Formatting toolbar** — bold, italic, headings, links, code blocks, tables, blockquotes, lists, and a page-break inserter.
- **Diagrams & code** — [Mermaid](https://mermaid.js.org/) flowchart/tree diagrams and syntax highlighting via `highlight.js`.
- **Hierarchy / tree templates** — quick inserts for nested outlines and Mermaid trees.
- **Synced scrolling** — editor and preview scroll together (toggleable).
- **Open & download `.md`** — load a Markdown file from disk or download your current document.
- **Storage panel** — browse `.md` files saved in `storage/`, click to load, drag-and-drop to upload, and delete (requires the Python server).
- **Auto-save draft** — your in-progress document is persisted to `localStorage`.
- **Live word/character count**.

---

## Tech Stack & Dependencies

This is a **zero-install front end** — everything runs in the browser. Third-party libraries are loaded from a CDN (no `npm install` required):

| Library | Purpose |
| :--- | :--- |
| [marked](https://github.com/markedjs/marked) | Markdown → HTML parsing |
| [DOMPurify](https://github.com/cure53/DOMPurify) | Sanitizes rendered HTML |
| [highlight.js](https://highlightjs.org/) | Code syntax highlighting |
| [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) | HTML → PDF export |
| [Mermaid](https://mermaid.js.org/) | Diagram / flowchart rendering |
| [github-markdown-css](https://github.com/sindresorhus/github-markdown-css) | GitHub-style preview |
| Google Fonts (Inter, JetBrains Mono) | Typography |

**Optional server:** [`server.py`](server.py) — a static file server with markdown upload/delete support. Requires only **Python 3** (standard library only, no pip packages). An internet connection is needed for the CDN assets above.

### Project structure

```
MarkdownToPDF/
├── index.html      # App layout & CDN script tags
├── styles.css      # UI styling and theme variables
├── app.js          # Editor, preview, PDF export, storage logic
├── server.py       # Optional Python static server (+ upload/delete API)
├── storage/        # Saved .md files (served by the Python server)
└── README.md
```

---

## How to Run

### Option A — Just open the file

Open [`index.html`](index.html) directly in any modern browser. Editing, live preview, themes, and **PDF export** all work offline-of-the-server (CDN assets still need internet).

> Note: the **Storage Files** panel (saving/listing/deleting `.md` files in `storage/`) needs the Python server below.

### Option B — Run the local server (recommended)

This enables the storage panel and drag-and-drop uploads.

```bash
# from the project root
python3 server.py            # serves on http://localhost:8000
python3 server.py 9000       # or pick a custom port
```

Then open <http://localhost:8000/> in your browser.

---

## Usage

1. **Write or paste** Markdown into the editor pane.
2. Use the **toolbar** for quick formatting, tables, code blocks, page breaks, and Mermaid diagrams.
3. Pick a **Theme** and set a **Filename** in the preview pane controls.
4. Click **Export PDF** to download the styled PDF.
5. Click **Download .md** to save the raw Markdown, or **Open .md** to load a file.
6. (Server mode) Drag `.md` files onto the **Storage Files** panel to upload them, click a file to load it, or use the trash icon to delete.

---

## Server API

When running `server.py`, two endpoints back the storage panel (all files are confined to `storage/`):

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/upload?name=<file.md>` | Save raw Markdown (request body) to `storage/`. Max 5 MB; `.md`/`.markdown` only. |
| `DELETE` | `/api/delete?name=<file.md>` | Delete a file from `storage/`. |

All other paths are served as static files from the project root.

---

## Browser Support

Any current version of Chrome, Edge, Firefox, or Safari. PDF export quality is best in Chromium-based browsers.
