// Dev composition: the final pull-back and mural formation over the end of hook 3, with the real ledger.
// Shows what the hook agent's final bars must hand to the outro. Not part of the film.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useGlobalFrame} from '../lib/context';
import {Camera, REST_POSE} from '../lib/camera';
import {Desktop} from '../lib/chrome';
import {DebrisLayer} from '../lib/confetti';
import {MURAL_POSE, lerpPose, pullbackAt} from '../data/contract';
import {C} from '../lib/theme';

export const MuralCheck: React.FC = () => {
  const frame = useGlobalFrame();
  const pose = lerpPose(REST_POSE, MURAL_POSE, pullbackAt(frame));
  return (
    <AbsoluteFill style={{background: C.paper2}}>
      <Camera pose={pose}>
        <Desktop frame={frame} />
      </Camera>
      <DebrisLayer frame={frame} pose={pose} />
    </AbsoluteFill>
  );
};
