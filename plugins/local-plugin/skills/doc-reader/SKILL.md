---
name: doc-reader
description: Read .doc and .docx files and return plain text content. Use whenever the user asks to read, view, inspect, or extract text from a Word document (.doc / .docx), or mentions such a file by path. Also use when a file has a .doc or .docx extension and you need to understand its contents — the Read tool cannot handle these binary formats, so always route .doc/.docx read requests through this skill.
---

# doc-reader — Word Document Text Extractor

## Purpose

Extract plain text from Microsoft Word `.doc` and `.docx` files, including WPS Office documents. The `Read` tool cannot handle these binary/zip-based formats, so this skill bridges the gap.

## When to use

- User mentions a `.doc` or `.docx` file and wants to see its contents
- You need to read a Word document referenced in code or conversation
- The file path ends with `.doc` or `.docx`

## How it works

| Format | Engine | Notes |
|--------|--------|-------|
| `.docx` | Node.js + `adm-zip` | Parses `word/document.xml` inside the ZIP archive. Handles WPS Office `.docx` files. |
| `.doc` | `antiword` (system tool) | Legacy binary format. Uses UTF-8 mapping file `UTF-8.txt` for best Chinese character support. |

## Usage

```bash
node <skill-dir>/scripts/read-doc.js "<absolute-path-to-file>"
```

The script outputs plain UTF-8 text to stdout. Always use an **absolute path** to the file.

## Important notes

- The script only extracts **text content**. It does not preserve formatting, images, tables, or embedded objects.
- Chinese text in `.doc` files may render as `?` if the system lacks the required character mapping — `-m UTF-8.txt` mitigates this but cannot fix all encoding issues in old binary `.doc` files.
- For `.docx` files created by WPS Office, the XML structure is compatible and text extraction works reliably.

## After extraction

Once you have the text content, present it to the user in a readable format. If the output is garbled (lots of `?`), tell the user the file's encoding may be problematic and suggest they re-save as `.docx` from their word processor.