// Fake OS chrome: desktop, windows, tabs, cursor, pop-ups, calendar, notes, spinner.
// All positions are desktop px (world space, 1920x1080). Wrap in <Camera> to move them.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, SHAPE, hardShadow, outline, ColorName} from '../theme';
import {Glyph, GlyphName} from '../glyphs';
import {ICON_HOME, ICON_LABEL, ICON_SIZE, MENU_BAR_H} from '../../data/contract';
import {FPS, DURATION} from '../../data/timing';
import {hash} from '../rng';

// ------------------------------------------------------------------ desktop

const DotGrid: React.FC = () => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
    <defs>
      <pattern id="dots" width={48} height={48} patternUnits="userSpaceOnUse">
        <circle cx={24} cy={24} r={2.2} fill={C.paper2} />
      </pattern>
    </defs>
    <rect width={1920} height={1080} fill="url(#dots)" />
  </svg>
);

// Fake clock: the film runs from 9:12 to 13:04 so "life got weird by lunch" is literally true by the last hook.
export const clockAt = (frame: number) => {
  const mins = 9 * 60 + 12 + (frame / DURATION) * (3 * 60 + 52);
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}`;
};

export const MenuBar: React.FC<{frame: number; title?: string}> = ({frame, title = 'Browser'}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: 1920,
      height: MENU_BAR_H,
      background: C.paper,
      borderBottom: outline(SHAPE.thin + 0.5),
      display: 'flex',
      alignItems: 'center',
      gap: 34,
      padding: '0 26px',
      fontFamily: FONT.display,
      fontWeight: 700,
      fontSize: 21,
      color: C.ink,
      boxSizing: 'border-box',
    }}
  >
    <div style={{width: 22, height: 22, borderRadius: 11, background: C.tangerine, border: outline(3)}} />
    <span style={{fontWeight: 900}}>{title}</span>
    <span>File</span>
    <span>Edit</span>
    <span>View</span>
    <span>Snacks</span>
    <div style={{flex: 1}} />
    <span style={{fontFamily: FONT.mono, fontWeight: 600}}>{clockAt(frame)}</span>
  </div>
);

// The glovebox icon at its home (or anywhere, for the intro drag).
export const DesktopIcon: React.FC<{x?: number; y?: number; pose?: number; scale?: number; selected?: boolean; label?: string}> = ({
  x = ICON_HOME.x,
  y = ICON_HOME.y,
  pose = 0,
  scale = 1,
  selected = false,
  label = ICON_LABEL,
}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${scale})`, textAlign: 'center'}}>
    <div
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: SHAPE.radius,
        background: selected ? C.fizz : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Glyph name="glovebox" size={ICON_SIZE * 0.86} pose={pose} />
    </div>
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: ICON_SIZE + 4,
        transform: 'translateX(-50%)',
        whiteSpace: 'nowrap',
        fontFamily: FONT.mono,
        fontWeight: 700,
        fontSize: 20,
        color: selected ? C.paper : C.ink,
        background: selected ? C.fizz : C.paper,
        padding: '2px 10px',
        borderRadius: SHAPE.radiusSmall,
      }}
    >
      {label}
    </div>
  </div>
);

export const Desktop: React.FC<{frame: number; showIcon?: boolean; iconPose?: number; menuTitle?: string; children?: React.ReactNode}> = ({
  frame,
  showIcon = true,
  iconPose = 0,
  menuTitle,
  children,
}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, background: C.paper, overflow: 'visible'}}>
    <DotGrid />
    {showIcon && <DesktopIcon pose={iconPose} />}
    {children}
    <MenuBar frame={frame} title={menuTitle} />
  </div>
);

// ------------------------------------------------------------------ windows

export const TrafficLights: React.FC = () => (
  <div style={{display: 'flex', gap: 10}}>
    {[C.tangerine, C.mustard, C.pickle].map((c) => (
      <div key={c} style={{width: 20, height: 20, borderRadius: 10, background: c, border: outline(3)}} />
    ))}
  </div>
);

