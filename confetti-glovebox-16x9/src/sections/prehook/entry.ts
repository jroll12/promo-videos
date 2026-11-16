// Stand-alone entry for the prehook section: npx remotion still src/sections/prehook/entry.ts prehook out/prehook.png --frame=N --scale=0.5
import {registerRoot} from 'remotion';
import {createElement} from 'react';
import {SectionComposition} from '../../lib/sectionRoot';
import Section from './Section';

registerRoot(() => createElement(SectionComposition, {id: 'prehook', Comp: Section}));
