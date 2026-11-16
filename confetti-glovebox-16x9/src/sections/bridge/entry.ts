// Stand-alone entry for the bridge section: npx remotion still src/sections/bridge/entry.ts bridge out/bridge.png --frame=N --scale=0.5
import {registerRoot} from 'remotion';
import {createElement} from 'react';
import {SectionComposition} from '../../lib/sectionRoot';
import Section from './Section';

registerRoot(() => createElement(SectionComposition, {id: 'bridge', Comp: Section}));