// Generic app window (calendar, notes, anything a section invents). Title bar + body.
export const AppWindow: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  color?: ColorName; // title bar colour
  glyph?: GlyphName;
  rot?: number;
  scale?: number;
  children?: React.ReactNode;
  bodyStyle?: React.CSSProperties;
}> = ({x, y, w, h, title, color = 'paper2', glyph, rot = 0, scale = 1, children, bodyStyle}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      background: C.paper,
      border: outline(),
      borderRadius: SHAPE.radius,
      boxShadow: hardShadow(),
      overflow: 'hidden',
      transform: `rotate(${rot}deg) scale(${scale})`,
      transformOrigin: 'center',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div
      style={{
        height: 52,
        flex: '0 0 52px',
        background: C[color],
        borderBottom: outline(),
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 18px',
        fontFamily: FONT.display,
        fontWeight: 800,
        fontSize: 24,
        color: C.ink,
      }}
    >
      <TrafficLights />
      {glyph && <Glyph name={glyph} size={30} />}
      <span>{title}</span>
    </div>
    <div style={{position: 'relative', flex: 1, ...bodyStyle}}>{children}</div>
  </div>
);

// ------------------------------------------------------------------ tabs

export type TabSpec = {title: string; glyph?: GlyphName; color?: ColorName};

const FILLER: TabSpec[] = [
  {title: 'taxes (final) (2)', glyph: 'taxes'},
  {title: 'tacos near me', glyph: 'taco'},
  {title: 'is it bad if', glyph: 'phone'},
  {title: 'receipt scanner', glyph: 'receipt'},
  {title: 'how to fold a', glyph: 'laundry'},
  {title: 'aisle four map', glyph: 'cart'},
  {title: 'sauce, but more', glyph: 'sauce'},
  {title: 'fizz levels', glyph: 'cup'},
  {title: 'where are my keys', glyph: 'key'},
  {title: 'waffle weather', glyph: 'waffle'},
  {title: 'unread (412)', glyph: 'notebook'},
  {title: 'calendar', glyph: 'calendar'},
  {title: 'pickle facts', glyph: 'pickle'},
  {title: 'confetti, bulk', glyph: 'popper'},
  {title: 'dog translator', glyph: 'dog'},
  {title: 'boat out of boxes', glyph: 'box'},
];
// Deterministic filler tab i (for the tabs a section does not name itself).
export const fillerTab = (i: number): TabSpec => {
  const base = FILLER[i % FILLER.length];
  const colors: ColorName[] = ['tangerine', 'pickle', 'fizz', 'pink', 'mustard'];
  return {...base, color: colors[Math.floor(hash(91, i) * colors.length)]};
};

const TAB_H = 50;
// A single tab. Width decides what shows: >= 120 glyph + title, >= 34 glyph only, below that a sliver.
export const Tab: React.FC<{tab: TabSpec; width: number; active?: boolean; pop?: number}> = ({tab, width, active = false, pop = 1}) => {
  const bg = active ? C.tangerine : C.paper2;
  const showTitle = width >= 120;
  const showGlyph = width >= 34;
  return (
    <div
      style={{
        width,
        height: TAB_H,
        flex: `0 0 ${width}px`,
        boxSizing: 'border-box',
        background: bg,
        borderTop: outline(width < 14 ? 2 : 3),
        borderLeft: outline(width < 14 ? 1.5 : 3),
        borderRight: outline(width < 14 ? 1.5 : 3),
        borderRadius: `${Math.min(SHAPE.radiusSmall, width / 3)}px ${Math.min(SHAPE.radiusSmall, width / 3)}px 0 0`,
        marginRight: width < 14 ? 0 : -3,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: showTitle ? '0 12px' : 0,
        justifyContent: showTitle ? 'flex-start' : 'center',
        overflow: 'hidden',
        position: 'relative',
        transform: `scaleY(${pop})`,
        transformOrigin: 'bottom',
        zIndex: active ? 2 : 1,
      }}
    >
      {/* colour stripe so slivers still read as many different tabs */}
      {!active && tab.color && <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: Math.max(4, Math.min(8, width / 3)), background: C[tab.color]}} />}
      {showGlyph && tab.glyph && <Glyph name={tab.glyph} size={Math.min(30, width - 8)} />}
      {showTitle && (
        <span
          style={{
            fontFamily: FONT.mono,
            fontWeight: active ? 800 : 600,
            fontSize: 19,
            color: active ? C.ink : C.ink2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'clip',
          }}
        >
          {tab.title}
        </span>
      )}
    </div>
  );
};

