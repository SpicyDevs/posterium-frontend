const SECTION_STORAGE_KEY = 'posterium_section_states_v2';

const readSectionStates = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(SECTION_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

export const writeSectionState = (id: string, open: boolean) => {
  try {
    const s = readSectionStates();
    localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify({ ...s, [id]: open }));
  } catch {}
};

export const readSectionState = (id: string, fallback: boolean): boolean => {
  const states = readSectionStates();
  return id in states ? states[id] : fallback;
};
