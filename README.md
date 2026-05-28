# møte.no

![Valider](https://github.com/USERNAME/mote-no/actions/workflows/validate.yml/badge.svg)

En enkeltstående, lokal møteassistent for norsk tale — inspirert av Granola. Tar opp møtet, transkriberer fortløpende med Groq Whisper, lager strukturert AI-oppsummering, og lagrer Obsidian-kompatible `.md`-filer rett i din egen vault. Alt kjører i nettleseren; ingen server, ingen mellomledd.

**Én HTML-fil. Ingen bygging. Åpne i Chrome og kjør.**

## Funksjoner

- **Fortløpende transkripsjon** — Groq Whisper large-v3 transkriberer norsk tale i 60-sekunders segmenter mens møtet pågår. Robust segmentering gjør at lange møter (1 t+) fungerer stabilt.
- **Flere lydkilder** — ta opp din egen mikrofon, skjermlyd fra en fane/skjerm (de andre deltakerne i Teams/Meet), eller begge mikset sammen.
- **AI-oppsummering** — Groq Llama 3.3 70b lager sammendrag, nøkkelpunkter, beslutninger, oppfølgingspunkter og stemning som strukturert JSON.
- **Obsidian-kompatible filer** — `.md` med YAML frontmatter (tittel, dato, varighet, tags, relatert) lagres direkte i valgt mappe via File System Access API.
- **Backlinks** — vaulten skannes rekursivt, og AI-en foreslår relevante `[[lenker]]` basert på møteinnholdet.
- **Talekommandoer** — si «oppgave til Jonas: følg opp budsjettet» midt i møtet, så fanges det automatisk opp som en oppgave med navn og tidsstempel.
- **Egne notater** — skriv notater underveis. Under opptak setter Enter inn et `[mm:ss]`-tidsstempel automatisk.
- **Manuelle oppgaver** — legg til oppgaver for hånd ved siden av de talegjenkjente.
- **Pause/fortsett** — pause opptaket uten å miste mikrofontilgang eller det opptatte.
- **Wake Lock** — hindrer at skjermen sovner under lange møter, og re-akkvireres når du kommer tilbake til fanen.
- **Autolagring av kladd** — en rå kladd skrives til vaulten hvert 30. sekund som forsikring mot at fanen krasjer. Ryddes bort når det ferdige referatet lagres.

## Kom i gang

1. **Hent en Groq-nøkkel** (gratis) på [console.groq.com/keys](https://console.groq.com/keys). Én nøkkel dekker både tale og oppsummering.
2. **Åpne `index.html`** i Chrome eller Edge.
3. **Lim inn nøkkelen**, velg en mappe (gjerne en undermappe i Obsidian-vaulten din), gi møtet en tittel og trykk **Ta opp**.
4. Etter møtet: **Generer oppsummering** → **Lagre som .md**.

## Krav

- **Chrome eller Edge** (desktop). Appen bruker File System Access API og MediaRecorder, som per i dag ikke støttes fullt ut i Safari/Firefox.
- En Groq API-nøkkel (gratis-tier holder for normal møtebruk).
- Mikrofontilgang.

## Personvern og sikkerhet

- Appen kjører **lokalt i nettleseren din**. Det finnes ingen møte.no-server.
- Lyd sendes til **Groq** for transkripsjon og oppsummering — les Groqs vilkår hvis møtene inneholder sensitivt innhold.
- API-nøkkelen lagres **kun i minnet** for økten; den skrives ikke til disk og forlater aldri nettleseren annet enn i kall direkte til Groq.
- Møtefiler lagres **kun i mappen du selv velger**.

> **Merk om sensitivt innhold:** Ved møter med personopplysninger eller fortrolig materiale bør du vurdere databehandleravtale og lovgrunnlag før lyd sendes til en ekstern transkriberingstjeneste.

## Teknisk

| Område | Løsning |
|--------|---------|
| Transkripsjon | Groq Whisper large-v3 (`/openai/v1/audio/transcriptions`), språk `no` |
| Oppsummering | Groq Llama 3.3 70b (`/openai/v1/chat/completions`), JSON-modus |
| Fillagring | File System Access API (`showDirectoryPicker`) |
| Opptak | MediaRecorder, stopp/start per 60-sek-segment for gyldige WebM-headere |
| Robusthet | Retry med backoff ved rate-limit (429), autolagret kladd, wake lock |

Hele appen er én fil (`index.html`) uten avhengigheter eller byggesteg.

## Tips: opptak av videomøter

For å fange de andre deltakerne i Teams/Meet/Zoom, velg lydkilde **Skjermlyd** eller **Begge**. I delingsdialogen som dukker opp:

- Velg gjerne **én fane** (f.eks. Teams-fanen) framfor hele skjermen — det gir best lydkvalitet.
- **Huk av «Del lyd» / «Share tab audio»** — uten dette fanges ingen systemlyd.
- Velger du **Begge**, mikses din mikrofon og møtelyden sammen til ett opptak.

Stopper du skjermdelingen via nettleserens egen knapp, avsluttes opptaket pent og transkriberes.

## Utvikling

Appen er ren HTML/CSS/JS uten byggesteg. En valideringsworkflow kjører ved hver push:

```bash
node scripts/validate.js   # sjekker JS-syntaks, sentrale funksjoner og element-IDer
```

GitHub Actions kjører den samme valideringen automatisk (se `.github/workflows/validate.yml`).

## Lisens

MIT — se [LICENSE](LICENSE).
