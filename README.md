# APUSH Lectern

Point your phone's camera at a reading, drag a box around the part you want, and hear it out loud.

**Live:** https://landen-finkel-engineering.github.io/apush-lectern/

## What it does

- **Live camera viewfinder** — opens straight to it, remembers that you allowed it, and goes right back next time
- **Drag a box** around one paragraph so it reads that and not the whole page
- **Reads on-device** with Tesseract OCR — free, no account, works offline after the first load
- **Teacher mode** (optional) — with an Anthropic API key, the crop goes to Claude, which transcribes it *and* rewrites it the way an APUSH teacher would say it out loud, plus a list of key terms
- **Follow along** — the sentence being read is highlighted; tap any sentence to jump there
- **Speed and voice** picker, saved between visits
- **Saved readings** — the last 20 captures, and it drops you back where you stopped
- **Installable** — "Add to home screen" makes it a real app icon with no browser chrome

## Why it's hosted here and not in a chat artifact

Browsers only hand the camera to a page that asks for it from its own origin over https. A page running inside another site's frame usually never gets asked. GitHub Pages gives it its own https origin, so the camera just works.

## Your API key

Teacher mode is off by default. If you turn it on, the key you paste is kept in this browser's `localStorage` and sent only to `api.anthropic.com` — it is not in this repo and never reaches GitHub. Anyone with access to that browser profile can read it, so use a key you're willing to rotate, and revoke it at console.anthropic.com if you ever hand the phone over.

## Files

| file | what it is |
|---|---|
| `index.html` | the whole app — markup, styles and logic in one file |
| `manifest.webmanifest` | makes it installable |
| `sw.js` | service worker: offline shell, network-first HTML so updates land right away |
| `icons/` | app icons |

## Running it locally

Any static server works, but it must be `https` or `localhost` for the camera:

```
python3 -m http.server 8000
# then open http://localhost:8000
```
