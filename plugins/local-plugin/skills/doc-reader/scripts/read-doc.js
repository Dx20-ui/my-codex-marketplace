#!/usr/bin/env node
/**
 * doc-reader — Convert .doc / .docx files to plain text
 *
 * Usage: node read-doc.js <file-path>
 * Output: plain text (UTF-8) to stdout
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node read-doc.js <file-path>');
  process.exit(1);
}

const ext = path.extname(filePath).toLowerCase();

// ── .docx (Office Open XML / WPS) ────────────────────────────
if (ext === '.docx') {
  const AdmZip = require('adm-zip');

  let zip;
  try {
    zip = new AdmZip(filePath);
  } catch (e) {
    console.error('Failed to open .docx as zip:', e.message);
    process.exit(1);
  }

  const docXml = zip.readAsText('word/document.xml');
  if (!docXml) {
    console.error('word/document.xml not found in archive');
    process.exit(1);
  }

  // Strip XML tags and decode entities
  const text = docXml
    .replace(/<w:p[ >]/g, '\n')          // paragraph start → newline
    .replace(/<w:br[^>]*\/>/g, '\n')     // line break
    .replace(/<w:tab\/>/g, '\t')          // tab
    .replace(/<[^>]+>/g, '')              // remove all remaining tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\n{3,}/g, '\n\n')           // collapse 3+ newlines → 2
    .replace(/ +/g, ' ')                  // collapse multiple spaces
    .replace(/^\s+|\s+$/gm, '')           // trim each line
    .replace(/\n +/g, '\n')               // leading space after newline
    .trim();

  console.log(text);
  process.exit(0);
}

// ── .doc (legacy binary) — use antiword ───────────────────────
if (ext === '.doc') {
  try {
    const result = execSync(
      `antiword -m UTF-8.txt "${filePath}"`,
      { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, timeout: 30000 }
    );
    console.log(result.trim());
  } catch (e) {
    // antiword often writes to stderr on partial success; try stderr
    if (e.stderr && e.stderr.length > 0) {
      console.log(e.stderr.trim());
    } else {
      console.error('antiword failed:', e.message);
      process.exit(1);
    }
  }
  process.exit(0);
}

console.error(`Unsupported file type: ${ext}`);
process.exit(1);
