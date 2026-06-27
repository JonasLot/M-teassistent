# Auto-stopp av opptak ved stillhet

## Kontekst

Brukeren glemmer av og til å stoppe opptaket etter at møtet er ferdig, slik at
appen tar opp (og transkriberer mot Groq) i tomme rom lenge etter at praten er
over. Vi vil at opptaket skal stoppe seg selv når «møtet er slutt».

Etter avklaring betyr «møtet er slutt» her: **det har vært stille en god stund**.
Konkret:

- **Trigger:** stillhetsdeteksjon på lydnivået (ikke maks-varighet).
- **Terskel:** 5 minutter sammenhengende stillhet.
- **Sikkerhet:** når terskelen nås vises et varsel med 30 sek nedtelling og en
  «Fortsett opptak»-knapp, slik at man kan avbryte auto-stoppen før den slår til.

All opptakslogikk ligger i én fil: [index.html](/Users/jonas.lotherington/Documents/git-repositories/Møteassistent/index.html).
Det finnes ingen stillhets-/aktivitetsdeteksjon i dag. Det finnes allerede en
beslektet auto-stopp via `onSystemAudioEnded()` (index.html:616) når skjermdeling
avsluttes — den nye logikken legges på siden av denne, ikke i stedet for.

## Tilnærming

Tapp lydstrømmen med en `AnalyserNode`, mål volumet hvert sekund, og tell hvor
lenge det har vært stille. Når stillheten nærmer seg terskelen, vis et varsel med
nedtelling; nås terskelen, kall den eksisterende `stopRecording()` (som allerede
finaliserer transkripsjon, lagrer kladd og rydder opp pent).

### 1. Nye konstanter og global tilstand

Legg ved de øvrige globalene øverst i `<script>` (rundt index.html:344):

```js
const SILENCE_STOP_MS = 5 * 60 * 1000; // 5 min stillhet → auto-stopp
const SILENCE_WARN_MS = 30 * 1000;     // vis nedtelling siste 30 sek
const SILENCE_RMS_THRESHOLD = 0.012;   // under dette regnes som «stille» (justeres ved test)
let silenceAnalyser = null, silenceAnalyserCtx = null, silenceData = null;
let silenceCheckInterval = null, silenceStartTs = null, autoStopWarned = false;
```

### 2. Sett opp analysator når opptak starter

Ny funksjon `startSilenceWatch()` som lager en egen `AudioContext` + `AnalyserNode`
på `mediaStream`, og kjører en `setInterval` (1000 ms) som:

- regner ut RMS-volum fra `getByteTimeDomainData`,
- hvis volum > terskel: nullstill `silenceStartTs`, skjul evt. varsel (`clearAutoStopWarning()`),
- hvis volum ≤ terskel: start/tikk `silenceStartTs`; når stillheten passerer
  `SILENCE_STOP_MS − SILENCE_WARN_MS`, vis varsel + nedtelling; når den passerer
  `SILENCE_STOP_MS`, kall `stopRecording()`.

Analysatoren kobles **ikke** til `destination` (unngår ekko). Egen `AudioContext`
brukes så det fungerer for alle tre kildene (`mic`/`system`/`both`) uavhengig av
den eksisterende `audioCtx` (som kun finnes for `both`).

Ny funksjon `stopSilenceWatch()` som rydder interval, lukker analysator-context og
nullstiller tilstanden.

### 3. Koble inn i opptaks-livssyklusen

- `startRecording()` (index.html:638-ish): kall `startSilenceWatch()` etter at
  `startSegmentRecorder()` er kjørt.
- `stopRecording()` (index.html:708): kall `stopSilenceWatch()` + `clearAutoStopWarning()`.
- `pauseRecording()` (index.html:738): kall `stopSilenceWatch()` (ikke tell stillhet under pause).
- `resumeRecording()` (index.html:758): kall `startSilenceWatch()` igjen.

### 4. Varsel-UI med nedtelling og «Fortsett opptak»

Gjenbruk eksisterende stil. Enkleste vei: en ny, skjult banner i `record-area`
(rundt index.html:236-251), f.eks.:

```html
<div class="auto-stop-warn" id="autoStopWarn" style="display:none">
  <span id="autoStopMsg">Stille en stund — stopper om 30 s…</span>
  <button id="autoStopCancel">Fortsett opptak</button>
</div>
```

- `showAutoStopWarning(remainingSec)`: viser banneren og oppdaterer nedtellingsteksten hvert sekund.
- `clearAutoStopWarning()`: skjuler banneren, nullstiller `autoStopWarned`.
- `#autoStopCancel`-klikk: nullstill `silenceStartTs` (gir ny full periode) og skjul varsel.

Legg til en diskret CSS-regel for `.auto-stop-warn` i samsvar med eksisterende
`.rec-strip`-stil. Når auto-stopp faktisk skjer, sett en forklarende statusmelding
via `setStatus(...)` (slik `onSystemAudioEnded` gjør) så brukeren ser hvorfor det stoppet.

## Filer som endres

- [index.html](/Users/jonas.lotherington/Documents/git-repositories/Møteassistent/index.html) — eneste fil. Endringer i: globaler (~344), `record-area`-HTML (~236), `startRecording` (~630), `stopRecording` (~708), `pauseRecording`/`resumeRecording` (~738/758), pluss nye funksjoner `startSilenceWatch`/`stopSilenceWatch`/`showAutoStopWarning`/`clearAutoStopWarning` og litt CSS.

## Verifisering

1. Åpne `index.html` i nettleser, velg mikrofon, start opptak.
2. **Hurtigtest:** sett midlertidig `SILENCE_STOP_MS = 15000` og `SILENCE_WARN_MS = 5000`. Vær stille → varsel med nedtelling skal vises etter ~10 sek, og opptaket stoppe etter ~15 sek med forklarende status.
3. Snakk i mikrofonen mens nedtellingen går → varselet skal forsvinne og opptaket fortsette.
4. Trykk «Fortsett opptak» under nedtelling → varsel forsvinner, opptak fortsetter, ny stillhetsperiode starter.
5. Sjekk pause/fortsett: stillhetstelleren skal ikke gå under pause.
6. Bekreft at manuell Stopp fortsatt finaliserer transkripsjon og lagrer kladd som før.
7. Sett konstantene tilbake til 5 min / 30 sek før commit. Juster evt. `SILENCE_RMS_THRESHOLD` hvis bakgrunnsstøy hindrer at stillhet oppdages.
