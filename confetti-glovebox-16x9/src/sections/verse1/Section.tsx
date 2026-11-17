// VERSE 1 (bars 4-19): every tab is a scene for a lyric gag. Tabs multiply 1 -> 48 on the beat (contract), the
// camera whips, punches and jump-cuts on beats, and each literal gag holds still for at least 2 beats.
// Literal gags: talking left shoe (v1.02), fridge + pickle parkour (v1.04), Costco-box boat (v1.08), shopping cart
// as F1 (v1.11-12), judgmental dog in an OS window (v1.15-16). Receipts and crumbs come from the debris ledger.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SectionProps} from '../../lib/sectionRoot';
import {useGlobalFrame, useSection} from '../../lib/context';
import {Camera, CutFlash, Pose, REST_POSE, WhipLines, punch, shake, whip} from '../../lib/camera';
import {AppWindow, BrowserWindow, Cursor, Desktop, TabSpec, clockAt} from '../../lib/chrome';
import {ConfettiField, DebrisLayer} from '../../lib/confetti';
import {KineticLine} from '../../lib/type';
import {C, FONT} from '../../lib/theme';
import {beatIndex, clamp, ease, lerp, popIn, prog} from '../../lib/motion';
import {VERSE_WINDOW, tabCountAt} from '../../data/contract';
import {frameOfBar, frameOfBeat, line, section} from '../../data/timing';
import {
  BoatScene,
  CX0,
  CY0,
  CartScene,
  ConferenceScene,
  DOG_WIN,
  DogWindow,
  FridgeScene,
  HomeScene,
  InventoryScene,
  PICKLE_FREEZE,
  SHOE_BUBBLE_AT,
  SearchScene,
  ShoeScene,
  TaxTacoScene,
  picklePos,
  wf,
} from './scenes';
import {AnalogClock, Chip, SpeechBubble} from './props';

// ------------------------------------------------------------------ scenes (one per tab)

const B = (bar: number, beat = 0) => bar * 4 + beat;
type SceneId = 'home' | 'shoe' | 'microwave' | 'fridge' | 'conference' | 'taxtaco' | 'boat' | 'cargo' | 'golf' | 'cart' | 'inventory' | 'dog';
type Scene = {id: SceneId; start: number; tab: TabSpec; url: string};
const SCENES: Scene[] = [
  {id: 'home', start: section('verse1').startFrame, tab: {title: 'glovebox', glyph: 'glovebox'}, url: 'confetti://glovebox'},
  {id: 'shoe', start: frameOfBar(5), tab: {title: 'call: Left Shoe', glyph: 'shoe'}, url: 'confetti://call/left-shoe'},
  {id: 'microwave', start: frameOfBar(6), tab: {title: 'microwave beep??', glyph: 'microwave'}, url: 'search?q=microwave+beep'},
  {id: 'fridge', start: frameOfBar(7), tab: {title: 'fridge cam LIVE', glyph: 'fridge'}, url: 'confetti://fridge/cam'},
  {id: 'conference', start: frameOfBeat(34), tab: {title: 'brain.conf', glyph: 'notebook'}, url: 'confetti://brain.conf/discount'},
  {id: 'taxtaco', start: frameOfBar(10), tab: {title: 'taxes', glyph: 'taxes'}, url: 'confetti://split/taxes|tacos'},
  {id: 'boat', start: frameOfBar(11), tab: {title: 'DIY: box boat', glyph: 'box'}, url: 'confetti://diy/boat-out-of-boxes'},
  {id: 'cargo', start: frameOfBeat(B(12, 1)), tab: {title: 'cargo shorts', glyph: 'shorts'}, url: 'search?q=cape+vs+cargo+shorts'},
  {id: 'golf', start: frameOfBar(13), tab: {title: 'yelling fore?', glyph: 'golf'}, url: 'search?q=yelling+fore+indoors'},
  {id: 'cart', start: frameOfBar(14), tab: {title: 'GROCERY GP live', glyph: 'cart'}, url: 'confetti://grocery-gp/aisle-4'},
  {id: 'inventory', start: frameOfBar(16), tab: {title: 'glovebox inventory', glyph: 'receipt'}, url: 'confetti://glovebox/inventory'},
  {id: 'dog', start: frameOfBar(18), tab: {title: 'dog.window', glyph: 'dog'}, url: 'search?q=is+my+dog+judging+me'},
];
const sceneIdx = (frame: number) => {
  let k = 0;
  SCENES.forEach((s, i) => {
    if (s.start <= frame) k = i;
  });
  return k;
};
const TACOS_AT = () => wf('v1.07', 'tacos');
// Tab index each scene lives in: the newest tab when the scene starts (earlier tabs navigate when the count is low).
const tabIndexOf = (s: Scene) => tabCountAt(s.start) - 1;
const namedAt = (frame: number) => {
  const named: Record<number, TabSpec> = {};
  let active = 0;
  for (const s of SCENES) {
    if (s.start > frame) break;
    const i = tabIndexOf(s);
    if (s.id === 'taxtaco') {
      const taxes = Math.max(0, tabCountAt(wf('v1.07', 'taxes')) - 2);
      named[taxes] = {title: 'taxes', glyph: 'taxes', color: 'mustard'};
      named[taxes + 1] = {title: 'tacos', glyph: 'taco', color: 'pickle'};
      active = frame >= TACOS_AT() ? taxes + 1 : taxes;
    } else {
      named[i] = s.tab;
      active = i;
    }
  }
  return {named, active};
};
// Scale of the newest tab: pops in on the frame the count went up.
const newestPopAt = (frame: number) => {
  const c = tabCountAt(frame);
  for (let f = frame; f > frame - 12; f--) if (tabCountAt(f - 1) !== c) return popIn(frame, f, 6);
  return 1;
};
// World position of the newest tab (flow mode), for the cursor.
const TABBAR_X = VERSE_WINDOW.x + 4 + 18 + 98 + 18;
const newestTabPos = (count: number) => {
  const w = Math.min(260, (VERSE_WINDOW.w - 130) / count);
  return {x: TABBAR_X + (count - 1) * (w - 3) + w / 2, y: VERSE_WINDOW.y + 4 + 66 - 22};
};

