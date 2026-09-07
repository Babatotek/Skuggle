import type { ScoreRow } from './types';
export function validScore(value: string, maximum: number): boolean { return value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= maximum); }
export function pasteScores(rows: ScoreRow[], start: number, text: string, maximum: number): ScoreRow[] {
  const values = text.trimEnd().split(/\r?\n/).map(line => line.split('\t')[0].trim());
  if (start + values.length > rows.length) throw new Error('The pasted scores exceed the remaining roster.');
  if (values.some(v => !validScore(v, maximum))) throw new Error(`Every pasted score must be between 0 and ${maximum}.`);
  return rows.map((row, i) => i < start || i >= start + values.length ? row : { ...row, score: values[i - start] === '' ? null : Number(values[i - start]), state: values[i - start] === '' ? 'NOT_ENTERED' : 'ENTERED' });
}
