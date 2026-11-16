// Stand-alone entry for the intro section: npx remotion still src/sections/intro/entry.ts intro out/intro.png --frame=N --scale=0.5
import {registerRoot} from 'remotion';
import {createElement} from 'react';
import {SectionComposition} from '../../lib/sectionRoot';
import Section from './Section';

registerRoot(() => createElement(SectionComposition, {id: 'intro', Comp: Section}));
