#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const OUTPUT_FILE = path.join(DOCS_DIR, 'index.html');

const RACE_DATE = new Date('2027-03-27T00:00:00');
const RACE_NAME = 'Charlottesville Ten Miler';

// --- File reading (graceful) ---

function readFileOrNull(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// --- Basic Markdown to HTML ---

function markdownToHtml(md) {
  if (!md) return '<p class="placeholder">No training plan loaded yet.</p>';

  const lines = md.split('\n');
  const htmlLines = [];
  let inList = false;
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Close list if we leave a bullet context
    if (inList && !trimmed.startsWith('- ') && !trimmed.startsWith('* ')) {
      htmlLines.push('</ul>');
      inList = false;
    }

    // Table handling
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // Skip separator rows (|---|---|)
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) continue;
      const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
      if (!inTable) {
        htmlLines.push('<table><thead><tr>');
        htmlLines.push(cells.map(c => `<th>${applyInline(c)}</th>`).join(''));
        htmlLines.push('</tr></thead><tbody>');
        inTable = true;
      } else {
        htmlLines.push('<tr>' + cells.map(c => `<td>${applyInline(c)}</td>`).join('') + '</tr>');
      }
      continue;
    } else if (inTable) {
      htmlLines.push('</tbody></table>');
      inTable = false;
    }

    if (trimmed === '') {
      htmlLines.push('');
      continue;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      htmlLines.push(`<h3>${applyInline(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith('## ')) {
      htmlLines.push(`<h2>${applyInline(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith('# ')) {
      htmlLines.push(`<h2 class="plan-title">${applyInline(trimmed.slice(2))}</h2>`);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        htmlLines.push('<ul>');
        inList = true;
      }
      htmlLines.push(`<li>${applyInline(trimmed.slice(2))}</li>`);
    } else {
      htmlLines.push(`<p>${applyInline(trimmed)}</p>`);
    }
  }

  if (inList) htmlLines.push('</ul>');
  if (inTable) htmlLines.push('</tbody></table>');

  return htmlLines.join('\n');
}

function applyInline(text) {
  // Bold: **text** or __text__
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
  // Italic: *text* or _text_
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/_(.+?)_/g, '<em>$1</em>');
  // Inline code
  text = text.replace(/`(.+?)`/g, '<code>$1</code>');
  return text;
}

// --- Countdown computation ---

function computeCountdown() {
  const now = new Date();
  const diffMs = RACE_DATE - now;
  if (diffMs <= 0) return { days: 0, label: 'Race day has passed!' };
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return { days, label: `${days} days until race day` };
}

// --- HTML generation ---

