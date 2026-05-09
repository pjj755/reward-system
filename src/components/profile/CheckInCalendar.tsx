'use client';

import { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns';

interface CheckInCalendarProps {
  checkinDates: string[];
  currentStreak: number;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CheckInCalendar({ checkinDates, currentStreak }: CheckInCalendarProps) {
  const [displayedMonth, setDisplayedMonth] = useState(new Date());

  const parsedCheckinDates = checkinDates.map(parseISO);

  const monthStart = startOfMonth(displayedMonth);
  const monthEnd = endOfMonth(displayedMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const isCheckedIn = (day: Date) =>
    parsedCheckinDates.some((d) => isSameDay(d, day));

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="gradient-text font-semibold text-lg">
            {format(displayedMonth, 'MMMM yyyy')}
          </h3>
          <span className="text-white/50 text-sm">
            {currentStreak} day streak
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDisplayedMonth((m) => subMonths(m, 1))}
            className="text-white/40 hover:text-white transition-colors p-1"
            aria-label="Previous month"
          >
            &#8249;
          </button>
          <button
            onClick={() => setDisplayedMonth((m) => addMonths(m, 1))}
            className="text-white/40 hover:text-white transition-colors p-1"
            aria-label="Next month"
          >
            &#8250;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-white/30 text-xs font-medium py-1"
          >
            {label}
          </div>
        ))}

        {days.map((day) => {
          const inMonth = isSameMonth(day, displayedMonth);
          const checkedIn = inMonth && isCheckedIn(day);
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={[
                'flex items-center justify-center h-9 rounded-lg text-sm select-none',
                !inMonth && 'text-white/20',
                inMonth && !checkedIn && 'text-white/50',
                checkedIn &&
                  'bg-moon-500/20 border border-moon-500/40 text-moon-400 shadow-[0_0_8px_rgba(234,179,8,0.2)]',
                today && 'ring-1 ring-white/30',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
}
