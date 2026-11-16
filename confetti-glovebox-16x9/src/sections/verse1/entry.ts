// Stand-alone entry for the verse1 section: npx remotion still src/sections/verse1/entry.ts verse1 out/verse1.png --frame=N --scale=0.5
import {registerRoot} from 'remotion';
import {createElement} from 'react';
import {SectionComposition} from '../../lib/sectionRoot';
import Section from './Section';

registerRoot(() => createElement(SectionComposition, {id: 'verse1', Comp: Section}));
