import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SchedulerService, GeneratedDay, ClassInfo } from '../services/scheduler.service';
import saveAs from 'file-saver';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      
      <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-0 z-20">
        <div>
          <h2 class="text-xl font-bold text-slate-800">Final Review</h2>
          <p class="text-sm text-slate-500">Check cycle numbers and export</p>
        </div>
        <button (click)="exportICS()" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          Export to Calendar (.ics)
        </button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cycle Day</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Classes</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            @for (day of sched.generatedSchedule(); track day.dateStr) {
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {{ day.date | date:'EEE, MMM d' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                   <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    {{ day.type === 'School' ? 'bg-green-100 text-green-800' : '' }}
                    {{ day.type === 'Holiday' ? 'bg-red-100 text-red-800' : '' }}
                    {{ day.type === 'PD' ? 'bg-blue-100 text-blue-800' : '' }}
                    {{ day.type === 'Exam' ? 'bg-amber-100 text-amber-800' : '' }}
                   ">
                     {{ day.type }}
                   </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                   @if (day.type === 'School') {
                     <div class="flex items-center gap-2">
                       <span class="text-slate-400 text-xs">Day</span>
                       <input 
                         type="number" 
                         [value]="day.cycleDay" 
                         (input)="override(day.dateStr, $event)"
                         class="w-16 p-1 text-sm border border-slate-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                       />
                       @if(day.overrideCycleDay) {
                         <button (click)="clearOverride(day.dateStr)" class="text-xs text-red-500 hover:text-red-700" title="Reset to auto">
                           Reset
                         </button>
                       }
                     </div>
                   } @else {
                     <span class="text-slate-300">-</span>
                   }
                </td>
                <td class="px-6 py-4 text-sm text-slate-500">
                   @if (day.classes.length > 0) {
                     <div class="flex flex-col gap-1">
                        @for(cls of day.classes; track $index) {
                            @if(cls.name) {
                                <span class="text-xs"><span class="font-semibold text-slate-700">{{ cls.name }}</span> <span class="text-slate-400">({{ cls.room }})</span></span>
                            }
                        }
                        @if(hasNoClasses(day.classes)) {
                            <span class="text-slate-400 italic text-xs">No classes configured</span>
                        }
                     </div>
                   }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ReviewComponent {
  sched = inject(SchedulerService);

  override(dateStr: string, event: Event) {
    const val = parseInt((event.target as HTMLInputElement).value);
    if (!isNaN(val)) {
        this.sched.setCycleOverride(dateStr, val);
    }
  }

  clearOverride(dateStr: string) {
    this.sched.setCycleOverride(dateStr, null);
  }

  hasNoClasses(classes: ClassInfo[]): boolean {
    return classes.every(c => !c.name);
  }

  exportICS() {
    const events: string[] = [];
    const schedule = this.sched.generatedSchedule();
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    events.push('BEGIN:VCALENDAR');
    events.push('VERSION:2.0');
    events.push('PRODID:-//CycleScheduler//EN');

    schedule.forEach(day => {
        if (day.type === 'School' && day.classes.length > 0) {
            day.classes.forEach((cls, index) => {
                if (!cls.name) return; // Skip empty slots

                // Get time for period from bell schedule, ensuring format correctness
                const periodTime = this.sched.bellSchedule()[index];
                if (!periodTime) return;
                
                // Ensure time string is HHMMSS
                const formatTime = (t: string) => {
                    const parts = t.split(':');
                    const h = parts[0].padStart(2, '0');
                    const m = parts[1].padStart(2, '0');
                    return `${h}${m}00`;
                };

                // Format: YYYYMMDDTHHMMSS
                const dayStr = day.dateStr.replace(/-/g, '');
                const startStr = `${dayStr}T${formatTime(periodTime.start)}`;
                const endStr = `${dayStr}T${formatTime(periodTime.end)}`;
                
                // UUID
                const uid = `${dayStr}-${index}@cyclescheduler.app`;

                events.push('BEGIN:VEVENT');
                events.push(`UID:${uid}`);
                events.push(`DTSTAMP:${now}`);
                events.push(`DTSTART:${startStr}`);
                events.push(`DTEND:${endStr}`);
                events.push(`SUMMARY:${cls.name} (Day ${day.cycleDay})`);
                events.push(`DESCRIPTION:Room: ${cls.room}\\nNote: ${cls.note}`);
                events.push(`LOCATION:${cls.room}`);
                events.push('END:VEVENT');
            });
        } else if (day.type !== 'School' && day.type !== 'Holiday') { 
            const dayStr = day.dateStr.replace(/-/g, '');
            const uid = `${dayStr}-type@cyclescheduler.app`;
            events.push('BEGIN:VEVENT');
            events.push(`UID:${uid}`);
            events.push(`DTSTAMP:${now}`);
            events.push(`DTSTART;VALUE=DATE:${dayStr}`);
            events.push(`SUMMARY:${day.type}`);
            events.push('END:VEVENT');
        }
    });

    events.push('END:VCALENDAR');

    const blob = new Blob([events.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    saveAs(blob, 'school_schedule.ics');
  }
}
