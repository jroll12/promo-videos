import React from 'react';
import {Composition} from 'remotion';
import {DURATION, FPS} from './data/timing';
import {loadFonts} from './lib/fonts';
import {SectionProvider} from './lib/context';
import {Video} from './Video';
import {TESTCARD_FRAMES, TestCardWithAudio} from './testcard/TestCard';
import {MuralCheck} from './testcard/MuralCheck';

const TestCardRoot: React.FC = () => (
  <SectionProvider id="hook1">
    <TestCardWithAudio />
  </SectionProvider>
);

export const Root: React.FC = () => {
  loadFonts();
  return (
    <>
      <Composition id="Video" component={Video} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} defaultProps={{}} />
      <Composition id="TestCard" component={TestCardRoot} durationInFrames={TESTCARD_FRAMES} fps={FPS} width={1920} height={1080} />
      <Composition
        id="MuralCheck"
        component={() => (
          <SectionProvider id="hook3">
            <MuralCheck />
          </SectionProvider>
        )}
        durationInFrames={411}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
