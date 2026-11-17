// v2.12 + v2.13: the Calendar app turns into an RPG boss fight. The calendar (angry pose) is the boss, the player
// is the cursor, the only item is one tangerine. Local coords: the CalendarApp body (BODY_W x BODY_H).
import React from 'react';
import {C, FONT, SHAPE, hardShadow, outline} from '../../lib/theme';
import {Glyph} from '../../lib/glyphs';
import {CalendarApp, CalEvent, Cursor} from '../../lib/chrome';
import {beatPulse, clamp, ease, popIn} from '../../lib/motion';
import {CUE, CO, CW, CH} from './cues';
import {beatAt} from '../../data/timing';

export const APP = {x: 40, y: 6, w: CW - 80, h: CH - 12};
// body origin inside the content area: app border + 52 px title bar + its 4 px bottom border
export const BODY = {x: APP.x + SHAPE.stroke, y: APP.y + SHAPE.stroke + 52 + SHAPE.stroke};
const BODY_W = APP.w - 2 * SHAPE.stroke;
const BODY_H = APP.h - (BODY.y - APP.y) - SHAPE.stroke;
export const BOSS_AT = {x: 1200, y: 170};
const PLAYER_ITEM = {x: 330, y: 390};
// world position of a body point (for screen-space bursts and camera targets)
export const bodyToWorld = (x: number, y: number) => ({x: CO.x + BODY.x + x, y: CO.y + BODY.y + y});

const EVENTS: CalEvent[] = [
  {day: 2, label: 'sync', color: 'fizz'},
  {day: 3, label: 'dentist', color: 'pink'},
  {day: 4, label: 'sync', color: 'fizz'},
  {day: 5, label: 'TAXES', color: 'tangerine'},
  {day: 9, label: 'sync', color: 'fizz'},
  {day: 10, label: '1:1', color: 'pickle'},
  {day: 11, label: 'sync', color: 'fizz'},
  {day: 12, label: 'deadline', color: 'tangerine'},
  {day: 16, label: 'sync', color: 'fizz'},
  {day: 17, label: 'sync', color: 'fizz'},
  {day: 18, label: 'review', color: 'mustard'},
  {day: 19, label: 'sync', color: 'fizz'},
  {day: 23, label: 'all-hands', color: 'pink'},
  {day: 24, label: 'sync', color: 'fizz'},
  {day: 25, label: 'deadline', color: 'tangerine'},
  {day: 26, label: 'sync', color: 'fizz'},
  {day: 30, label: 'sync about sync', color: 'mustard'},
];

const box = (x: number, y: number, w: number, h: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: 'absolute',
  left: x,
  top: y,
  width: w,
  height: h,
  background: C.paper,
  border: outline(SHAPE.stroke + 1),
  borderRadius: SHAPE.radius,
  boxShadow: hardShadow(),
  boxSizing: 'border-box',
  ...extra,
});
const big = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({fontFamily: FONT.display, fontWeight: 900, fontStretch: '125%', fontSize: size, color: C.ink, textTransform: 'uppercase', lineHeight: 1, ...extra});

const message = (f: number): string => {
  if (f < CUE.screenWord) return 'A wild CALENDAR appears!';
  if (f < CUE.itemSel) return 'What will YOU do?';
  if (f < CUE.equip) return 'BAG: 1 TANGERINE.';
  if (f < CUE.throwAt) return 'TANGERINE equipped!';
  if (f < CUE.hit) return 'YOU threw the TANGERINE!';
  return "It's not very effective...";
};
const selected = (f: number) => (f < CUE.itemSel ? 0 : 1);