// ------------------------------------------------------------------ camera shots (on beats and eighths only)

const cpose = (lx: number, ly: number, scale: number, rot = 0): Pose => ({x: CX0 + lx, y: CY0 + ly, scale, rot});
type Shot = {b: number; pose: Pose; to?: Pose; enter: 'cut' | 'whip'; flash?: boolean; punch?: number; shake?: number};
const TABBAR: Pose = {x: 640, y: 250, scale: 2.0, rot: -2};
let SHOTS_CACHE: Shot[] | null = null;
const shots = (): Shot[] => {
  if (SHOTS_CACHE) return SHOTS_CACHE;
  const pk = picklePos(PICKLE_FREEZE());
  const gag = {punch: 0.015, shake: 1.2};
  SHOTS_CACHE = [
    {b: B(4), pose: REST_POSE, enter: 'cut', punch: 0.05},
    {b: B(4, 2), pose: cpose(846, 360, 1.35, 2), enter: 'cut', flash: true, punch: 0.06},
    {b: B(5), pose: cpose(846, 350, 1.12), enter: 'whip', ...gag},
    {b: B(6), pose: TABBAR, enter: 'whip', punch: 0.07},
    {b: B(6, 1), pose: cpose(800, 90, 1.7, 1), enter: 'cut', flash: true},
    {b: B(6, 2), pose: {...REST_POSE, rot: -3, scale: 1.04}, enter: 'cut'},
    {b: B(6, 3), pose: cpose(700, 330, 1.5, 2), enter: 'cut'},
    {b: B(7), pose: cpose(846, 410, 1.1), enter: 'whip', ...gag},
    {b: B(8), pose: cpose(clamp(pk.x, 520, 1170), clamp(pk.y + 120, 320, 470), 1.45), enter: 'cut', flash: true, punch: 0.05, shake: 1},
    {b: B(8, 2), pose: TABBAR, enter: 'whip', punch: 0.07},
    {b: B(9), pose: REST_POSE, enter: 'cut', flash: true, punch: 0.06},
    {b: B(9, 1), pose: {x: 420, y: 210, scale: 2.3, rot: 2}, enter: 'cut'},
    {b: B(9, 2), pose: cpose(560, 330, 1.6, -2), enter: 'cut'},
    {b: B(9, 3), pose: {...REST_POSE, rot: -3, scale: 1.05}, enter: 'whip'},
    {b: B(10), pose: cpose(423, 380, 1.75, -2), enter: 'cut', flash: true},
    {b: B(10, 2), pose: cpose(1269, 380, 1.75, 2), enter: 'cut', flash: true},
    {b: B(11), pose: cpose(846, 370, 1.08), enter: 'whip', ...gag},
    {b: B(12, 1), pose: {...REST_POSE, rot: 2}, enter: 'whip', punch: 0.06},
    {b: B(12, 2), pose: cpose(760, 110, 1.8, -2), enter: 'cut', flash: true},
    {b: B(13), pose: {x: 420, y: 240, scale: 2.0, rot: -2}, to: {x: 1500, y: 240, scale: 2.0, rot: 2}, enter: 'whip'},
    {b: B(13, 2), pose: {...REST_POSE, rot: 3, scale: 1.06}, enter: 'cut', flash: true},
    {b: B(13, 3), pose: cpose(600, 260, 1.6, -3), enter: 'cut'},
    {b: B(14), pose: cpose(846, 380, 1.06), enter: 'whip', ...gag},
    {b: B(16), pose: {x: 700, y: 700, scale: 1.45, rot: -1}, enter: 'whip', punch: 0.03, shake: 2},
    {b: B(17), pose: {x: 1120, y: 720, scale: 1.5, rot: 1}, to: {x: 1560, y: 720, scale: 1.5, rot: -1}, enter: 'whip', punch: 0.03, shake: 2},
    {b: B(18), pose: {x: 990, y: 540, scale: 1.25, rot: 0}, enter: 'whip', ...gag},
    {b: B(19), pose: REST_POSE, enter: 'cut', flash: true, punch: 0.02, shake: 0.8},
  ];
  return SHOTS_CACHE;
};
const EXTRA_HITS = () => [wf('v1.02', 'socks'), wf('v1.12', 'formula'), wf('v1.12', 'one'), wf('v1.16', 'late')];

