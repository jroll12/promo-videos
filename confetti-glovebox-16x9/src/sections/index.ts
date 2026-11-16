// Section registry for the master timeline. Each section id maps to the component that owns it.
import type {SectionId} from '../data/timing';
import type {SectionComponent} from '../lib/sectionRoot';
import Intro from './intro/Section';
import Verse1 from './verse1/Section';
import Hook from './hook/Section';
import Verse2 from './verse2/Section';
import Prehook from './prehook/Section';
import Bridge from './bridge/Section';
import Verse3 from './verse3/Section';
import Outro from './outro/Section';

export const SECTION_COMPONENTS: Record<SectionId, SectionComponent> = {
  intro: Intro,
  verse1: Verse1,
  hook1: Hook,
  verse2: Verse2,
  prehook: Prehook,
  hook2: Hook,
  bridge: Bridge,
  verse3: Verse3,
  hook3: Hook,
  outro: Outro,
};
