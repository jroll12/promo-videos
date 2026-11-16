// Stand-alone entry for the outro section: npx remotion still src/sections/outro/entry.ts outro out/outro.png --frame=N --scale=0.5
import {registerRoot} from 'remotion';
import {createElement} from 'react';
import {SectionComposition} from '../../lib/sectionRoot';
import Section from './Section';

registerRoot(() => createElement(SectionComposition, {id: 'outro', Comp: Section}));
