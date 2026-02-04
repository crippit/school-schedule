import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchedulerService, DayType } from '../services/scheduler.service';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isWeekend } from 'date-fns';

@Component({
  selector: 'app-calendar-mgr',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-slate-800">Exceptions & Holidays</h2>
        
        <div class="flex items-center gap-4">
           <div class="flex gap-2 text-xs">
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-red-100 border border-red-300"></span> Holiday</span>
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-blue-100 border border-blue-300"></span> PD Day</span>
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-amber-100 border border-amber-300"></span> Exam</span>
           </div>
           <div class="flex items-center bg-slate-100 rounded-lg p-1">
             <button (click)="prevMonth()" class="p-1 hover:bg-white rounded-md shadow-sm transition-all"><svg class="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg></button>
             <span class="px-4 font-semibold text-slate-700 w-32 text-center">{{ monthLabel() }}</span>
             <button (click)="nextMonth()" class="p-1 hover:bg-white rounded-md shadow-sm transition-all"><svg class="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg></button>
           </div>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1 mb-2 text-center">
        @for(day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; track day) {
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider py-2">{{ day }}</div>
        }
      </div>

      <div class="grid grid-cols-7 gap-1">
        @for (day of calendarDays(); track day.dateStr) {
          <div 
             (click)="onDayClick(day.dateStr)"
             class="h-24 border rounded-lg p-2 cursor-pointer transition-all relative group
             {{ day.isWeekend ? 'bg-slate-100 text-slate-400' : (!day.isCurrentMonth ? 'bg-slate-50 text-slate-300' : 'bg-white') }}
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
             <div class="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <span class="text-xs font-bold text-slate-600 bg-white/90 px-2 py-1 rounded shadow-sm">Click to Cycle</span>
             </div>
          </div>
        }
      </div>
      
      <p class="text-center text-xs text-slate-400 mt-4">
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
    const start = startOfMonth(this.viewDate());
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

  prevMonth() { this.viewDate.update(d => subMonths(d, 1)); }
  nextMonth() { this.viewDate.update(d => addMonths(d, 1)); }

  getType(dateStr: string) {
    return this.sched.exceptions().get(dateStr) || 'School';
  }

  isToday(date: Date) {
    return isSameDay(date, new Date());
  }

  getStyle(dateStr: string) {
    const type = this.getType(dateStr);
    if (type === 'School') return 'hover:border-indigo-300 border-slate-100';
    if (type === 'Holiday') return 'border-red-200 bg-red-50';
    if (type === 'PD') return 'border-blue-200 bg-blue-50';
    if (type === 'Exam') return 'border-amber-200 bg-amber-50';
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
