// Master composition: every section on the global timeline, one audio track for the whole song.
import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {AUDIO_FILE, SECTIONS} from './data/timing';
import {MountedSection} from './lib/sectionRoot';
import {SECTION_COMPONENTS} from './sections';
import {C} from './lib/theme';

export const Video: React.FC = () => (
  <AbsoluteFill style={{background: C.paper2}}>
    {SECTIONS.map((s) => (
      <MountedSection key={s.id} id={s.id} Comp={SECTION_COMPONENTS[s.id]} />
    ))}
    <Audio src={staticFile(AUDIO_FILE)} />
  </AbsoluteFill>
);
