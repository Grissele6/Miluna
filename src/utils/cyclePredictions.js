import { addDays, differenceInCalendarDays, parseISO } from 'date-fns';
import { toISODate } from './dateHelpers';

const DEFAULT_CYCLE = 28;
const DEFAULT_PERIOD = 5;
const LUTEAL_PHASE = 14;

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

/**
 * Pregnancy probability estimate for a given date.
 * Returns 'baja' | 'media' | 'alta' | null.
 * baja = safe range or period days; media = fertile edges; alta = ovulation ±1.
 */
export function pregnancyProbability(dateISO, periods, prediction) {
  if (!prediction || !prediction.ovulationDay) return null;
  const kind = classifyDate(dateISO, periods, prediction);
  if (kind === 'period' || kind === 'predicted-period') return 'baja';
  const ovul = parseISO(prediction.ovulationDay);
  const d = parseISO(dateISO);
  const diff = Math.abs(differenceInCalendarDays(d, ovul));
  if (diff <= 1) return 'alta';
  if (kind === 'fertile') return 'media';
  return 'baja';
}

/**
 * If a given date fell inside the fertile window and intercourse was
 * unprotected, return recommendation payload.
 */
export function unprotectedRiskInfo(dateISO, prediction) {
  if (!prediction || !prediction.fertileWindow) return null;
  const { fertileWindow, nextPeriodStart } = prediction;
  const inWindow = dateISO >= fertileWindow.start && dateISO <= fertileWindow.end;
  const probability = inWindow ? 'media/alta' : 'baja';
  // Suggested test date: expected next period + 1 day (first day of delay).
  const suggestTestDate = nextPeriodStart
    ? toISODate(addDays(parseISO(nextPeriodStart), 1))
    : null;
  return { inWindow, probability, suggestTestDate };
}

/** Adaptive stats about the user's own cycle. */
export function computeStats(periods, dailyLogs) {
  const { cycleLength, periodLength, samples } = computeAverages(periods);
  const symptomCount = {};
  const moodCount = {};
  for (const log of dailyLogs) {
    const moods = log.moods && log.moods.length ? log.moods : log.mood ? [log.mood] : [];
    for (const m of moods) moodCount[m] = (moodCount[m] || 0) + 1;
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
