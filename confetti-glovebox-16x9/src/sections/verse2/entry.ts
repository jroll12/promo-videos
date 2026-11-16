// Stand-alone entry for the verse2 section: npx remotion still src/sections/verse2/entry.ts verse2 out/verse2.png --frame=N --scale=0.5
import {registerRoot} from 'remotion';
import {createElement} from 'react';
import {SectionComposition} from '../../lib/sectionRoot';
import Section from './Section';

registerRoot(() => createElement(SectionComposition, {id: 'verse2', Comp: Section}));
