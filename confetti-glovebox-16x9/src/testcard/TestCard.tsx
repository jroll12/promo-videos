// 10 s test card over the first hook. Proves the pipeline end to end: fonts, palette, glyphs, tabs multiplying on
// the beat grid, cursor snap-and-hold, confetti at three levels and modes, debris ledger, hook type on real word
// timing, beat flash and bar counter against the audio.
import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {useGlobalFrame} from '../lib/context';
import {Camera, REST_POSE, punch} from '../lib/camera';
import {BROWSER_CHROME_H, BrowserWindow, Cursor, Desktop, Popup} from '../lib/chrome';
import {ConfettiField, DebrisLayer, debrisCount} from '../lib/confetti';
import {Glyph, GLYPHS} from '../lib/glyphs';
import {HookType} from '../lib/type';
import {C, FONT, outline, SHAPE} from '../lib/theme';
import {HOOK_WINDOW} from '../data/contract';
import {AUDIO_FILE, barAt, beatAt, frameOfBar, section} from '../data/timing';
import {beatPulse, clamp, ease, popIn} from '../lib/motion';

export const TESTCARD_FRAMES = 300;

const PALETTE: (keyof typeof C)[] = ['ink', 'ink2', 'paper', 'paper2', 'tangerine', 'pickle', 'fizz', 'pink', 'mustard'];

export const TestCard: React.FC = () => {
  const frame = useGlobalFrame();
  const s = section('hook1');
  const local = frame - s.startFrame;
  const bar = barAt(frame);
  const beat = beatAt(frame);
  const pulse = beatPulse(frame, 0.4);

  // tabs multiply on each beat: 1, 2, 3, 4, 6, 8, ... up to 48 over the card
  const beatsIn = Math.max(0, Math.floor(beat - s.startBar * 4));
  const tabs = Math.min(48, Math.round(Math.pow(1.17, beatsIn)));

  // cursor flies in during bar 0 of the card, snaps to the active (centre) tab on the downbeat of bar 1, holds
  const snapAt = frameOfBar(s.startBar + 1);
  const tabX = HOOK_WINDOW.x + 130 + (HOOK_WINDOW.w - 130) / 2 + 18;
  const tabY = HOOK_WINDOW.y + 40;
  const fly = ease.inOutCubic(clamp((frame - (snapAt - 20)) / 20));
  const cx = 1700 + (tabX - 1700) * fly;
  const cy = 980 + (tabY - 980) * fly;
  const press = frame >= snapAt ? clamp(1 - (frame - snapAt) / 10) : 0;

  // three confetti demos, one per third of the card
  const third = Math.floor((local / TESTCARD_FRAMES) * 3);
  const mode = (['fall', 'float', 'orbit'] as const)[Math.min(2, third)];
  const level = [0.15, 0.5, 1.0][Math.min(2, third)];

  const pose = {...REST_POSE, scale: punch(frame, snapAt, 0.06, 10)};
  const popupAt = frameOfBar(s.startBar + 3);

  return (
    <AbsoluteFill style={{background: C.paper2}}>
      <Camera pose={pose}>
        <Desktop frame={frame}>
          <BrowserWindow {...HOOK_WINDOW} tabs={tabs} tabMode="symmetric" activeWidth={300} named={{0: {title: 'still showing up', glyph: 'glovebox'}}} active={0} url="confetti://test-card">
            <div style={{padding: 26, display: 'flex', flexDirection: 'column', gap: 18, height: HOOK_WINDOW.h - BROWSER_CHROME_H - 52, boxSizing: 'border-box'}}>
              <div style={{display: 'flex', gap: 12}}>
                {PALETTE.map((k) => (
                  <div key={k} style={{textAlign: 'center'}}>
                    <div style={{width: 120, height: 70, background: C[k], border: outline(), borderRadius: SHAPE.radiusSmall}} />
                    <div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 17, color: C.ink, marginTop: 4}}>{k}</div>
                    <div style={{fontFamily: FONT.mono, fontSize: 15, color: C.ink2}}>{C[k]}</div>
                  </div>
                ))}
              </div>
              <div style={{fontFamily: FONT.display, fontWeight: 900, fontStretch: '125%', fontSize: 64, color: C.ink, lineHeight: 1}}>CONFETTI IN THE GLOVEBOX</div>
              <div style={{fontFamily: FONT.display, fontWeight: 500, fontStretch: '75%', fontSize: 34, color: C.ink2}}>Archivo 500 / 75% · Archivo 900 / 125% above · JetBrains Mono below</div>
              <div style={{fontFamily: FONT.mono, fontWeight: 600, fontSize: 26, color: C.ink}}>confetti://glovebox/tabs?count={tabs}</div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 10}}>
                {GLYPHS.map((g, i) => (
                  <Glyph key={g} name={g} size={52} pose={(local / 30 + i * 0.1) % 1} />
                ))}
              </div>
            </div>
          </BrowserWindow>
          <Popup x={1560} y={300} w={460} title="Reminder" body="You have 47 tabs open. Still showing up?" buttons={['Later', 'Yes']} glyph="calendar" enter={popIn(frame, popupAt, 8) * (frame < popupAt + 50 ? 1 : 0)} />
          <Cursor x={cx} y={cy} kind={frame >= snapAt - 4 ? 'pointer' : 'arrow'} press={press} />
        </Desktop>
      </Camera>
      <DebrisLayer frame={frame} pose={pose} />
      <ConfettiField frame={frame} level={level} mode={mode} spin={1.4} />
      <HookType section="hook1" frame={frame} intensity={0.4} y={990} pulse={pulse} />
      {/* sync proof: flash on every beat (bigger on the downbeat), bar and beat counter, debris count */}
      <div
        style={{
          position: 'absolute',
          left: 24,
          top: 64,
          padding: '10px 16px',
          background: pulse > 0.5 ? (Math.floor(beat + 1e-6) % 4 === 0 ? C.tangerine : C.mustard) : C.paper,
          border: outline(),
          borderRadius: SHAPE.radiusSmall,
          fontFamily: FONT.mono,
          fontWeight: 800,
          fontSize: 24,
          color: C.ink,
          zIndex: 100,
        }}
      >
        bar {Math.floor(bar)} · beat {(Math.floor(beat + 1e-6) % 4) + 1} · f{frame} · {mode} {level} · debris {debrisCount(frame)}
      </div>
    </AbsoluteFill>
  );
};

export const TestCardWithAudio: React.FC = () => (
  <>
    <TestCard />
    <Audio src={staticFile(AUDIO_FILE)} trimBefore={section('hook1').startFrame} />
  </>
);
