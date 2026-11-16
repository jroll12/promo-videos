// PLACEHOLDER for the hook section. Replaced in Phase 2 by the section's own agent.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SectionProps} from '../../lib/sectionRoot';
import {useGlobalFrame, useSection} from '../../lib/context';
import {Camera, REST_POSE} from '../../lib/camera';
import {Desktop} from '../../lib/chrome';
import {ConfettiField, DebrisLayer} from '../../lib/confetti';
import {C, FONT} from '../../lib/theme';

const Section: React.FC<SectionProps> = ({id}) => {
  const frame = useGlobalFrame();
  const s = useSection();
  return (
    <AbsoluteFill>
      <Camera pose={REST_POSE}>
        <Desktop frame={frame} />
      </Camera>
      <DebrisLayer frame={frame} pose={REST_POSE} />
      <ConfettiField frame={frame} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FONT.display, fontWeight: 900, fontSize: 120, color: C.ink2}}>
        {id} {frame - s.startFrame}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
export default Section;
