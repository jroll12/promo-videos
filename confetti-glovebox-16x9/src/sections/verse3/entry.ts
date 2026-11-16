// Stand-alone entry for the verse3 section: npx remotion still src/sections/verse3/entry.ts verse3 out/verse3.png --frame=N --scale=0.5
import {registerRoot} from 'remotion';
import {createElement} from 'react';
import {SectionComposition} from '../../lib/sectionRoot';
import Section from './Section';

registerRoot(() => createElement(SectionComposition, {id: 'verse3', Comp: Section}));
