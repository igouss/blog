---
title: "Dictating to Claude Code on a phone"
date: "2026-02-25"
---

Adding a mobile wrapper page to the [ttyd browser terminal](/articles/claude-ttyd-tailscale-caddy) with an arrow-key toolbar and voice dictation via the Web Speech API. The terminal is usable from a phone, including speaking commands and code directly into it.

## The problem with ttyd on a phone

The ttyd terminal works fine in a mobile browser, but two things make it painful:

1. **No arrow keys.** The on-screen keyboard covers most of the screen and has no cursor keys, Esc, Tab, or Ctrl combos that a terminal constantly needs.
2. **Typing long prompts is slow.** Dictating to Claude is faster than typing on a phone keyboard.

## Mobile wrapper page

A separate Caddy route at `/code-mobile` serves a static HTML page that embeds the ttyd terminal in an iframe and adds a toolbar below it. The Caddyfile route:

```
handle /code-mobile {
    @tailnet header Tailscale-User-Login *
    handle @tailnet {
        root * /home/elendal/IdeaProjects/claude-code-mobile
        rewrite * /code-mobile.html
        file_server
    }
    respond "Forbidden" 403
}
```

The ttyd instance for mobile runs on a separate port (7683) with a smaller font size, behind its own Caddy route at `/code-term*`. The iframe points to `/code-term/`.

The key toolbar injects escape sequences directly into xterm.js's hidden textarea using the native value setter and `InputEvent`:

```js
function send(seq) {
  const doc = document.getElementById('term').contentDocument;
  const ta = doc && doc.querySelector('textarea');
  if (!ta) return;
  ta.focus();
  const nativeInputSetter = Object.getOwnPropertyDescriptor(
    window.frames[0].HTMLTextAreaElement.prototype, 'value').set;
  nativeInputSetter.call(ta, seq);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}
```

Regular text (from voice dictation) needs `InputEvent` with a `data` property — xterm.js reads `e.data` for printable characters and ignores `Event('input')` without it:

```js
function sendText(text) {
  const setter = Object.getOwnPropertyDescriptor(
    window.frames[0].HTMLTextAreaElement.prototype, 'value').set;
  setter.call(ta, text);
  ta.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }));
}
```

## Voice dictation

The Web Speech API (`webkitSpeechRecognition`) is built into Chrome on Android. No model download, no server, no audio encoding issues.

Toggle-to-talk: one tap starts recording (button turns red), another tap stops it. Each final result is injected into the terminal as it arrives, so long dictation sessions work naturally.

```js
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.continuous = true;
recognition.interimResults = false;

recognition.onresult = e => {
  const result = e.results[e.results.length - 1];
  if (!result.isFinal) return;
  const text = result[0].transcript.trim();
  if (text) sendText(text + ' ');
};
```

`continuous: true` keeps the session open until explicitly stopped. `interimResults: false` means only finalized text is processed, avoiding duplicate injections.

## What I tried first: Whisper in the browser

The original plan was to run Whisper locally via [HuggingFace Transformers.js](https://huggingface.co/docs/transformers.js) — no server calls, fully private. The pipeline API is clean:

```js
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/dist/transformers.min.js';
const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base.en', { dtype: 'q8' });
```

It works in desktop Chrome. On Android Chrome it doesn't, for two reasons:

**Audio capture.** `ScriptProcessorNode` (deprecated) doesn't fire `onaudioprocess` on mobile. `AudioWorkletNode` (modern replacement) fires but requires the graph to be connected to `audioCtx.destination` — and even then, mobile Chrome may keep the AudioContext suspended unless resumed from a synchronous user gesture handler, which is awkward with async setup code.

**Codec decoding.** `MediaRecorder` on Android Chrome produces `audio/webm;codecs=opus`. `AudioContext.decodeAudioData` on the same browser rejects it. Transformers.js uses `decodeAudioData` internally when you pass a blob URL. There is no built-in WAV recording option in `MediaRecorder` on Chrome.

The Web Speech API sidesteps all of this. If offline/private transcription becomes a requirement, the audio capture problem would need a different approach — possibly recording to a remote server and running Whisper there.

## Files

- `~/IdeaProjects/claude-code-mobile/code-mobile.html` — wrapper page
- `~/IdeaProjects/infra/Caddyfile` — `/code-mobile` and `/code-term*` routes
- `~/.config/systemd/user/claude-code-ttyd-mobile.service` — ttyd instance on port 7683