// Tab bar. `count` total tabs; `named` supplies specific tabs (by index), the rest are fillers.
// mode 'flow': left to right, newest at the right. mode 'symmetric' (hooks): the active tab sits dead centre at
// `activeWidth`, the others split evenly on both sides as slivers.
export const TabBar: React.FC<{
  width: number;
  count: number;
  named?: Record<number, TabSpec>;
  active?: number;
  mode?: 'flow' | 'symmetric';
  activeWidth?: number;
  newestPop?: number; // 0..1 scale-in of the newest tab, for "tab pops in on the beat"
}> = ({width, count, named = {}, active = -1, mode = 'flow', activeWidth = 300, newestPop = 1}) => {
  const tabs = Array.from({length: count}, (_, i) => named[i] ?? fillerTab(i));
  if (mode === 'symmetric' && count > 0) {
    const others = count - 1;
    const left = Math.floor(others / 2);
    const right = others - left;
    const side = (width - activeWidth) / 2;
    const wl = left ? Math.min(240, side / left) : 0;
    const wr = right ? Math.min(240, side / right) : 0;
    const act = active >= 0 ? active : left;
    const order = [...tabs.slice(0, act), ...tabs.slice(act + 1)];
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'flex-end', width, height: TAB_H}}>
        <div style={{display: 'flex', justifyContent: 'flex-end', width: side}}>
          {order.slice(0, left).map((t, i) => (
            <Tab key={i} tab={t} width={wl} />
          ))}
        </div>
        <Tab tab={tabs[act]} width={activeWidth} active />
        <div style={{display: 'flex', width: side}}>
          {order.slice(left).map((t, i) => (
            <Tab key={i} tab={t} width={wr} />
          ))}
        </div>
      </div>
    );
  }
  const w = count ? Math.min(260, width / count) : 0;
  return (
    <div style={{display: 'flex', alignItems: 'flex-end', width, height: TAB_H, overflow: 'hidden'}}>
      {tabs.map((t, i) => (
        <Tab key={i} tab={t} width={w} active={i === active} pop={i === count - 1 ? newestPop : 1} />
      ))}
    </div>
  );
};

