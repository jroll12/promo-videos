// Stand-alone entry for the hook (one component, three uses): compositions hook1, hook2, hook3.
//   npx remotion still src/sections/hook/entry.ts hook3 out/hook3.png --frame=N --scale=0.5
import {registerRoot} from 'remotion';
import {createElement, Fragment} from 'react';
import {SectionComposition} from '../../lib/sectionRoot';
import Section from './Section';

registerRoot(() =>
  createElement(
    Fragment,
    null,
    createElement(SectionComposition, {id: 'hook1', Comp: Section}),
    createElement(SectionComposition, {id: 'hook2', Comp: Section}),
    createElement(SectionComposition, {id: 'hook3', Comp: Section}),
  ),
);
