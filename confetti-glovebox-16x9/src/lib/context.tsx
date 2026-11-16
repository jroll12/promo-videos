// Section context: lets section code ask for the GLOBAL frame while mounted inside a <Sequence>, and carries the
// showLyrics switch (validation renders set it false so stills cannot leak lyric text to the blind reviewer).
import React, {createContext, useContext} from 'react';
import {getInputProps, useCurrentFrame} from 'remotion';
import {Section, SectionId, section as sectionOf} from '../data/timing';

type Ctx = {section: Section; showLyrics: boolean};
const SectionCtx = createContext<Ctx | null>(null);

export const showLyricsFromProps = () => {
  const p = getInputProps() as {showLyrics?: boolean};
  return p.showLyrics !== false;
};

export const SectionProvider: React.FC<{id: SectionId; showLyrics?: boolean; children: React.ReactNode}> = ({id, showLyrics, children}) => (
  <SectionCtx.Provider value={{section: sectionOf(id), showLyrics: showLyrics ?? showLyricsFromProps()}}>{children}</SectionCtx.Provider>
);

export const useSection = () => {
  const c = useContext(SectionCtx);
  if (!c) throw new Error('useSection outside SectionProvider');
  return c.section;
};
export const useShowLyrics = () => useContext(SectionCtx)?.showLyrics ?? showLyricsFromProps();

// Global frame inside a section's <Sequence>. Use this for every timing lookup.
export const useGlobalFrame = () => {
  const local = useCurrentFrame();
  const c = useContext(SectionCtx);
  return local + (c ? c.section.startFrame : 0);
};
