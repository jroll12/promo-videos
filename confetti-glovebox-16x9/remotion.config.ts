// Render settings shared by studio, stills and renders. Kept small and explicit so a render is reproducible.
import {Config} from '@remotion/cli/config';
import {existsSync} from 'node:fs';

// Use the Chromium headless shell that ships with this container instead of downloading one.
// Override with REMOTION_BROWSER=/path/to/chrome-headless-shell on another machine.
const local = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = process.env.REMOTION_BROWSER ?? (existsSync(local) ? local : null);
if (browser) Config.setBrowserExecutable(browser);

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setConcurrency(4);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setAudioCodec('aac');
Config.setDelayRenderTimeoutInMilliseconds(60000);
Config.setOverwriteOutput(true);
