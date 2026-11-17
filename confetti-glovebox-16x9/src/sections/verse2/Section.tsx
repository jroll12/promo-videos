// VERSE 2 (bars 30-45): a fresh browser window whose tabs multiply 2 -> 96. Every tab is a scene for a lyric gag.
// Literal gags: spoon in the pencil drawer (v2.01), one plan then twelve more (v2.02), a sneeze through a library
// (v2.07), three missed calls from an unknown zone (v2.11), and the centrepiece: the Calendar app as an RPG boss
// fight with a tangerine as the only weapon (v2.12-v2.13). Between gags the camera jump-cuts on beats over the tabs.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SectionProps} from '../../lib/sectionRoot';
import {useGlobalFrame} from '../../lib/context';
import {Camera, WhipLines, toScreen} from '../../lib/camera';
import {BrowserWindow, Desktop, fillerTab} from '../../lib/chrome';
import {ConfettiBurst, ConfettiField, DebrisLayer} from '../../lib/confetti';
import {KineticLine} from '../../lib/type';
import {popIn, beatIndex} from '../../lib/motion';
import {tabCountAt, VERSE_WINDOW} from '../../data/contract';
import {frameOfBeat, line} from '../../data/timing';
import {CUE, NAMED} from './cues';
import {cameraAt, BOSS_HIT_WORLD} from './shots';
import {DrawerPage, LibraryPage, PhonePage, PlansPage, TabPage} from './pages';
import {BossPage} from './BossFight';

const URL: Record<string, string> = {
  drawer: 'confetti://desk/pencil-drawer',
  plans: 'notes://plan.txt',
  library: 'confetti://library/quiet-floor',
  phone: 'phone://missed-calls?zone=unknown',
  boss: 'calendar://november?mode=boss',
};

const Section: React.FC<SectionProps> = () => {
  const frame = useGlobalFrame();
  const cam = cameraAt(frame);
  const count = tabCountAt(frame);
  const scene = cam.shot.scene;
  const active = cam.shot.tab < 0 || cam.shot.tab >= count ? count - 1 : cam.shot.tab;
  const fb = frameOfBeat(beatIndex(frame));
  const newestPop = tabCountAt(fb) > tabCountAt(fb - 1) ? popIn(frame, fb, 6) : 1;
  const spec = NAMED[active] ?? fillerTab(active);

  let page: React.ReactNode;
  if (scene === 'drawer') page = <DrawerPage frame={frame} />;
  else if (scene === 'plans') page = <PlansPage frame={frame} />;
  else if (scene === 'library') page = <LibraryPage frame={frame} />;
  else if (scene === 'phone') page = <PhonePage frame={frame} />;
  else if (scene === 'boss') page = <BossPage frame={frame} />;
  else page = <TabPage tab={spec} index={active} count={count} />;
  const url = URL[scene] ?? `confetti://tab/${active + 1}-of-${count}`;
  const hitScreen = toScreen(cam.pose, BOSS_HIT_WORLD.x, BOSS_HIT_WORLD.y);

  return (
    <AbsoluteFill>
      <Camera pose={cam.pose} blur={cam.blur}>
        <Desktop frame={frame}>
          <BrowserWindow {...VERSE_WINDOW} tabs={count} named={NAMED} active={active} newestPop={newestPop} url={url}>
            {page}
          </BrowserWindow>
        </Desktop>
      </Camera>
      <DebrisLayer frame={frame} pose={cam.pose} />
      {/* punchline cards only (5 of 17 lines) */}
      <KineticLine line={line('v2.04')} frame={frame} y={950} size={58} rot={-2} />
      <KineticLine line={line('v2.06')} frame={frame} x={1320} y={820} size={96} rot={5} card="paper" />
      <KineticLine line={line('v2.09')} frame={frame} y={950} size={58} rot={2} />
      <KineticLine line={line('v2.14')} frame={frame} y={985} size={54} rot={-2} />
      <KineticLine line={line('v2.17')} frame={frame} y={930} size={70} rot={-1.5} />
      <ConfettiField frame={frame} />
      <ConfettiBurst frame={frame} at={CUE.hit} x={hitScreen.x} y={hitScreen.y} count={60} power={0.7} life={30} seed={212} />
      <WhipLines amount={cam.amount} angle={cam.angle} seed={beatIndex(frame)} />
    </AbsoluteFill>
  );
};
export default Section;
