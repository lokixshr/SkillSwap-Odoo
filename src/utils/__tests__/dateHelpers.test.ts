import { describe, it, expect } from 'vitest';
import { isSameDay, categorizeSessions } from '@/utils/dateHelpers';
import type { Session } from '@/lib/database';
import { Timestamp } from 'firebase/firestore';

const ts = (d: Date) => Timestamp.fromDate(d);

const makeSession = (id: string, when: Date): Session => ({
  id,
  organizerId: 'u1',
  participantId: 'u2',
  organizerName: 'A',
  participantName: 'B',
  skillName: 'Test',
  sessionType: 'video',
  scheduledDate: ts(when),
  duration: 60,
  status: 'confirmed',
  createdAt: ts(new Date()),
  updatedAt: ts(new Date()),
});

describe('dateHelpers', () => {
  it('isSameDay returns true for same calendar day and false otherwise', () => {
    const base = new Date('2025-01-15T10:00:00Z');
    const sameDayLater = new Date('2025-01-15T23:59:59Z');
    const nextDay = new Date('2025-01-16T00:00:00Z');

    expect(isSameDay(base, sameDayLater)).toBe(true);
    expect(isSameDay(base, nextDay)).toBe(false);
  });

  it('categorizeSessions splits into previous/current/next correctly', () => {
    const now = new Date('2025-02-01T12:00:00Z');
    const prev = makeSession('prev', new Date('2025-01-31T12:00:00Z'));
    const curA = makeSession('curA', new Date('2025-02-01T00:10:00Z'));
    const curB = makeSession('curB', new Date('2025-02-01T23:59:00Z'));
    const next = makeSession('next', new Date('2025-02-02T01:00:00Z'));

    const { previous, current, next: nextList } = categorizeSessions([prev, curA, curB, next], now);

    expect(previous.map(s => s.id)).toEqual(['prev']);
    expect(current.map(s => s.id).sort()).toEqual(['curA', 'curB']);
    expect(nextList.map(s => s.id)).toEqual(['next']);
  });
});
