import { addDays, differenceInCalendarDays, parseISO } from 'date-fns';
import { toISODate } from './dateHelpers';

const DEFAULT_CYCLE = 28;
const DEFAULT_PERIOD = 5;
const LUTEAL_PHASE = 14; // ovulation ≈ next start - 14

/**
 * Given the user's history of period starts (sorted asc, ISO strings),
 * compute an adaptive average cycle length. Falls back to defaults.
 * Uses the last 6 gaps and trims outliers > 45 or < 18 days.
 */
export function computeAverages(periods) {
  const starts = periods.map((p) => p.startDate).sort();
  if (starts.length < 2) {
    return { cycleLength: DEFAULT_CYCLE, periodLength: DEFAULT_PERIOD, samples: 0 };
  }
  const gaps = [];
  for (let i = 1; i < starts.length; i++) {
    const g = differenceInCalendarDays(parseISO(starts[i]), parseISO(starts[i - 1]));
    if (g >= 18 && g <= 45) gaps.push(g);
  }
  if (!gaps.length) return { cycleLength: DEFAULT_CYCLE, periodLength: DEFAULT_PERIOD, samples: 0 };
  const recent = gaps.slice(-6);
  const cycleLength = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);

  const durations = periods
    .filter((p) => p.endDate)
    .map((p) => differenceInCalendarDays(parseISO(p.endDate), parseISO(p.startDate)) + 1)
    .filter((d) => d >= 1 && d <= 10);
  const periodLength = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : DEFAULT_PERIOD;

  return { cycleLength, periodLength, samples: recent.length };
}

/**
 * Return prediction info for the current cycle:
 *   - lastPeriodStart (ISO or null)
 *   - nextPeriodStart (ISO or null)
 *   - ovulationDay (ISO or null)
 *   - fertileWindow: { start, end } (ISO or null)
 *   - cycleDay: current day within cycle (1-based) or null
 *   - averages: cycleLength, periodLength
 */
export function buildPrediction(periods, today = new Date()) {
  const { cycleLength, periodLength, samples } = computeAverages(periods);
  if (!periods.length) {
    return {
      lastPeriodStart: null,
      nextPeriodStart: null,
      ovulationDay: null,
      fertileWindow: null,
      cycleDay: null,
      averages: { cycleLength, periodLength, samples },
    };
  }
  const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const last = sorted[sorted.length - 1];
  const lastStart = parseISO(last.startDate);

  const nextStart = addDays(lastStart, cycleLength);
  const ovulation = addDays(nextStart, -LUTEAL_PHASE);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);

  const cycleDay = differenceInCalendarDays(today, lastStart) + 1;

  return {
    lastPeriodStart: last.startDate,
    nextPeriodStart: toISODate(nextStart),
    ovulationDay: toISODate(ovulation),
    fertileWindow: { start: toISODate(fertileStart), end: toISODate(fertileEnd) },
    cycleDay: cycleDay > 0 && cycleDay <= cycleLength * 2 ? cycleDay : null,
    averages: { cycleLength, periodLength, samples },
  };
}

/**
 * For a given date, classify it as: 'period', 'predicted-period', 'fertile',
 * 'ovulation', or null.
 */
export function classifyDate(dateISO, periods, prediction) {
  for (const p of periods) {
    if (p.endDate) {
      if (dateISO >= p.startDate && dateISO <= p.endDate) return 'period';
    } else if (dateISO === p.startDate) return 'period';
  }
  if (!prediction) return null;
  const { nextPeriodStart, ovulationDay, fertileWindow, averages } = prediction;
  if (nextPeriodStart) {
    const nps = parseISO(nextPeriodStart);
    const end = toISODate(addDays(nps, averages.periodLength - 1));
    if (dateISO >= nextPeriodStart && dateISO <= end) return 'predicted-period';
  }
  if (ovulationDay && dateISO === ovulationDay) return 'ovulation';
  if (fertileWindow && dateISO >= fertileWindow.start && dateISO <= fertileWindow.end) {
    return 'fertile';
  }
  return null;
}

/** Adaptive stats about the user's own cycle. */
export function computeStats(periods, dailyLogs) {
  const { cycleLength, periodLength, samples } = computeAverages(periods);
  const symptomCount = {};
  const moodCount = {};
  for (const log of dailyLogs) {
    if (log.mood) moodCount[log.mood] = (moodCount[log.mood] || 0) + 1;
    if (Array.isArray(log.symptoms)) {
      for (const s of log.symptoms) symptomCount[s] = (symptomCount[s] || 0) + 1;
    }
  }
  const topSymptoms = Object.entries(symptomCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, n]) => ({ name, count: n }));
  const topMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0];
  return {
    cycleLength,
    periodLength,
    samples,
    logsCount: dailyLogs.length,
    periodsCount: periods.length,
    topSymptoms,
    topMood: topMood ? { name: topMood[0], count: topMood[1] } : null,
  };
}
