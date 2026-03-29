'use client';

import { useState, useMemo } from 'react';

interface BookedRange {
  checkIn: string;
  checkOut: string;
}

interface Props {
  bookedDates: BookedRange[];
  checkIn: string;
  checkOut: string;
  onSelectCheckIn: (date: string) => void;
  onSelectCheckOut: (date: string) => void;
}

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const DAY_NAMES = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function isBooked(dateStr: string, bookedDates: BookedRange[]): boolean {
  return bookedDates.some(b => dateStr >= b.checkIn && dateStr < b.checkOut);
}

function isInSelectedRange(dateStr: string, checkIn: string, checkOut: string): boolean {
  if (!checkIn || !checkOut) return false;
  return dateStr >= checkIn && dateStr < checkOut;
}

function isCheckInDate(dateStr: string, checkIn: string): boolean {
  return dateStr === checkIn;
}

function isCheckOutDate(dateStr: string, checkOut: string): boolean {
  return dateStr === checkOut;
}

export default function BookingCalendar({ bookedDates, checkIn, checkOut, onSelectCheckIn, onSelectCheckOut }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // selecting: 'checkIn' means next click sets check-in, 'checkOut' means next click sets check-out
  const [selecting, setSelecting] = useState<'checkIn' | 'checkOut'>(checkIn ? 'checkOut' : 'checkIn');

  const prevMonth = () => {
    setViewDate(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setViewDate(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  // Can't go before current month
  const canGoPrev = viewDate.year > today.getFullYear() ||
    (viewDate.year === today.getFullYear() && viewDate.month > today.getMonth());

  const calendarDays = useMemo(() => {
    const { year, month } = viewDate;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday=0 start
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [viewDate]);

  const handleDayClick = (day: number) => {
    const dateStr = toDateStr(viewDate.year, viewDate.month, day);

    // Can't select past dates
    if (dateStr < todayStr) return;
    // Can't select booked dates
    if (isBooked(dateStr, bookedDates)) return;

    if (selecting === 'checkIn') {
      onSelectCheckIn(dateStr);
      onSelectCheckOut('');
      setSelecting('checkOut');
    } else {
      // checkOut must be after checkIn
      if (checkIn && dateStr <= checkIn) {
        // If clicked before check-in, reset and use as new check-in
        onSelectCheckIn(dateStr);
        onSelectCheckOut('');
        setSelecting('checkOut');
        return;
      }

      // Check if any booked date falls between checkIn and this date
      if (checkIn) {
        const hasBlockedBetween = bookedDates.some(b =>
          b.checkIn > checkIn && b.checkIn < dateStr
        );
        if (hasBlockedBetween) {
          // Reset - can't span across a booked range
          onSelectCheckIn(dateStr);
          onSelectCheckOut('');
          setSelecting('checkOut');
          return;
        }
      }

      onSelectCheckOut(dateStr);
      setSelecting('checkIn');
    }
  };

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {MONTH_NAMES[viewDate.month]} {viewDate.year}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-full hover:bg-gray-100 transition"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const dateStr = toDateStr(viewDate.year, viewDate.month, day);
          const isPast = dateStr < todayStr;
          const booked = isBooked(dateStr, bookedDates);
          const isSelected = isCheckInDate(dateStr, checkIn) || isCheckOutDate(dateStr, checkOut);
          const inRange = isInSelectedRange(dateStr, checkIn, checkOut);
          const disabled = isPast || booked;

          let cellClass = 'aspect-square flex items-center justify-center text-xs rounded-full relative transition-all ';

          if (isSelected) {
            cellClass += 'bg-gold-500 text-white font-bold cursor-pointer ';
          } else if (booked) {
            cellClass += 'bg-red-100 text-red-400 line-through cursor-not-allowed ';
          } else if (inRange) {
            cellClass += 'bg-gold-100 text-gold-700 font-medium cursor-pointer ';
          } else if (isPast) {
            cellClass += 'text-gray-300 cursor-not-allowed ';
          } else {
            cellClass += 'text-gray-700 hover:bg-gray-100 cursor-pointer font-medium ';
          }

          return (
            <button
              key={dateStr}
              onClick={() => !disabled && handleDayClick(day)}
              disabled={disabled}
              className={cellClass}
              title={booked ? 'Bu tarih dolu' : isPast ? 'Geçmiş tarih' : ''}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gold-500" />
          <span className="text-[10px] text-gray-500">Seçili</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gold-100" />
          <span className="text-[10px] text-gray-500">Aralık</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-100" />
          <span className="text-[10px] text-gray-500">Dolu</span>
        </div>
      </div>

      {/* Selection info */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setSelecting('checkIn')}
          className={`text-left px-3 py-2 rounded-lg border text-sm transition ${
            selecting === 'checkIn' ? 'border-gold-500 bg-gold-50' : 'border-gray-200'
          }`}
        >
          <span className="block text-[10px] font-medium text-gray-500">Giriş</span>
          <span className={`block font-medium ${checkIn ? 'text-gray-900' : 'text-gray-400'}`}>
            {checkIn ? new Date(checkIn + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : 'Tarih seçin'}
          </span>
        </button>
        <button
          onClick={() => { if (checkIn) setSelecting('checkOut'); }}
          className={`text-left px-3 py-2 rounded-lg border text-sm transition ${
            selecting === 'checkOut' ? 'border-gold-500 bg-gold-50' : 'border-gray-200'
          }`}
        >
          <span className="block text-[10px] font-medium text-gray-500">Çıkış</span>
          <span className={`block font-medium ${checkOut ? 'text-gray-900' : 'text-gray-400'}`}>
            {checkOut ? new Date(checkOut + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : 'Tarih seçin'}
          </span>
        </button>
      </div>
    </div>
  );
}
