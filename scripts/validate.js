#!/usr/bin/env node
/**
 * Enkel validering av møte.no (index.html):
 *  1. Filen finnes og er lesbar
 *  2. Inneholder nøyaktig ett <script>-blokk
 *  3. JS-en i <script> er syntaktisk gyldig (parses uten feil)
 *  4. Sentrale funksjoner og elementer finnes (grunnleggende røyktest)
 *
 * Avslutter med kode 1 ved feil, slik at GitHub Actions feiler bygget.
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'index.html');
let errors = 0;
const fail = (msg) => { console.error('✗ ' + msg); errors++; };
const ok = (msg) => console.log('✓ ' + msg);

if (!fs.existsSync(file)) {
  fail('index.html finnes ikke');
  process.exit(1);
}
const html = fs.readFileSync(file, 'utf8');
ok('index.html lest (' + html.length + ' tegn)');

// Ett script-blokk
const scripts = html.match(/<script>[\s\S]*?<\/script>/g) || [];
if (scripts.length !== 1) {
  fail('Forventet nøyaktig ett <script>-blokk, fant ' + scripts.length);
} else {
  ok('Ett <script>-blokk funnet');
}

// JS-syntaks
if (scripts.length === 1) {
  const js = scripts[0].replace(/^<script>/, '').replace(/<\/script>$/, '');
  try {
    new Function(js);
    ok('JavaScript er syntaktisk gyldig');
  } catch (e) {
    fail('JavaScript-syntaksfeil: ' + e.message);
  }
}

// Røyktest: sentrale funksjoner
const requiredFns = [
  'startRecording', 'stopRecording', 'togglePause', 'transcribeBlob',
  'summarize', 'saveToFolder', 'buildMarkdown', 'saveDraft',
  'acquireStream', 'setSource', 'scanVault'
];
requiredFns.forEach(fn => {
  if (!new RegExp('function\\s+' + fn + '\\b').test(html)) {
    fail('Mangler funksjon: ' + fn);
  }
});
if (errors === 0) ok('Alle sentrale funksjoner finnes');

// Røyktest: sentrale element-IDer
const requiredIds = [
  'groqKeyInput', 'recordBtn', 'pauseBtn', 'meetingTitle',
  'transcriptBody', 'summaryBody', 'notesInput', 'saveBtn',
  'srcMic', 'srcSystem', 'srcBoth'
];
let idMiss = 0;
requiredIds.forEach(id => {
  if (!html.includes('id="' + id + '"')) { fail('Mangler element-ID: ' + id); idMiss++; }
});
if (idMiss === 0) ok('Alle sentrale element-IDer finnes');

// Balanserte script-tagger generelt
const openS = (html.match(/<script\b/g) || []).length;
const closeS = (html.match(/<\/script>/g) || []).length;
if (openS !== closeS) fail('Ubalanserte <script>-tagger: ' + openS + ' åpne, ' + closeS + ' lukkende');

console.log('');
if (errors > 0) {
  console.error('Validering FEILET med ' + errors + ' feil.');
  process.exit(1);
}
console.log('Validering bestått. ✓');