function generateHtml(planMarkdown, trainingCsv) {
  const countdown = computeCountdown();
  const planHtml = markdownToHtml(planMarkdown);
  const buildDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${RACE_NAME} - Training Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=VT323&family=Press+Start+2P&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-deep: #1a1a2e;
      --bg-mid: #16213e;
      --pink: #ff2e97;
      --cyan: #00fff5;
      --orange: #ff9f1c;
      --yellow: #ffed4a;
      --text: #e0e0e0;
      --text-dim: #8888aa;
      --grid-color: rgba(0, 255, 245, 0.06);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background-color: var(--bg-deep);
      color: var(--text);
      font-family: 'Courier New', 'Consolas', monospace;
      font-size: 16px;
      line-height: 1.6;
      min-height: 100vh;
      position: relative;
      overflow-x: hidden;
    }

    /* Grid overlay */
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image:
        linear-gradient(var(--grid-color) 1px, transparent 1px),
        linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
      z-index: 0;
    }

    /* Sunset / city skyline bands at bottom */
    body::after {
      content: '';
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 220px;
      background:
        linear-gradient(0deg,
          #0d0d1a 0%,
          #1a1a2e 10%,
          transparent 10%,
          transparent 12%,
          #2d1b4e 12%,
          #2d1b4e 14%,
          transparent 14%,
          transparent 20%,
          rgba(255, 46, 151, 0.08) 20%,
          rgba(255, 46, 151, 0.04) 35%,
          transparent 50%
        ),
        linear-gradient(0deg,
          #0d0d1a 0%,
          #0d0d1a 8%,
          transparent 8%
        ),
        /* Skyline silhouette suggestion */
        linear-gradient(90deg,
          transparent 0%,
          transparent 5%,
          #0d0d1a 5%,
          #0d0d1a 7%,
          transparent 7%,
          transparent 12%,
          #0d0d1a 12%,
          #0d0d1a 13%,
          transparent 13%,
          transparent 20%,
          #0d0d1a 20%,
          #0d0d1a 24%,
          transparent 24%,
          transparent 30%,
          #0d0d1a 30%,
          #0d0d1a 31%,
          transparent 31%,
          transparent 45%,
          #0d0d1a 45%,
          #0d0d1a 48%,
          transparent 48%,
          transparent 55%,
          #0d0d1a 55%,
          #0d0d1a 57%,
          transparent 57%,
          transparent 65%,
          #0d0d1a 65%,
          #0d0d1a 69%,
          transparent 69%,
          transparent 78%,
          #0d0d1a 78%,
          #0d0d1a 80%,
          transparent 80%,
          transparent 88%,
          #0d0d1a 88%,
          #0d0d1a 91%,
          transparent 91%
        );
      background-size: 100% 100%, 100% 100%, 100% 60px;
      background-repeat: no-repeat, no-repeat, repeat-y;
      background-position: bottom, bottom, bottom;
      pointer-events: none;
      z-index: 0;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1.5rem 14rem;
      position: relative;
      z-index: 1;
    }

    /* Header */
    header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid var(--pink);
    }

    h1 {
      font-family: 'Press Start 2P', monospace;
      font-size: 1.2rem;
      color: var(--cyan);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 0.5rem;
      text-shadow: 0 0 10px rgba(0, 255, 245, 0.5);
    }

    .subtitle {
      font-family: 'VT323', monospace;
      font-size: 1.8rem;
      color: var(--pink);
      text-shadow: 0 0 8px rgba(255, 46, 151, 0.4);
    }

    /* Countdown */
    .countdown {
      text-align: center;
      margin: 2.5rem 0;
      padding: 2rem;
      border: 1px solid var(--cyan);
      background: rgba(0, 255, 245, 0.03);
    }

    .countdown .number {
      font-family: 'VT323', monospace;
      font-size: 5rem;
      color: var(--orange);
      text-shadow: 0 0 20px rgba(255, 159, 28, 0.6);
      line-height: 1;
    }

    .countdown .label {
      font-family: 'VT323', monospace;
      font-size: 1.5rem;
      color: var(--yellow);
      margin-top: 0.5rem;
    }

    .countdown .race-date {
      font-size: 0.9rem;
      color: var(--text-dim);
      margin-top: 0.5rem;
    }

    /* Sections */
    section {
      margin: 2.5rem 0;
    }

    section > h2:first-child,
    .section-header {
      font-family: 'Press Start 2P', monospace;
      font-size: 0.75rem;
      color: var(--pink);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255, 46, 151, 0.3);
    }

    /* Plan content */
    .plan-content h2 {
      font-family: 'VT323', monospace;
      font-size: 1.8rem;
      color: var(--cyan);
      margin: 1.5rem 0 0.75rem;
    }

    .plan-content h2.plan-title {
      font-size: 2rem;
      color: var(--orange);
      text-shadow: 0 0 6px rgba(255, 159, 28, 0.3);
    }

    .plan-content h3 {
      font-family: 'VT323', monospace;
      font-size: 1.4rem;
      color: var(--yellow);
      margin: 1.2rem 0 0.5rem;
    }

    .plan-content p {
      margin: 0.5rem 0;
    }

    .plan-content ul {
      list-style: none;
      padding-left: 1.5rem;
      margin: 0.5rem 0;
    }

    .plan-content li {
      position: relative;
      margin: 0.4rem 0;
      padding-left: 0.5rem;
    }

    .plan-content li::before {
      content: '>';
      position: absolute;
      left: -1rem;
      color: var(--pink);
      font-weight: bold;
    }

    .plan-content strong {
      color: var(--cyan);
    }

    .plan-content em {
      color: var(--yellow);
      font-style: normal;
    }

    .plan-content code {
      background: rgba(0, 255, 245, 0.1);
      padding: 0.1em 0.4em;
      border-radius: 2px;
      font-size: 0.95em;
    }

    .plan-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: 0.9rem;
    }

    .plan-content th {
      color: var(--pink);
      text-align: left;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--pink);
    }

    .plan-content td {
      padding: 0.4rem 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .plan-content tr:hover td {
      background: rgba(0, 255, 245, 0.03);
    }

    .placeholder {
      color: var(--text-dim);
      font-style: italic;
      padding: 1rem;
      border: 1px dashed var(--text-dim);
      text-align: center;
    }

    /* Data section */
    .data-section .placeholder {
      border-color: var(--orange);
      color: var(--orange);
    }

    /* Footer */
    footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 46, 151, 0.2);
      text-align: center;
      font-size: 0.8rem;
      color: var(--text-dim);
    }

    footer span {
      color: var(--pink);
    }

    /* Responsive */
    @media (max-width: 600px) {
      h1 { font-size: 0.9rem; }
      .subtitle { font-size: 1.4rem; }
      .countdown .number { font-size: 3.5rem; }
      .section-header { font-size: 0.65rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Training Dashboard</h1>
      <div class="subtitle">${RACE_NAME}</div>
    </header>

    <div class="countdown">
      <div class="number">${countdown.days}</div>
      <div class="label">${countdown.label}</div>
      <div class="race-date">March 27, 2027 &mdash; Charlottesville, VA</div>
    </div>

    <section>
      <h2 class="section-header">Current Training Plan</h2>
      <div class="plan-content">
        ${planHtml}
      </div>
    </section>

    <section class="data-section">
      <h2 class="section-header">Training Data</h2>
      <p class="placeholder">Coming soon &mdash; training log visualization</p>
    </section>

    <footer>
      <p>Built <span>${buildDate}</span> // no js, no deps, just vibes</p>
    </footer>
  </div>
</body>
</html>`;
}

// --- Main ---

function main() {
  // Ensure docs/ exists
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  // Read source files
  const planMarkdown = readFileOrNull(path.join(ROOT, 'current-plan.md'));
  const trainingCsv = readFileOrNull(path.join(ROOT, 'training-log.csv'));

  // Generate and write
  const html = generateHtml(planMarkdown, trainingCsv);
  fs.writeFileSync(OUTPUT_FILE, html, 'utf-8');

  console.log(`Built ${OUTPUT_FILE}`);
  console.log(`  Race: ${RACE_NAME} - March 27, 2027`);
  console.log(`  Countdown: ${computeCountdown().days} days`);
  console.log(`  Plan loaded: ${planMarkdown ? 'yes' : 'no (placeholder shown)'}`);
  console.log(`  Training log: ${trainingCsv ? 'yes' : 'no (not yet created)'}`);
}

main();
