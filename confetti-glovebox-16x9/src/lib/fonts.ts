// Loads the two bundled fonts from public/fonts before the first frame renders. No network at render time.
import {continueRender, delayRender, staticFile} from 'remotion';

let started = false;
let ready = false;
let resolveReady: () => void = () => {};
// Resolves once both fonts are registered. Canvas layers wait for it so their first draw uses the right font.
export const fontsReady: Promise<void> = new Promise((r) => {
  resolveReady = r;
});
export const areFontsReady = () => ready;

export const loadFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const handle = delayRender('fonts');
  const faces = [
    new FontFace('Archivo', `url(${staticFile('fonts/archivo.woff2')}) format('woff2')`, {weight: '100 900', stretch: '62% 125%'}),
    new FontFace('JetBrains Mono', `url(${staticFile('fonts/jetbrains-mono.woff2')}) format('woff2')`, {weight: '100 800'}),
  ];
  Promise.all(faces.map((f) => f.load()))
    .then((loaded) => {
      loaded.forEach((f) => (document.fonts as unknown as {add: (x: FontFace) => void}).add(f));
      ready = true;
      resolveReady();
      continueRender(handle);
    })
    .catch((e) => {
      console.error('font load failed', e);
      ready = true;
      resolveReady();
      continueRender(handle);
    });
};