const shotIndex = (frame: number) => {
  const S = shots();
  let k = 0;
  S.forEach((s, i) => {
    if (frameOfBeat(s.b) <= frame) k = i;
  });
  return k;
};
const basePose = (i: number, frame: number): Pose => {
  const S = shots();
  const s = S[i];
  if (!s.to) return s.pose;
  const a = frameOfBeat(s.b);
  const e = i + 1 < S.length ? frameOfBeat(S[i + 1].b) : section('verse1').endFrame;
  const t = ease.inOutSine(prog(frame, a, e));
  return {x: lerp(s.pose.x, s.to.x, t), y: lerp(s.pose.y, s.to.y, t), scale: lerp(s.pose.scale, s.to.scale, t), rot: lerp(s.pose.rot, s.to.rot, t)};
};
const cameraAt = (frame: number) => {
  const S = shots();
  const i = shotIndex(frame);
  const s = S[i];
  const a = frameOfBeat(s.b);
  let p = basePose(i, frame);
  let blur = 0;
  let amount = 0;
  let angle = 0;
  if (s.enter === 'whip' && i > 0 && frame < a + 6) {
    const w = whip(frame, a, basePose(i - 1, a), basePose(i, a + 6), 6);
    p = w.pose;
    blur = w.blur;
    amount = w.amount;
    angle = w.angle;
  }
  const sh = shake(frame, 41, s.shake ?? 3);
  let sc = punch(frame, frameOfBeat(beatIndex(frame)), s.punch ?? 0.05, 7);
  for (const h of EXTRA_HITS()) sc *= punch(frame, h, 0.06, 8);
  const pose: Pose = {x: p.x + (sh.x ?? 0), y: p.y + (sh.y ?? 0), scale: p.scale * sc, rot: p.rot + (sh.rot ?? 0)};
  return {pose, blur, amount, angle, flashAt: s.flash ? a : -999};
};

// ------------------------------------------------------------------ the section

const SceneContent: React.FC<{id: SceneId; frame: number; start: number; count: number; named: Record<number, TabSpec>; newestPop: number}> = ({id, frame, start, count, named, newestPop}) => {
  switch (id) {
    case 'home':
      return <HomeScene frame={frame} />;
    case 'shoe':
      return <ShoeScene frame={frame} />;
    case 'microwave':
      return <SearchScene frame={frame} start={start} glyph="microwave" query="microwave beep sounds like a trap door" results={['Is your microwave a trap door? 12 signs', 'Beep meanings, ranked', 'Forum: it beeped and the floor moved']} />;
    case 'fridge':
      return <FridgeScene frame={frame} />;
    case 'conference':
      return <ConferenceScene frame={frame} count={count} named={named} newestPop={newestPop} />;
    case 'taxtaco':
      return <TaxTacoScene frame={frame} />;
    case 'boat':
      return <BoatScene frame={frame} />;
    case 'cargo':
      return <SearchScene frame={frame} start={start} glyph="shorts" query="cape vs cargo shorts" results={['Cargo shorts: 14 pockets, 0 capes', 'Do capes have pockets? (no)', 'Hero gear on a budget']} />;
    case 'golf':
      return <SearchScene frame={frame} start={start} glyph="golf" query="is yelling fore indoors ok" results={['Fore: a guide for non-golfers', 'Is aisle four a golf course?', 'Shopping carts: how fast is too fast']} />;
    case 'cart':
      return <CartScene frame={frame} />;
    case 'inventory':
      return <InventoryScene frame={frame} />;
    case 'dog':
      return <SearchScene frame={frame} start={start} glyph="dog" query="is my dog judging me" results={['Signs your dog is judging you', 'Raised eyebrow: what it means', 'How to be on time (for dogs)']} />;
  }
};

