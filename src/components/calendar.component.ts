// FIX: Add ChangeDetectionStrategy for OnPush.
import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchedulerService, DayType } from '../services/scheduler.service';
import { format, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, isWeekend } from 'date-fns';

@Component({
  selector: 'app-calendar-mgr',
  imports: [CommonModule],
  // FIX: Add ChangeDetectionStrategy.OnPush for performance benefits.
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">Exceptions & Holidays</h2>
        
        <div class="flex items-center gap-4">
           <div class="flex gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-red-100 border border-red-300"></span> Holiday</span>
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-blue-100 border border-blue-300"></span> PD Day</span>
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-amber-100 border border-amber-300"></span> Exam</span>
           </div>
           <div class="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
             <button (click)="prevMonth()" class="p-1 hover:bg-white dark:hover:bg-slate-600 rounded-md shadow-sm transition-all"><svg class="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg></button>
             <span class="px-4 font-semibold text-slate-700 dark:text-slate-200 w-32 text-center">{{ monthLabel() }}</span>
             <button (click)="nextMonth()" class="p-1 hover:bg-white dark:hover:bg-slate-600 rounded-md shadow-sm transition-all"><svg class="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg></button>
           </div>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1 mb-2 text-center">
        @for(day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; track day) {
          <div class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-2">{{ day }}</div>
        }
      </div>

      <div class="grid grid-cols-7 gap-1">
        @for (day of calendarDays(); track day.dateStr) {
          <div 
             (click)="onDayClick(day.dateStr)"
             class="h-24 border rounded-lg p-2 cursor-pointer transition-all relative group
             {{ day.isWeekend ? 'bg-slate-100 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500' : (!day.isCurrentMonth ? 'bg-slate-50 text-slate-300 dark:bg-slate-900/40 dark:text-slate-600' : 'bg-white dark:bg-slate-800') }}
             {{ getStyle(day.dateStr) }}"
          >
             <div class="flex justify-between items-start">
               <span class="text-sm font-medium {{ isToday(day.date) ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : '' }}">
                 {{ day.dayNum }}
               </span>
             </div>
             
             <!-- Status Badge -->
             @if(getType(day.dateStr); as type) {
               @if(type !== 'School') {
                 <div class="mt-2 text-xs px-2 py-1 rounded-md font-medium truncate
                    {{ type === 'Holiday' ? 'bg-red-100 text-red-700' : '' }}
                    {{ type === 'PD' ? 'bg-blue-100 text-blue-700' : '' }}
                    {{ type === 'Exam' ? 'bg-amber-100 text-amber-700' : '' }}
                 ">
                   {{ type }}
                 </div>
               }
             }
             
             <!-- Hover Action Hint -->
             <div class="absolute inset-0 bg-slate-900/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <span class="text-xs font-bold text-slate-600 bg-white/90 dark:text-slate-200 dark:bg-slate-700/90 px-2 py-1 rounded shadow-sm">Click to Cycle</span>
             </div>
          </div>
        }
      </div>
      
      <p class="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
        Click a date repeatedly to toggle between: School -> Holiday -> PD -> Exam -> School
      </p>
    </div>
  `
})
export class CalendarComponent {
  sched = inject(SchedulerService);
  viewDate = signal(new Date());

  monthLabel = computed(() => format(this.viewDate(), 'MMMM yyyy'));

  calendarDays = computed(() => {
    // Manually get start of month to avoid missing 'startOfMonth' export
    const current = this.viewDate();
    const start = new Date(current.getFullYear(), current.getMonth(), 1);
    
    const end = endOfMonth(this.viewDate());
    // Get start of week (Sunday)
    const startDate = new Date(start);
    startDate.setDate(start.getDate() - start.getDay());
    
    // Get end of week (Saturday) of the last week
    const endDate = new Date(end);
    endDate.setDate(end.getDate() + (6 - end.getDay()));

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return days.map(d => ({
      date: d,
      dateStr: format(d, 'yyyy-MM-dd'),
      dayNum: d.getDate(),
      isCurrentMonth: isSameMonth(d, this.viewDate()),
      isWeekend: isWeekend(d)
    }));
  });

  // Use addMonths with negative value instead of subMonths which is missing
  prevMonth() { this.viewDate.update(d => addMonths(d, -1)); }
  nextMonth() { this.viewDate.update(d => addMonths(d, 1)); }

  getType(dateStr: string) {
    return this.sched.exceptions().get(dateStr) || 'School';
  }

  isToday(date: Date) {
    return isSameDay(date, new Date());
  }

  getStyle(dateStr: string) {
    const type = this.getType(dateStr);
    if (type === 'School') return 'hover:border-indigo-300 border-slate-100 dark:hover:border-indigo-500 dark:border-slate-700';
    if (type === 'Holiday') return 'border-red-200 bg-red-50 dark:border-red-800/30 dark:bg-red-500/10';
    if (type === 'PD') return 'border-blue-200 bg-blue-50 dark:border-blue-800/30 dark:bg-blue-500/10';
    if (type === 'Exam') return 'border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-500/10';
    return '';
  }

  onDayClick(dateStr: string) {
    const current = this.getType(dateStr);
    let next: DayType = 'Holiday';
    if (current === 'School') next = 'Holiday';
    else if (current === 'Holiday') next = 'PD';
    else if (current === 'PD') next = 'Exam';
    else if (current === 'Exam') next = 'School';
    
    // If next is School, we actually just remove the exception
    if (next === 'School') {
      this.sched.toggleException(dateStr, current); // This toggles it off if it matches, effectively removing it
    } else {
      // Force set
      const map = new Map(this.sched.exceptions());
      map.set(dateStr, next);
      this.sched.exceptions.set(map);
    }
  }
}
