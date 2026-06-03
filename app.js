(() => {
  const editor = document.getElementById("editor");
  const preview = document.getElementById("preview");
  const stats = document.getElementById("stats");
  const filenameInput = document.getElementById("filename");
  const fileInput = document.getElementById("file-input");
  const exportBtn = document.getElementById("export-btn");
  const clearBtn = document.getElementById("clear-btn");
  const sampleBtn = document.getElementById("sample-btn");
  const downloadMdBtn = document.getElementById("download-md-btn");
  const pdfThemeSelect = document.getElementById("pdf-theme");
  const toast = document.getElementById("toast");
  const fileListEl = document.getElementById("file-list");
  const refreshFilesBtn = document.getElementById("refresh-files-btn");
  const syncScrollBtn = document.getElementById("sync-scroll-btn");
  const filesPane = document.querySelector(".files-pane");

  const STORAGE_KEY = "md-to-pdf:draft";
  const STORAGE_DIR = "storage/";

  // PDF Themes Config
  const PDF_THEMES = {
    slate: {
      name: "Corporate Slate",
      primary: "#1e293b",
      primaryBorder: "#334155",
      accent: "#3b82f6",
      accentBg: "#f8fafc",
      textMain: "#1e293b",
      textMuted: "#475569",
      bgEvenRow: "#f8fafc",
      borderLight: "#e2e8f0"
    },
    navy: {
      name: "Classic Navy",
      primary: "#1e3a8a",
      primaryBorder: "#172554",
      accent: "#2563eb",
      accentBg: "#eff6ff",
      textMain: "#0f172a",
      textMuted: "#334155",
      bgEvenRow: "#f8fafc",
      borderLight: "#dbeafe"
    },
    teal: {
      name: "Modern Teal",
      primary: "#0f766e",
      primaryBorder: "#115e59",
      accent: "#0d9488",
      accentBg: "#f0fdfa",
      textMain: "#0f172a",
      textMuted: "#334155",
      bgEvenRow: "#f0fdfa",
      borderLight: "#ccfbf1"
    },
    minimalist: {
      name: "Minimalist",
      primary: "#000000",
      primaryBorder: "#000000",
      accent: "#000000",
      accentBg: "#fafafa",
      textMain: "#000000",
      textMuted: "#262626",
      bgEvenRow: "#f5f5f5",
      borderLight: "#e5e5e5"
    }
  };

  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true,
    highlight(code, lang) {
      if (window.hljs && lang && hljs.getLanguage(lang)) {
        try { return hljs.highlight(code, { language: lang }).value; } catch (_) {}
      }
      if (window.hljs) {
        try { return hljs.highlightAuto(code).value; } catch (_) {}
      }
      return code;
    },
  });

  function updatePreviewTheme() {
    const themeName = pdfThemeSelect.value || "slate";
    const theme = PDF_THEMES[themeName];
    if (!theme) return;
    
    preview.style.setProperty("--theme-primary", theme.primary);
    preview.style.setProperty("--theme-primary-border", theme.primaryBorder);
    preview.style.setProperty("--theme-accent", theme.accent);
    preview.style.setProperty("--theme-accent-bg", theme.accentBg);
    preview.style.setProperty("--theme-text-main", theme.textMain);
    preview.style.setProperty("--theme-text-muted", theme.textMuted);
    preview.style.setProperty("--theme-bg-even-row", theme.bgEvenRow);
    preview.style.setProperty("--theme-border-light", theme.borderLight);
  }

  function render() {
    const md = editor.value;
    const rawHtml = marked.parse(md);
    const safe = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
    preview.innerHTML = safe;
    updateStats(md);
    updatePreviewTheme();
    persist(md);
  }

  function updateStats(md) {
    const chars = md.length;
    const words = (md.trim().match(/\S+/g) || []).length;
    stats.textContent = `${words} words · ${chars} chars`;
  }

  function persist(md) {
    try { localStorage.setItem(STORAGE_KEY, md); } catch (_) {}
  }

  function restore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) editor.value = saved;
    } catch (_) {}
  }

  function showToast(msg, isError = false) {
    toast.textContent = msg;
    toast.classList.toggle("error", isError);
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function safeFilename(base, ext) {
    const cleaned = (base || "document").trim().replace(/[^a-z0-9_\-]+/gi, "_") || "document";
    return `${cleaned}.${ext}`;
  }

  // Insert markdown at cursor position
  function insertMarkdown(before, after = "") {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    const selected = text.slice(start, end);
    
    const replacement = before + (selected || "") + after;
    editor.value = text.slice(0, start) + replacement + text.slice(end);
    
    // Position cursor
    const offset = before.length + (selected ? selected.length : 0) + after.length;
    editor.selectionStart = editor.selectionEnd = start + offset;
    editor.focus();
    render();
  }

  // Setup toolbar clicks
  document.querySelectorAll(".tool-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      switch (action) {
        case "bold":
          insertMarkdown("**", "**");
          break;
        case "italic":
          insertMarkdown("*", "*");
          break;
        case "heading":
          insertMarkdown("### ");
          break;
        case "link":
          insertMarkdown("[", "](url)");
          break;
        case "code":
          insertMarkdown("```javascript\n", "\n```");
          break;
        case "table":
          insertMarkdown("\n| Module | Purpose | Budget Status |\n| :--- | :--- | :--- |\n| **Module 1: Master HQ** | Centralized Admin Control Platform | Completed |\n| **Module 2: Property PMS** | Hotel Check-in & Housekeeping | In Progress |\n| **Module 3: Direct Guest Booking** | Live Room Inventory Website | Pending |\n");
          break;
        case "quote":
          insertMarkdown("> ");
          break;
        case "list-ul":
          insertMarkdown("- ");
          break;
        case "list-ol":
          insertMarkdown("1. ");
          break;
        case "tree":
          insertMarkdown("\n- 📂 **Parent (Root)**\n  - 📂 **Child (Category 1)**\n    - 📄 *Sub-child (Item A)*\n    - 📄 *Sub-child (Item B)*\n  - 📂 **Child (Category 2)**\n    - 📄 *Sub-child (Item C)*\n");
          break;
        case "page-break":
          insertMarkdown("\n\n<div class=\"page-break\"></div>\n\n");
          break;
      }
    });
  });

  async function exportPdf() {
    if (!editor.value.trim()) {
      showToast("Nothing to export — editor is empty.", true);
      return;
    }

    const fname = safeFilename(filenameInput.value, "pdf");
    exportBtn.disabled = true;
    const original = exportBtn.textContent;
    exportBtn.innerHTML = `
      <svg class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite; margin-right: 6px;"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
      Rendering...
    `;

    // Fetch theme
    const themeName = pdfThemeSelect.value || "slate";
    const theme = PDF_THEMES[themeName];

    // Create printable wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "markdown-body pdf-export-mode";
    
    // Scoped CSS styles dynamically generated based on chosen theme
    wrapper.innerHTML = `
      <style>
        .pdf-export-mode {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
          color: ${theme.textMain} !important;
          line-height: 1.62 !important;
          font-size: 13.5px !important;
        }
        
        .pdf-export-mode h1, 
        .pdf-export-mode h2, 
        .pdf-export-mode h3, 
        .pdf-export-mode h4 {
          font-family: 'Inter', sans-serif !important;
          font-weight: 700 !important;
          color: ${theme.primary} !important;
          page-break-after: avoid !important;
        }

        .pdf-export-mode h1 {
          font-size: 24px !important;
          margin-top: 0 !important;
          margin-bottom: 16px !important;
          border-bottom: 2px solid ${theme.borderLight} !important;
          padding-bottom: 8px !important;
        }
        
        .pdf-export-mode h2 {
          font-size: 18px !important;
          margin-top: 24px !important;
          margin-bottom: 12px !important;
          border-bottom: 1px solid ${theme.borderLight} !important;
          padding-bottom: 6px !important;
        }
        
        .pdf-export-mode h3 {
          font-size: 14.5px !important;
          margin-top: 18px !important;
          margin-bottom: 8px !important;
        }
        
        .pdf-export-mode p {
          margin-top: 0 !important;
          margin-bottom: 12px !important;
          color: ${theme.textMuted} !important;
        }
        
        /* Table Styling */
        .pdf-export-mode table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 20px 0 !important;
          font-size: 12.5px !important;
          page-break-inside: avoid !important;
        }
        
        .pdf-export-mode th {
          background-color: ${theme.primary} !important;
          color: #ffffff !important;
          font-weight: 600 !important;
          text-align: left !important;
          padding: 10px 12px !important;
          border: 1px solid ${theme.primaryBorder} !important;
          text-transform: uppercase !important;
          font-size: 10.5px !important;
          letter-spacing: 0.5px !important;
        }
        
        .pdf-export-mode td {
          padding: 8px 12px !important;
          border: 1px solid ${theme.borderLight} !important;
          color: ${theme.textMuted} !important;
        }
        
        .pdf-export-mode tr:nth-child(even) {
          background-color: ${theme.bgEvenRow} !important;
        }
        
        .pdf-export-mode tr {
          page-break-inside: avoid !important;
        }
        
        /* Blockquote Styling */
        .pdf-export-mode blockquote {
          margin: 16px 0 !important;
          padding: 10px 18px !important;
          background-color: ${theme.accentBg} !important;
          border-left: 4px solid ${theme.accent} !important;
          color: ${theme.textMuted} !important;
          font-style: italic !important;
          border-radius: 0 6px 6px 0 !important;
          page-break-inside: avoid !important;
        }
        
        /* Lists */
        .pdf-export-mode ul, .pdf-export-mode ol {
          margin-top: 0 !important;
          margin-bottom: 14px !important;
          padding-left: 20px !important;
        }
        
        .pdf-export-mode li {
          margin-bottom: 4px !important;
          color: ${theme.textMuted} !important;
        }

        /* Nested List Hierarchy Connection Visualizer inside PDF */
        .pdf-export-mode ul ul {
          position: relative !important;
          padding-left: 20px !important;
          margin-left: 6px !important;
          margin-top: 4px !important;
        }

        .pdf-export-mode ul ul::before {
          content: "" !important;
          position: absolute !important;
          top: 0 !important;
          left: 4px !important;
          bottom: 10px !important;
          width: 1.5px !important;
          background-color: ${theme.borderLight} !important;
        }

        .pdf-export-mode ul ul li {
          position: relative !important;
          list-style-type: none !important;
        }

        .pdf-export-mode ul ul li::before {
          content: "" !important;
          position: absolute !important;
          top: 10px !important;
          left: -16px !important;
          width: 12px !important;
          height: 1.5px !important;
          background-color: ${theme.borderLight} !important;
        }
        
        /* Code Blocks */
        .pdf-export-mode pre {
          background-color: ${theme.accentBg} !important;
          border: 1px solid ${theme.borderLight} !important;
          border-radius: 6px !important;
          padding: 12px 16px !important;
          margin: 16px 0 !important;
          overflow: hidden !important;
          white-space: pre-wrap !important;
          word-break: break-all !important;
          page-break-inside: avoid !important;
        }
        
        .pdf-export-mode code {
          font-family: Menlo, Monaco, Consolas, "Courier New", monospace !important;
          font-size: 11.5px !important;
          background-color: ${theme.accentBg} !important;
          padding: 2px 4px !important;
          border-radius: 4px !important;
          color: ${theme.primary} !important;
        }
        
        .pdf-export-mode pre code {
          background-color: transparent !important;
          padding: 0 !important;
          border-radius: 0 !important;
          color: inherit !important;
        }
        
        .pdf-export-mode hr {
          height: 1px !important;
          background-color: ${theme.borderLight} !important;
          border: none !important;
          margin: 24px 0 !important;
        }

        /* Prevent page breaks inside critical layout blocks */
        .pdf-export-mode p,
        .pdf-export-mode li,
        .pdf-export-mode tr,
        .pdf-export-mode pre,
        .pdf-export-mode blockquote,
        .pdf-export-mode h1,
        .pdf-export-mode h2,
        .pdf-export-mode h3,
        .pdf-export-mode h4 {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .pdf-export-mode h1,
        .pdf-export-mode h2,
        .pdf-export-mode h3,
        .pdf-export-mode h4 {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }

        /* Clean manual page break behavior in PDF */
        .pdf-export-mode .page-break {
          page-break-before: always !important;
          break-before: always !important;
          height: 0 !important;
          margin: 0 !important;
          border: none !important;
          padding: 0 !important;
        }
      </style>
      <div class="content-wrapper">
        ${preview.innerHTML}
      </div>
    `;

    // Inject styles block and support spin keyframe dynamically
    const styleSpin = document.createElement("style");
    styleSpin.innerHTML = "@keyframes spin { 100% { transform: rotate(360deg); } }";
    document.head.appendChild(styleSpin);

    const offscreen = document.createElement("div");
    Object.assign(offscreen.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
    });
    offscreen.appendChild(wrapper);
    document.body.appendChild(offscreen);

    try {
      const opt = {
        margin: [26, 16, 26, 16], // Generous margins (26mm top & bottom)
        filename: fname,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { 
          mode: ["css", "legacy"], 
          avoid: ["thead", "tr", "pre", "blockquote", "h1", "h2", "h3", "h4", "p", "li"] 
        },
      };

      const worker = html2pdf().from(wrapper).set(opt).toPdf().get('pdf');

      await worker.then((pdf) => {
        const totalPages = pdf.internal.getNumberOfPages();
        const docTitle = filenameInput.value.trim() || "Document";
        const primaryColorHex = theme.primary;
        
        // Parse hex primary color to RGB
        const r = parseInt(primaryColorHex.slice(1, 3), 16) || 0;
        const g = parseInt(primaryColorHex.slice(3, 5), 16) || 0;
        const b = parseInt(primaryColorHex.slice(5, 7), 16) || 0;

        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();

          // 1. Running Header (Drawn at y = 15mm, safe spacing of 11mm before A4 printable body at y = 26mm)
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.setTextColor(r, g, b);
          pdf.text(docTitle.toUpperCase(), 16, 12);
          
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(140, 140, 140);
          pdf.text("MARKDOWN → PDF", pageWidth - 16, 12, { align: "right" });

          pdf.setLineWidth(0.15);
          pdf.setDrawColor(r, g, b);
          pdf.line(16, 15, pageWidth - 16, 15);

          // 2. Running Footer (Drawn at y = pageHeight - 15mm, safe spacing of 11mm after printable body at y = pageHeight - 26mm)
          pdf.setDrawColor(220, 220, 220);
          pdf.line(16, pageHeight - 15, pageWidth - 16, pageHeight - 15);

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(7.5);
          pdf.setTextColor(140, 140, 140);
          pdf.text("Generated with Premium Markdown → PDF Converter", 16, pageHeight - 10);
          pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 16, pageHeight - 10, { align: "right" });
        }
      }).save();

      showToast(`Saved ${fname}`);
    } catch (err) {
      console.error(err);
      showToast("PDF export failed. See console.", true);
    } finally {
      document.body.removeChild(offscreen);
      document.head.removeChild(styleSpin);
      exportBtn.disabled = false;
      exportBtn.textContent = original;
    }
  }

  function downloadMd() {
    if (!editor.value.trim()) {
      showToast("Nothing to download — editor is empty.", true);
      return;
    }
    const fname = safeFilename(filenameInput.value, "md");
    const blob = new Blob([editor.value], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Saved ${fname}`);
  }

  function loadFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      editor.value = String(e.target?.result || "");
      const base = file.name.replace(/\.(md|markdown|txt)$/i, "");
      if (base) filenameInput.value = base;
      render();
      showToast(`Loaded ${file.name}`);
    };
    reader.onerror = () => showToast("Could not read file.", true);
    reader.readAsText(file);
  }

  const SAMPLE = `# Hotel Software Ecosystem — Project Quotation

We propose to build a **complete hotel software ecosystem** — a unified three-platform solution that gives you centralized control over your hotel operations, automates daily workflows, and enables a direct guest booking channel.

## Core Modules & Scope

This quotation covers the following core modules:

- **Master HQ Dashboard**: Centralized dashboard to onboard and manage multiple properties.
- **Property PMS (Front Desk)**: Operational core covering check-in, bookings, and housekeeping.
- **Guest Booking Platform**: Fully responsive web channel for direct online bookings.

---

## Investment Summary

Below is a detailed breakdown of the project modules and respective financial investments:

| Module | Description | Investment | Status |
| :--- | :--- | :--- | :--- |
| **Module 1** | MasterHQ & HQ billing | ₹1,28,000 | Planned |
| **Module 2** | Property PMS System | ₹1,72,000 | Active |
| **Module 3** | Guest Booking Platform | ₹1,08,000 | Scheduled |
| **Module 4** | Key Integrations (Razorpay, SMS) | ₹92,000 | Pending |
| | **TOTAL PROJECT INVESTMENT** | **₹5,00,000** | **APPROVED** |

> All three platforms are connected in real-time — bookings, inventory, and rates stay in sync across the ecosystem.

---

## Integration Code Example

The billing engine handles instant booking order creation securely using Laravel Sanctum:

\`\`\`javascript
async function registerBooking(bookingData) {
  // Post transaction and verify inventory status
  const response = await fetch('/api/v1/pms/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  });
  return response.json();
}
\`\`\`

## Key Project Standards

1. **Source Code Ownership**: Full ownership transferred upon final milestone payment.
2. **Post-Launch Warranty**: Includes a comprehensive 60-day bug warranty.
3. **Execution Time**: The anticipated execution path spans 30 calendar weeks.
`;

  // ---- Storage folder file browser ----
  const FILE_ICON =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  const TRASH_ICON =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

  let activeFileName = null;

  // Discover markdown files in the storage folder. Works on any static server:
  // first try parsing a directory listing, then fall back to storage/manifest.json.
  async function fetchStorageFileNames() {
    const isMd = (n) => /\.(md|markdown)$/i.test(n);

    // 1) Directory listing (Live Server, python http.server, nginx autoindex, ...)
    try {
      const res = await fetch(STORAGE_DIR, { headers: { Accept: "text/html" } });
      if (res.ok) {
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const names = [...doc.querySelectorAll("a[href]")]
          .map((a) => decodeURIComponent(a.getAttribute("href") || ""))
          .map((href) => href.split("/").pop().split("?")[0])
          .filter(isMd);
        const unique = [...new Set(names)];
        if (unique.length) return unique.sort((a, b) => a.localeCompare(b));
      }
    } catch (_) {}

    // 2) Fallback: explicit manifest file
    try {
      const res = await fetch(STORAGE_DIR + "manifest.json", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.files || [];
        const names = list
          .map((item) => (typeof item === "string" ? item : item && item.name))
          .filter((n) => typeof n === "string" && isMd(n));
        return [...new Set(names)].sort((a, b) => a.localeCompare(b));
      }
    } catch (_) {}

    return [];
  }

  async function loadStorageFile(name) {
    try {
      const res = await fetch(STORAGE_DIR + encodeURIComponent(name), { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      editor.value = text;
      const base = name.replace(/\.(md|markdown)$/i, "");
      if (base) filenameInput.value = base;
      activeFileName = name;
      render();
      highlightActiveFile();
      showToast(`Loaded ${name}`);
    } catch (err) {
      console.error(err);
      showToast(`Could not open ${name}.`, true);
    }
  }

  async function deleteStorageFile(name) {
    if (!confirm(`Delete "${name}" from storage? This cannot be undone.`)) return;
    try {
      const res = await fetch("api/delete?name=" + encodeURIComponent(name), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (activeFileName === name) activeFileName = null;
      await refreshFileList();
      showToast(`Deleted ${name}`);
    } catch (err) {
      console.error(err);
      showToast("Delete needs server.py running.", true);
    }
  }

  function highlightActiveFile() {
    fileListEl.querySelectorAll(".file-item").forEach((li) => {
      li.classList.toggle("active", li.dataset.name === activeFileName);
    });
  }

  function renderFileList(names) {
    fileListEl.innerHTML = "";
    if (!names.length) {
      const li = document.createElement("li");
      li.className = "file-list-empty";
      if (location.protocol === "file:") {
        li.innerHTML =
          "Opened as a <b>file://</b> page, so the browser blocks reading the folder.<br><br>" +
          "Run a server in this folder:<br><code>python3 -m http.server 8000</code><br><br>" +
          "then open <b>http://localhost:8000/</b>";
      } else {
        li.textContent =
          "No markdown files found in /storage. Add .md files (or run the refresh button).";
      }
      fileListEl.appendChild(li);
      return;
    }
    names.forEach((name) => {
      const li = document.createElement("li");
      li.className = "file-item";
      li.dataset.name = name;
      li.title = name;
      li.innerHTML =
        `${FILE_ICON}<span class="file-name">${name}</span>` +
        `<button class="file-delete" type="button" title="Delete ${name}">${TRASH_ICON}</button>`;
      li.addEventListener("click", () => loadStorageFile(name));
      li.querySelector(".file-delete").addEventListener("click", (e) => {
        e.stopPropagation(); // don't trigger the row's load handler
        deleteStorageFile(name);
      });
      fileListEl.appendChild(li);
    });
    highlightActiveFile();
  }

  async function refreshFileList() {
    fileListEl.innerHTML = '<li class="file-list-empty">Loading…</li>';
    const names = await fetchStorageFileNames();
    renderFileList(names);
  }

  refreshFilesBtn.addEventListener("click", refreshFileList);

  // ---- Drag & drop upload into the storage folder ----
  function readFileText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(String(e.target?.result || ""));
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsText(file);
    });
  }

  async function uploadToStorage(file) {
    if (!/\.(md|markdown)$/i.test(file.name)) {
      showToast(`${file.name}: only .md files can be uploaded.`, true);
      return;
    }
    const text = await readFileText(file);
    try {
      const res = await fetch("api/upload?name=" + encodeURIComponent(file.name), {
        method: "POST",
        headers: { "Content-Type": "text/markdown" },
        body: text,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refreshFileList();
      await loadStorageFile(file.name);
      showToast(`Uploaded ${file.name}`);
    } catch (err) {
      // No upload backend (plain http.server) — fall back to loading in-editor.
      console.error(err);
      editor.value = text;
      const base = file.name.replace(/\.(md|markdown)$/i, "");
      if (base) filenameInput.value = base;
      render();
      showToast("Upload needs server.py — opened in editor instead.", true);
    }
  }

  async function handleDroppedFiles(fileList) {
    const files = [...fileList].filter((f) => /\.(md|markdown)$/i.test(f.name));
    if (!files.length) {
      showToast("Drop .md or .markdown files to upload.", true);
      return;
    }
    for (const f of files) {
      await uploadToStorage(f);
    }
  }

  ["dragenter", "dragover"].forEach((evt) => {
    filesPane.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      filesPane.classList.add("drag-over");
    });
  });

  ["dragleave", "dragend"].forEach((evt) => {
    filesPane.addEventListener(evt, (e) => {
      // Ignore leave events bubbling up from children still inside the pane.
      if (evt === "dragleave" && filesPane.contains(e.relatedTarget)) return;
      filesPane.classList.remove("drag-over");
    });
  });

  filesPane.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation(); // don't let the global drop handler also load it
    filesPane.classList.remove("drag-over");
    const files = e.dataTransfer?.files;
    if (files && files.length) handleDroppedFiles(files);
  });

  // ---- Synchronized scrolling between editor and preview ----
  // Scroll proportionally (they have different heights). A lock flag prevents
  // the programmatic scroll on one side from re-triggering the other's handler.
  const SYNC_KEY = "md-to-pdf:sync-scroll";
  let syncingScroll = false;
  let syncScrollOn = true;

  function setSyncScroll(on) {
    syncScrollOn = on;
    syncScrollBtn.classList.toggle("is-on", on);
    syncScrollBtn.setAttribute("aria-checked", String(on));
    try { localStorage.setItem(SYNC_KEY, on ? "1" : "0"); } catch (_) {}
  }

  try {
    if (localStorage.getItem(SYNC_KEY) === "0") setSyncScroll(false);
  } catch (_) {}

  syncScrollBtn.addEventListener("click", () => {
    setSyncScroll(!syncScrollOn);
    showToast(syncScrollOn ? "Scroll sync on" : "Scroll sync off");
  });

  function syncScroll(source, target) {
    if (!syncScrollOn || syncingScroll) return;
    const srcScrollable = source.scrollHeight - source.clientHeight;
    if (srcScrollable <= 0) return;
    const ratio = source.scrollTop / srcScrollable;
    const tgtScrollable = target.scrollHeight - target.clientHeight;
    syncingScroll = true;
    target.scrollTop = ratio * tgtScrollable;
    // Release the lock after the resulting scroll event has fired.
    requestAnimationFrame(() => { syncingScroll = false; });
  }

  editor.addEventListener("scroll", () => syncScroll(editor, preview));
  preview.addEventListener("scroll", () => syncScroll(preview, editor));

  editor.addEventListener("input", render);

  fileInput.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (f) loadFile(f);
    fileInput.value = "";
  });

  exportBtn.addEventListener("click", exportPdf);
  downloadMdBtn.addEventListener("click", downloadMd);
  pdfThemeSelect.addEventListener("change", updatePreviewTheme);

  clearBtn.addEventListener("click", () => {
    if (!editor.value || confirm("Clear the editor?")) {
      editor.value = "";
      render();
    }
  });

  sampleBtn.addEventListener("click", () => {
    editor.value = SAMPLE;
    render();
  });

  window.addEventListener("dragover", (e) => { e.preventDefault(); });
  window.addEventListener("drop", (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) loadFile(f);
  });

  editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.slice(0, start) + "  " + editor.value.slice(end);
      editor.selectionStart = editor.selectionEnd = start + 2;
      render();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      exportPdf();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      insertMarkdown("**", "**");
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      insertMarkdown("*", "*");
    }
  });

  restore();
  if (!editor.value) editor.value = SAMPLE;
  render();
  refreshFileList();
})();
