# APUSH Lectern

Point your phone's camera at a reading, box a paragraph, and hear it read out loud properly.

**Live:** https://landen-finkel-engineering.github.io/apush-lectern/

Built for someone who finds reading hard and still has to get through the chapter.

## How it reads the page

**Gemini (default, free).** The crop goes to Google's Gemini, which transcribes it exactly. A phone
photo of a textbook has a shadow across it, a curved page near the spine, and decorated drop caps —
on-device OCR mangles all three, and a reader who can't easily check the text against the page has
no way to catch the errors. Google AI Studio's free tier needs **no credit card**: grab a key at
aistudio.google.com/apikey and paste it in. The app asks the API which models the key can use and
picks the newest non-lite Flash itself, so it doesn't go stale. Note that on Google's free tier they
may use what you send to improve their products.

**Claude (optional).** Same job via Anthropic's API. Paid — you put credit on it first.

**Offline OCR (fallback).** Tesseract with Sauvola local adaptive thresholding. Free, works with no
key and no internet. Measured at ~97% character accuracy on a clean crop, but it still gets words
wrong on a shadowed or curved page, and the app says so plainly rather than pretending.

Two modes once a page is read: **the words** (the exact transcription) and **explain it** (the same
material as an APUSH teacher would say it aloud), plus key terms you can tap to hear.

## How it reads *aloud*

`speech.js` rewrites text for the voice without changing what's on screen:

| printed | spoken |
|---|---|
| 1607–1754 | sixteen oh seven to seventeen fifty-four |
| 1854 | eighteen fifty-four |
| 36°30′ | thirty-six degrees thirty minutes |
| 19th | nineteenth |
| — | (a pause) |
| `-\.\` | (dropped, never pronounced) |

Every display word keeps a known character range inside the spoken string, which is what lets the
reader highlight the exact word being said.

Voices are ranked so neural/enhanced ones win, the picker labels their quality, and if your device
only has the robotic set the app tells you how to install better ones.

## Reading controls

Atkinson Hyperlegible (drawn by the Braille Institute to keep lookalike letters apart), Lexend,
a serif, or your system font. Size, line spacing, letter spacing, word spacing and line length are
all adjustable. Low-glare paper, white, or dark. Focus mode dims everything but the sentence being
read. Tap any sentence to start from there.

## Files

| file | what it is |
|---|---|
| `index.html` | the app |
| `speech.js` | text → speech normalisation and the word map |
| `manifest.webmanifest`, `sw.js`, `icons/` | installable PWA shell |

## Your API key

Stored in this browser's `localStorage`, sent only to `api.anthropic.com`. It is not in this repo
and never reaches GitHub. Anyone with access to that browser profile can read it, so use a key
you're willing to rotate.

## Running it locally

Must be `https` or `localhost` for the camera:

```
python3 -m http.server 8000
```
