import type { Session } from '@/lib/database';

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export interface CategorizedSessions {
  previous: Session[];
  current: Session[];
  next: Session[];
}

export const categorizeSessions = (sessions: Session[], now: Date = new Date()): CategorizedSessions => {
  const previous: Session[] = [];
  const current: Session[] = [];
  const next: Session[] = [];

  sessions.forEach((s) => {
    const dt = s.scheduledDate.toDate();
    if (dt < now) {
      previous.push(s);
    } else if (isSameDay(dt, now)) {
      current.push(s);
    } else {
      next.push(s);
    }
  });

  return { previous, current, next };
};
