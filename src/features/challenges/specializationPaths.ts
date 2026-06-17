export const SPECIALIZATION_PATHS = [
  {
    description: 'Deep work, clarity, and deliberate attention.',
    id: 'Focus',
  },
  {
    description: 'Training, recovery, and strong physical upkeep.',
    id: 'Health',
  },
  {
    description: 'Learning, skill-building, and steady improvement.',
    id: 'Growth',
  },
  {
    description: 'Consistency, structure, and disciplined execution.',
    id: 'Discipline',
  },
  {
    description: 'Pressure, bravery, and hard things done on purpose.',
    id: 'Courage',
  },
] as const;

export type SpecializationPath = (typeof SPECIALIZATION_PATHS)[number]['id'];

export function isSpecializationPath(value: string | null | undefined): value is SpecializationPath {
  return SPECIALIZATION_PATHS.some((path) => path.id === value);
}