const Section: React.FC<SectionProps> = () => {
  const frame = useGlobalFrame();
  const count = tabCountAt(frame);
  const {named, active} = namedAt(frame);
  const sc = SCENES[sceneIdx(frame)];
  const newestPop = newestPopAt(frame);
  const cam = cameraAt(frame);

  // cursor clicks the newest tab while the tabs multiply (ambient tab-bar shots)
  const showCursor = ['microwave', 'conference', 'golf', 'cargo'].includes(sc.id);
  const tp = newestTabPos(count);
  const press = newestPop < 1 ? clamp(1 - Math.abs(newestPop - 1)) : 0;

  // dog bars: OS window, speech bubble, late clock (world space, over the browser)
  const dogStart = frameOfBar(18);
  const dogEnter = popIn(frame, dogStart, 9);
  const bubbleAt = line('v1.16').startFrame;
  const clockEnter = popIn(frame, frameOfBeat(B(18, 2)), 8);
  const [hh, mm] = clockAt(frame).split(':').map(Number);
  const minutes = hh * 60 + mm;
  const lateBlink = frame >= wf('v1.16', 'late') ? Math.floor(frame / 4) % 2 === 0 : true;

  return (
    <AbsoluteFill>
      <Camera pose={cam.pose} blur={cam.blur}>
        <Desktop frame={frame}>
          <BrowserWindow {...VERSE_WINDOW} tabs={count} named={named} active={active} newestPop={newestPop} url={sc.url}>
            <SceneContent id={sc.id} frame={frame} start={sc.start} count={count} named={named} newestPop={newestPop} />
          </BrowserWindow>
          {sc.id === 'dog' && (
            <>
              <DogWindow frame={frame} enter={dogEnter} />
              {clockEnter > 0 && (
                <AppWindow x={1150} y={500} w={520} h={420} title="Clock" color="tangerine" glyph="calendar" scale={clockEnter}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '20px 22px'}}>
                    <AnalogClock size={230} minutes={minutes} />
                    <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                      <div style={{fontFamily: FONT.mono, fontWeight: 800, fontSize: 52, color: C.ink}}>{clockAt(frame)}</div>
                      <div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 22, color: C.ink2}}>standup: 9:00</div>
                      <Chip bg={lateBlink ? 'tangerine' : 'paper'} size={40}>
                        LATE
                      </Chip>
                    </div>
                  </div>
                </AppWindow>
              )}
              <SpeechBubble x={DOG_WIN.x + DOG_WIN.w + 50} y={210} w={700} size={52} tail="left" enter={popIn(frame, bubbleAt, 8)} text="Man, even I know you're running late." rot={-1.5} />
            </>
          )}
          {showCursor && <Cursor x={tp.x + 10} y={tp.y + 6} kind="pointer" press={press} />}
        </Desktop>
      </Camera>
      <DebrisLayer frame={frame} pose={cam.pose} />
      <ConfettiField frame={frame} />
      <WhipLines amount={cam.amount} angle={cam.angle} seed={sceneIdx(frame) + 3} />
      <CutFlash frame={frame} at={cam.flashAt} />
      {/* punchline type, at most 1 in 3 lines; never on top of a literal gag */}
      <KineticLine line={line('v1.03')} frame={frame} y={940} rot={-2} />
      <KineticLine line={line('v1.05')} frame={frame} y={950} rot={2} card="paper" />
      <KineticLine line={line('v1.09')} frame={frame} y={940} rot={-2} />
      <KineticLine line={line('v1.10')} frame={frame} y={150} rot={2} card="paper" />
      <KineticLine line={line('v1.13')} frame={frame} x={1340} y={170} rot={-3} width={1000} />
    </AbsoluteFill>
  );
};
export default Section;

// Exposed for the manifest / reducer.
export const VERSE1_MARKS = {SHOE_BUBBLE_AT, PICKLE_FREEZE};
