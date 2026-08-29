import { addDays, differenceInCalendarDays, parseISO } from 'date-fns';
import { toISODate } from './dateHelpers';

// Fruit/object comparisons across pregnancy weeks (approximate, obstetric).
// Kept in Chilean-neutral Spanish.
const FRUITS = {
  4: { name: 'una semilla de amapola', emoji: '🌱', sizeCm: 0.1 },
  5: { name: 'una semilla de manzana', emoji: '🍎', sizeCm: 0.2 },
  6: { name: 'una lenteja', emoji: '🫘', sizeCm: 0.5 },
  7: { name: 'un arándano', emoji: '🫐', sizeCm: 1.0 },
  8: { name: 'una frambuesa', emoji: '🍇', sizeCm: 1.6 },
  9: { name: 'una uva', emoji: '🍇', sizeCm: 2.3 },
  10: { name: 'una frutilla', emoji: '🍓', sizeCm: 3.1 },
  11: { name: 'una lima', emoji: '🫒', sizeCm: 4.1 },
  12: { name: 'un limón', emoji: '🍋', sizeCm: 5.4 },
  13: { name: 'un durazno', emoji: '🍑', sizeCm: 7.4 },
  14: { name: 'una naranja pequeña', emoji: '🍊', sizeCm: 8.7 },
  15: { name: 'una manzana', emoji: '🍎', sizeCm: 10.1 },
  16: { name: 'una palta', emoji: '🥑', sizeCm: 11.6 },
  17: { name: 'un nabo', emoji: '🥔', sizeCm: 13 },
  18: { name: 'un pimiento', emoji: '🫑', sizeCm: 14.2 },
  19: { name: 'un mango', emoji: '🥭', sizeCm: 15.3 },
  20: { name: 'un plátano', emoji: '🍌', sizeCm: 16.4 },
  21: { name: 'una zanahoria grande', emoji: '🥕', sizeCm: 26.7 },
  22: { name: 'una papaya', emoji: '🍈', sizeCm: 27.8 },
  23: { name: 'un mango grande', emoji: '🥭', sizeCm: 28.9 },
  24: { name: 'un choclo', emoji: '🌽', sizeCm: 30 },
  25: { name: 'una coliflor', emoji: '🥦', sizeCm: 34.6 },
  26: { name: 'una lechuga', emoji: '🥬', sizeCm: 35.6 },
  27: { name: 'una coliflor grande', emoji: '🥦', sizeCm: 36.6 },
  28: { name: 'una berenjena', emoji: '🍆', sizeCm: 37.6 },
  29: { name: 'una calabaza pequeña', emoji: '🎃', sizeCm: 38.6 },
  30: { name: 'un repollo', emoji: '🥬', sizeCm: 39.9 },
  31: { name: 'un coco', emoji: '🥥', sizeCm: 41.1 },
  32: { name: 'un melón chico', emoji: '🍈', sizeCm: 42.4 },
  33: { name: 'una piña', emoji: '🍍', sizeCm: 43.7 },
  34: { name: 'un melón', emoji: '🍈', sizeCm: 45 },
  35: { name: 'un melón grande', emoji: '🍈', sizeCm: 46.2 },
  36: { name: 'una papaya grande', emoji: '🍈', sizeCm: 47.4 },
  37: { name: 'una acelga', emoji: '🥬', sizeCm: 48.6 },
  38: { name: 'un puerro', emoji: '🥬', sizeCm: 49.8 },
  39: { name: 'una sandía chica', emoji: '🍉', sizeCm: 50.7 },
  40: { name: 'una sandía', emoji: '🍉', sizeCm: 51.2 },
};

const MIN_WEEK = 4;
const MAX_WEEK = 42;

/**
 * Compute pregnancy state from LMP (last menstrual period start).
 * Returns null if LMP is missing or in the future.
 */
export function buildPregnancyState(lmpISO, today = new Date()) {
  if (!lmpISO) return null;
  const lmp = parseISO(lmpISO);
  const days = differenceInCalendarDays(today, lmp);
  if (days < 0) return null;
  const totalWeeks = Math.floor(days / 7);
  const extraDays = days % 7;
  const dueDate = addDays(lmp, 280); // 40 weeks
  const clampedWeek = Math.min(MAX_WEEK, Math.max(0, totalWeeks));
  const fruitWeek = Math.min(MAX_WEEK, Math.max(MIN_WEEK, clampedWeek));
  const fruit = FRUITS[fruitWeek] || null;
  return {
    lmp: lmpISO,
    week: clampedWeek,
    daysIntoWeek: extraDays,
    dueDate: toISODate(dueDate),
    trimester: clampedWeek < 13 ? 1 : clampedWeek < 27 ? 2 : 3,
    fruit,
  };
}

/**
 * Progress scale (0..1) used by the growing-baby SVG.
 */
export function growthProgress(week) {
  if (!week) return 0;
  const w = Math.max(MIN_WEEK, Math.min(MAX_WEEK, week));
  return (w - MIN_WEEK) / (MAX_WEEK - MIN_WEEK);
}
