import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePicker({ value, onChange, placeholder = 'Select Date', className = '', dense = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });
  
  // Track currently viewed month/year in the grid
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  const containerRef = useRef(null);

  // Sync state if value prop changes
  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setCurrentDate(parsed);
        setViewDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
      }
    }
  }, [value]);

  // Click outside detector
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Calendar logic helpers
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day) => {
    // Month is 0-indexed in JS Dates
    const selected = new Date(year, month, day);
    
    // Format to YYYY-MM-DD in local timezone (avoiding UTC shift)
    const formattedY = selected.getFullYear();
    const formattedM = String(selected.getMonth() + 1).padStart(2, '0');
    const formattedD = String(selected.getDate()).padStart(2, '0');
    const dateStr = `${formattedY}-${formattedM}-${formattedD}`;
    
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const isSelected = (day) => {
    if (!value) return false;
    return (
      currentDate.getDate() === day &&
      currentDate.getMonth() === month &&
      currentDate.getFullYear() === year
    );
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  // Generate grid days array
  const blanks = Array(firstDayIndex).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarCells = [...blanks, ...days];

  const displayDateString = value 
    ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Date Trigger Input */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-950 border border-slate-800 rounded-xl text-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/10 flex items-center justify-between cursor-pointer select-none ${dense ? 'py-2 px-3' : 'py-3.5 px-4'}`}
      >
        <div className="flex items-center space-x-2.5 flex-grow min-w-0">
          <Calendar className={`${dense ? 'w-3.5 h-3.5' : 'w-4 h-4'} flex-shrink-0 ${value ? 'text-brand-400' : 'text-slate-500'}`} />
          {value ? (
            <span className={`text-slate-200 font-semibold truncate ${dense ? 'text-xs' : 'text-sm'}`}>{displayDateString}</span>
          ) : (
            <span className={`text-slate-600 truncate ${dense ? 'text-xs' : 'text-sm'}`}>{placeholder}</span>
          )}
        </div>
        
        {value && (
          <button 
            type="button" 
            onClick={handleClear}
            className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Popover Calendar Card */}
      {isOpen && (
        <div className="absolute left-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 w-72 animate-fadeIn">
          {/* Header Controls */}
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white tracking-wide uppercase">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAY_NAMES.map((name) => (
              <span key={name} className="text-[10px] font-bold text-slate-500 uppercase py-0.5">
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {calendarCells.map((day, index) => {
              if (day === null) {
                return <div key={`blank-${index}`} className="aspect-square" />;
              }

              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`aspect-square rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    selected
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20 font-bold border border-brand-500'
                      : today
                      ? 'border border-brand-500/40 text-brand-400 hover:bg-slate-800'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