const HPBar: React.FC<{hp: number; max: number; flash: boolean}> = ({hp, max, flash}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
    <span style={big(26)}>HP</span>
    <div style={{position: 'relative', flex: 1, height: 26, borderRadius: 13, border: outline(), background: C.paper2, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(hp / max) * 100}%`, background: C.pickle}} />
      {flash && <div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, background: C.tangerine}} />}
    </div>
  </div>
);

const Battle: React.FC<{frame: number}> = ({frame}) => {
  const f = frame;
  const hit = CUE.hit;
  const d = f - hit;
  const bob = Math.sin(beatAt(f) * Math.PI) * 8;
  const knock = d >= 0 ? 34 * Math.exp(-d / 5) : 0;
  const flicker = d >= 0 && d < 8 && d % 2 === 0;
  const hp = d >= 0 ? 9998 : 9999;
  const equipped = f >= CUE.equip;
  const bossScale = 1 + beatPulse(f, 0.4) * 0.04 + (f >= CUE.bossWord ? 0.12 * Math.exp(-(f - CUE.bossWord) / 6) : 0);

  // tangerine: rests by the player, flies to the boss in an arc, bounces off and lands at its feet
  let tx = PLAYER_ITEM.x, ty = PLAYER_ITEM.y, trot = 0;
  if (f >= CUE.throwAt && f < hit) {
    const p = (f - CUE.throwAt) / (hit - CUE.throwAt);
    tx = PLAYER_ITEM.x + (BOSS_AT.x - PLAYER_ITEM.x) * p;
    ty = PLAYER_ITEM.y + (BOSS_AT.y - PLAYER_ITEM.y) * p - Math.sin(Math.PI * p) * 220;
    trot = p * 540;
  } else if (d >= 0) {
    const p = clamp(d / 14);
    tx = BOSS_AT.x - 40 - 150 * p;
    ty = BOSS_AT.y + 20 - Math.sin(Math.PI * p) * 90 + 120 * p;
    trot = 540 + p * 200;
  }
  const sel = selected(f);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: BODY_W, height: BODY_H, background: C.paper, overflow: 'hidden'}}>
      {/* platforms */}
      <div style={{position: 'absolute', left: BOSS_AT.x - 230, top: BOSS_AT.y + 100, width: 460, height: 80, borderRadius: '50%', background: C.paper2, border: outline()}} />
      <div style={{position: 'absolute', left: 100, top: 420, width: 460, height: 80, borderRadius: '50%', background: C.paper2, border: outline()}} />
      {/* boss */}
      <div style={{position: 'absolute', left: BOSS_AT.x - 150 + knock, top: BOSS_AT.y - 150 + bob, visibility: flicker ? 'hidden' : 'visible', transform: `scale(${bossScale})`}}>
        <Glyph name="calendar" size={300} pose={1} />
      </div>
      {/* boss card */}
      <div style={box(30, 24, 640, 150, {padding: '18px 24px'})}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14}}>
          <span style={big(46)}>Calendar</span>
          <span style={{fontFamily: FONT.mono, fontWeight: 800, fontSize: 30, color: C.ink}}>Lv.99</span>
        </div>
        <HPBar hp={hp} max={9999} flash={d >= 0 && d < 20} />
        <div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 22, color: C.ink2, marginTop: 8, textAlign: 'right'}}>{hp}/9999</div>
      </div>
      {/* player: the cursor, armed with one tangerine */}
      <Cursor x={200} y={250} kind="arrow" scale={3.6} />
      <div style={{position: 'absolute', left: tx - 60, top: ty - 60, transform: `rotate(${trot}deg)`}}>
        <Glyph name="tangerine" size={120} />
      </div>
      {d >= 0 && d < 7 && (
        <svg width={260} height={260} viewBox="-130 -130 260 260" style={{position: 'absolute', left: BOSS_AT.x - 170, top: BOSS_AT.y - 130}}>
          <path d={Array.from({length: 16}, (_, i) => `${i ? 'L' : 'M'}${Math.cos((i * Math.PI) / 8) * (i % 2 ? 50 : 120)} ${Math.sin((i * Math.PI) / 8) * (i % 2 ? 50 : 120)}`).join(' ') + 'Z'} fill={C.mustard} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
        </svg>
      )}
      {d >= 0 && d < 30 && <div style={{position: 'absolute', left: BOSS_AT.x + 120, top: BOSS_AT.y - 60 - d * 3, ...big(64, {color: C.tangerine, WebkitTextStroke: `3px ${C.ink}`})}}>-1</div>}
      {/* player card */}
      <div style={box(900, 330, 670, 150, {padding: '18px 24px'})}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12}}>
          <span style={big(42)}>You</span>
          <span style={{fontFamily: FONT.mono, fontWeight: 800, fontSize: 28, color: C.ink}}>Lv.3 · HP 12/12</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT.mono, fontWeight: 800, fontSize: 28, color: C.ink}}>
          equipped: {equipped ? <><Glyph name="tangerine" size={40} /> TANGERINE</> : 'nothing'}
        </div>
      </div>
      {/* text box and menu */}
      <div style={box(30, 510, 1000, 150, {padding: '30px 34px', display: 'flex', alignItems: 'center'})}>
        <span style={big(44, {fontStretch: '112%'})}>{message(f)}</span>
      </div>
      <div style={box(1060, 510, 510, 150, {padding: '10px 30px'})}>
        {['FIGHT', 'ITEM', 'RUN'].map((m, i) => (
          <div key={m} style={{display: 'flex', alignItems: 'center', gap: 14, height: 42}}>
            <svg width={24} height={28} viewBox="0 0 24 28" style={{visibility: i === sel ? 'visible' : 'hidden'}}>
              <path d="M2 2 L22 14 L2 26Z" fill={C.tangerine} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
            </svg>
            <span style={big(36, {color: i === sel ? C.ink : C.ink2})}>{m}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const BossPage: React.FC<{frame: number}> = ({frame}) => {
  // battle wipe: ink and mustard bars close over the calendar, then open on the battle screen
  const t = frame - CUE.bossWipe;
  const close = clamp(t / 6);
  const open = clamp((t - 6) / 6);
  const bars = t >= 0 && t < 12;
  const inBattle = t >= 6;
  return (
    <div style={{position: 'absolute', inset: 0, background: C.paper}}>
      <CalendarApp x={APP.x} y={APP.y} w={APP.w} h={APP.h} events={EVENTS} title={inBattle ? 'Calendar — BOSS FIGHT' : 'Calendar'} month={inBattle ? 'NOVEMBER (BOSS)' : 'NOVEMBER'}>
        {inBattle && (
          <div style={{position: 'absolute', inset: 0}}>
            <Battle frame={frame} />
          </div>
        )}
        {!inBattle && (
          <div style={{position: 'absolute', right: 30, top: 6, transform: `scale(${popIn(frame, CUE.bossIn + 2, 8)})`}}>
            <Glyph name="calendar" size={46} pose={frame >= CUE.bossWipe - 6 ? 1 : 0} />
          </div>
        )}
        {bars &&
          Array.from({length: 8}, (_, i) => {
            const s = ease.inOutCubic(close) * (1 - ease.inOutCubic(open));
            return <div key={i} style={{position: 'absolute', left: i % 2 ? 'auto' : 0, right: i % 2 ? 0 : 'auto', top: (i * BODY_H) / 8, width: BODY_W * s, height: BODY_H / 8 + 1, background: i % 2 ? C.ink : C.mustard}} />;
          })}
      </CalendarApp>
    </div>
  );
};