// Browser window: title strip with traffic lights + tab bar, address bar, content.
export const BrowserWindow: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  tabs: number;
  named?: Record<number, TabSpec>;
  active?: number;
  tabMode?: 'flow' | 'symmetric';
  activeWidth?: number;
  newestPop?: number;
  url?: string;
  rot?: number;
  scale?: number;
  contentBg?: string;
  children?: React.ReactNode;
}> = ({x, y, w, h, tabs, named, active, tabMode = 'flow', activeWidth, newestPop, url = 'confetti://glovebox', rot = 0, scale = 1, contentBg = C.paper, children}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      background: C.paper2,
      border: outline(),
      borderRadius: SHAPE.radius,
      boxShadow: hardShadow(),
      overflow: 'hidden',
      transform: `rotate(${rot}deg) scale(${scale})`,
      transformOrigin: 'center',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div style={{display: 'flex', alignItems: 'flex-end', height: 66, flex: '0 0 66px', padding: '0 0 0 18px', gap: 18}}>
      <div style={{paddingBottom: 15}}>
        <TrafficLights />
      </div>
      <TabBar width={w - 130} count={tabs} named={named} active={active} mode={tabMode} activeWidth={activeWidth} newestPop={newestPop} />
    </div>
    <div
      style={{
        height: 58,
        flex: '0 0 58px',
        background: C.tangerine === contentBg ? C.paper : C.paper,
        borderTop: outline(),
        borderBottom: outline(),
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 18px',
      }}
    >
      <span style={{fontFamily: FONT.display, fontWeight: 900, fontSize: 26, color: C.ink2}}>{'‹  ›  ↻'}</span>
      <div
        style={{
          flex: 1,
          height: 38,
          borderRadius: 19,
          border: outline(3),
          background: C.paper2,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          fontFamily: FONT.mono,
          fontWeight: 600,
          fontSize: 20,
          color: C.ink,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        {url}
      </div>
    </div>
    <div style={{position: 'relative', flex: 1, background: contentBg, overflow: 'hidden'}}>{children}</div>
  </div>
);
// Height of the browser chrome above the content area, for positioning things inside.
export const BROWSER_CHROME_H = 66 + 58;

// ------------------------------------------------------------------ cursor

export type CursorKind = 'arrow' | 'pointer' | 'grab' | 'grabbing' | 'wait';
// Cursor tip is at (x,y). `press` 0..1 shrinks it and shows a click ring.
export const Cursor: React.FC<{x: number; y: number; kind?: CursorKind; press?: number; scale?: number; frame?: number}> = ({
  x,
  y,
  kind = 'arrow',
  press = 0,
  scale = 1.6,
  frame = 0,
}) => {
  const s = scale * (1 - press * 0.15);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, zIndex: 50}}>
      {press > 0 && (
        <div
          style={{
            position: 'absolute',
            left: -30 - press * 24,
            top: -30 - press * 24,
            width: 60 + press * 48,
            height: 60 + press * 48,
            borderRadius: '50%',
            border: `${6 * (1 - press) + 1}px solid ${C.tangerine}`,
            opacity: 1 - press * 0.6,
          }}
        />
      )}
      <svg width={48 * s} height={48 * s} viewBox="0 0 48 48" style={{position: 'absolute', left: kind === 'arrow' ? 0 : -16 * s, top: kind === 'arrow' ? 0 : -6 * s, overflow: 'visible'}}>
        <g stroke={C.ink} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
          {kind === 'arrow' && <path d="M2 2 L2 36 L11 28 L18 43 L25 40 L18 25 L30 25Z" fill={press > 0.2 ? C.mustard : C.paper} />}
          {(kind === 'pointer' || kind === 'grab' || kind === 'grabbing') && (
            <path
              d={
                kind === 'grabbing'
                  ? 'M10 22 C10 16 18 16 18 20 C18 14 26 14 26 19 C26 14 34 14 34 20 C34 16 42 17 42 22 V32 C42 40 36 46 28 46 H22 C14 46 10 40 10 32Z'
                  : kind === 'grab'
                    ? 'M10 24 V12 C10 8 16 8 16 12 V20 V8 C16 4 22 4 22 8 V20 V8 C22 4 28 4 28 8 V20 V12 C28 8 34 8 34 12 V22 C36 20 42 22 40 28 L36 38 C34 44 30 46 24 46 H20 C14 46 10 42 10 36Z'
                    : 'M16 4 C16 0 22 0 22 4 V20 C22 16 28 16 28 20 C28 16 34 16 34 21 C34 17 40 18 40 23 V34 C40 42 34 46 28 46 H22 C14 46 10 40 8 36 L4 28 C2 24 8 22 10 26 L16 32Z'
              }
              fill={press > 0.2 ? C.mustard : C.paper}
            />
          )}
          {kind === 'wait' && (
            <g>
              <circle cx={20} cy={20} r={16} fill={C.paper} />
              <path d="M20 4 A16 16 0 0 1 36 20 L20 20Z" fill={C.tangerine} transform={`rotate(${(frame * 12) % 360} 20 20)`} />
              <path d="M20 36 A16 16 0 0 1 4 20 L20 20Z" fill={C.fizz} transform={`rotate(${(frame * 12) % 360} 20 20)`} />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};

// ------------------------------------------------------------------ pop-ups

// OS-style dialog. `enter` 0..1 scales it in from the centre with overshoot (pass popIn(...)).
export const Popup: React.FC<{
  x: number;
  y: number;
  w?: number;
  title: string;
  body: React.ReactNode;
  buttons?: string[];
  primary?: number;
  glyph?: GlyphName;
  enter?: number;
  rot?: number;
  color?: ColorName;
}> = ({x, y, w = 560, title, body, buttons = ['OK'], primary = buttons.length - 1, glyph, enter = 1, rot = 0, color = 'mustard'}) => {
  if (enter <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${enter})`,
        background: C.paper,
        border: outline(),
        borderRadius: SHAPE.radius,
        boxShadow: hardShadow(),
        overflow: 'hidden',
        zIndex: 40,
      }}
    >
      <div style={{background: C[color], borderBottom: outline(), padding: '10px 18px', fontFamily: FONT.display, fontWeight: 900, fontSize: 24, color: C.ink, display: 'flex', alignItems: 'center', gap: 10}}>
        <TrafficLights />
        <span>{title}</span>
      </div>
      <div style={{display: 'flex', gap: 18, padding: '22px 24px 12px', alignItems: 'center'}}>
        {glyph && <Glyph name={glyph} size={72} />}
        <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 26, lineHeight: 1.2, color: C.ink}}>{body}</div>
      </div>
      <div style={{display: 'flex', justifyContent: 'flex-end', gap: 14, padding: '10px 24px 22px'}}>
        {buttons.map((b, i) => (
          <div
            key={b}
            style={{
              padding: '8px 22px',
              borderRadius: SHAPE.radiusSmall,
              border: outline(3),
              background: i === primary ? C.tangerine : C.paper2,
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 22,
              color: C.ink,
              boxShadow: hardShadow(4),
            }}
          >
            {b}
          </div>
        ))}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ calendar app

export type CalEvent = {day: number; label: string; color?: ColorName};
// Month grid, 7 columns x 5 rows. Day 1 at column `startCol`. Section code layers boss-fight UI on top.
export const CalendarApp: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  month?: string;
  events?: CalEvent[];
  today?: number;
  startCol?: number;
  rot?: number;
  scale?: number;
  title?: string;
  children?: React.ReactNode;
}> = ({x, y, w, h, month = 'NOVEMBER', events = [], today = 16, startCol = 6, rot = 0, scale = 1, title = 'Calendar', children}) => {
  const cw = (w - 8) / 7;
  const head = 54;
  const ch = (h - 52 - head - 40) / 5;
  return (
    <AppWindow x={x} y={y} w={w} h={h} title={title} color="tangerine" glyph="calendar" rot={rot} scale={scale}>
      <div style={{height: head, display: 'flex', alignItems: 'center', padding: '0 20px', fontFamily: FONT.display, fontWeight: 900, fontStretch: '125%', fontSize: 34, color: C.ink}}>
        {month}
      </div>
      <div style={{display: 'flex', height: 40}}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} style={{width: cw, textAlign: 'center', fontFamily: FONT.mono, fontWeight: 700, fontSize: 18, color: C.ink2}}>
            {d}
          </div>
        ))}
      </div>
      <div style={{position: 'relative'}}>
        {Array.from({length: 35}, (_, k) => {
          const day = k - startCol + 1;
          const col = k % 7;
          const row = Math.floor(k / 7);
          const ev = events.filter((e) => e.day === day);
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: 4 + col * cw,
                top: row * ch,
                width: cw - 4,
                height: ch - 4,
                borderRadius: 6,
                border: `2px solid ${C.paper2}`,
                background: day === today ? C.mustard : C.paper,
                boxSizing: 'border-box',
                padding: 4,
                overflow: 'hidden',
              }}
            >
              {day >= 1 && day <= 30 && <div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 16, color: C.ink}}>{day}</div>}
              {ev.map((e, i) => (
                <div key={i} style={{marginTop: 3, borderRadius: 4, background: C[e.color ?? 'fizz'], border: outline(2), fontFamily: FONT.mono, fontSize: 13, fontWeight: 700, color: C.ink, padding: '1px 4px', whiteSpace: 'nowrap', overflow: 'hidden'}}>
                  {e.label}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {children}
    </AppWindow>
  );
};

// ------------------------------------------------------------------ notes app

export const NotesApp: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
  lines: string[];
  checked?: boolean[];
  visible?: number; // how many lines are written so far (for "typing" the list)
  rot?: number;
  scale?: number;
  children?: React.ReactNode;
}> = ({x, y, w, h, title = 'Notes', lines, checked = [], visible = lines.length, rot = 0, scale = 1, children}) => (
  <AppWindow x={x} y={y} w={w} h={h} title={title} color="mustard" glyph="notebook" rot={rot} scale={scale}>
    <div style={{padding: '18px 26px', background: C.paper, height: '100%', boxSizing: 'border-box'}}>
      {lines.slice(0, Math.ceil(visible)).map((l, i) => (
        <div key={i} style={{display: 'flex', alignItems: 'center', gap: 14, height: 50, borderBottom: `2px solid ${C.paper2}`}}>
          <div style={{width: 26, height: 26, borderRadius: 6, border: outline(3), background: checked[i] ? C.pickle : C.paper, flex: '0 0 26px'}} />
          <span style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 26, color: C.ink, textDecoration: checked[i] ? 'line-through' : 'none'}}>{l}</span>
        </div>
      ))}
    </div>
    {children}
  </AppWindow>
);

// ------------------------------------------------------------------ spinner

export const Spinner: React.FC<{x: number; y: number; size?: number; frame: number; label?: string}> = ({x, y, size = 160, frame, label}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', textAlign: 'center'}}>
    <Glyph name="spinner" size={size} pose={((frame / FPS) * 0.9) % 1} />
    {label && <div style={{marginTop: 14, fontFamily: FONT.mono, fontWeight: 700, fontSize: 26, color: C.ink}}>{label}</div>}
  </div>
);
