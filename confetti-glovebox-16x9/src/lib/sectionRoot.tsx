// Shared plumbing for mounting a section, both in the master <Video> and in each section's own entry point
// (src/sections/<id>/entry.ts), so a section can be previewed and rendered on its own.
import React from 'react';
import {AbsoluteFill, Audio, Composition, Sequence, staticFile} from 'remotion';
import {AUDIO_FILE, FPS, SectionId, section} from '../data/timing';
import {SectionProvider} from './context';
import {loadFonts} from './fonts';
import {C} from './theme';

export type SectionProps = {id: SectionId};
export type SectionComponent = React.FC<SectionProps>;

// One section inside the master timeline.
export const MountedSection: React.FC<{id: SectionId; Comp: SectionComponent}> = ({id, Comp}) => {
  const s = section(id);
  return (
    <Sequence from={s.startFrame} durationInFrames={s.endFrame - s.startFrame} name={id}>
      <SectionProvider id={id}>
        <Comp id={id} />
      </SectionProvider>
    </Sequence>
  );
};

// A composition that shows just one section, with the song trimmed to match. Used by section entry points.
export const SectionComposition: React.FC<{id: SectionId; Comp: SectionComponent}> = ({id, Comp}) => {
  loadFonts();
  const s = section(id);
  const Inner: React.FC = () => (
    <AbsoluteFill style={{background: C.paper2}}>
      <SectionProvider id={id}>
        <Comp id={id} />
      </SectionProvider>
      <Audio src={staticFile(AUDIO_FILE)} trimBefore={s.startFrame} />
    </AbsoluteFill>
  );
  return <Composition id={id} component={Inner} durationInFrames={s.endFrame - s.startFrame} fps={FPS} width={1920} height={1080} />;
};
