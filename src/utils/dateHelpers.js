import {
  format,
  parseISO,
  addDays,
  differenceInCalendarDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
} from 'date-fns';
import { es } from 'date-fns/locale';

export const toISODate = (d) => format(d, 'yyyy-MM-dd');
export const parseDate = (s) => parseISO(s);
export const fmtLong = (d) => format(d, "EEEE d 'de' MMMM", { locale: es });
export const fmtMonthYear = (d) => format(d, 'MMMM yyyy', { locale: es });
export const fmtShort = (d) => format(d, "d 'de' MMM", { locale: es });

export {
  addDays,
  differenceInCalendarDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
};
