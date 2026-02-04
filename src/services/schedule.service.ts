import { Injectable, signal, computed } from '@angular/core';

export type DayType = 'School' | 'Holiday' | 'PD' | 'Exam';
export type CycleMode = 'shift' | 'skip'; // Shift: Resume cycle; Skip: Holiday consumes cycle day

export interface PeriodTime {
  start: string;
  end: string;
}

export interface ClassInfo {
  name: string;
  room: string;
  note: string;
}

export interface GeneratedDay {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  type: DayType;
  cycleDay: number | null; // 1-based index, null if not school
  overrideCycleDay?: number | null; // User manual override
  classes: ClassInfo[]; // Calculated classes for this day
}

@Injectable({
  providedIn: 'root'
})
export class SchedulerService {
  // Configuration
  cycleLength = signal<number>(6);
  periodsPerDay = signal<number>(5);
  startDate = signal<string>(new Date().toISOString().split('T')[0]);
  endDate = signal<string>(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]);
  cycleMode = signal<CycleMode>('shift');
  startCycleDay = signal<number>(1);
  
  // Resources
  rooms = signal<string[]>([]);

  // Data
  bellSchedule = signal<PeriodTime[]>([]);
  // Map of "CycleDay-PeriodIndex" to ClassInfo. Key format: "d1-p0"
  classSchedule = signal<Map<string, ClassInfo>>(new Map());
  // Exceptions map: "YYYY-MM-DD" -> DayType
  exceptions = signal<Map<string, DayType>>(new Map());
  
  // Manual Overrides for cycle numbers: "YYYY-MM-DD" -> number
  cycleOverrides = signal<Map<string, number>>(new Map());

  // Initialization helper
  constructor() {
    this.resetBellSchedule(5);
  }

  resetBellSchedule(count: number) {
    const newSchedule: PeriodTime[] = [];
    let startHour = 8;
    for (let i = 0; i < count; i++) {
      newSchedule.push({
        start: `${startHour.toString().padStart(2, '0')}:00`,
        end: `${(startHour + 1).toString().padStart(2, '0')}:00`
      });
      startHour++;
    }
    this.bellSchedule.set(newSchedule);
  }

  updatePeriodCount(count: number) {
    this.periodsPerDay.set(count);
    // Adjust bell schedule size
    const current = this.bellSchedule();
    if (count > current.length) {
      const diff = count - current.length;
      const lastEndHour = current.length > 0 ? parseInt(current[current.length - 1].end.split(':')[0]) : 8;
      const added: PeriodTime[] = [];
      for(let i=0; i<diff; i++) {
        added.push({
          start: `${(lastEndHour + i).toString().padStart(2, '0')}:00`,
          end: `${(lastEndHour + i + 1).toString().padStart(2, '0')}:00`
        });
      }
      this.bellSchedule.update(s => s.concat(added));
    } else if (count < current.length) {
      this.bellSchedule.update(s => s.slice(0, count));
    }
  }

  addRoom(room: string) {
    if (room && !this.rooms().includes(room)) {
      this.rooms.update(r => [...r, room].sort());
    }
  }

  removeRoom(room: string) {
    this.rooms.update(r => r.filter(x => x !== room));
  }

  getClass(dayIndex: number, periodIndex: number): ClassInfo {
    const key = `d${dayIndex}-p${periodIndex}`;
    return this.classSchedule().get(key) || { name: '', room: '', note: '' };
  }

  updateClass(dayIndex: number, periodIndex: number, field: keyof ClassInfo, value: string) {
    const key = `d${dayIndex}-p${periodIndex}`;
    const currentMap = new Map(this.classSchedule());
    const existing = currentMap.get(key) || { name: '', room: '', note: '' };
    currentMap.set(key, { ...existing, [field]: value });
    this.classSchedule.set(currentMap);
  }
  
  // Batch update for AI filling
  updateClassBatch(updates: {day: number, period: number, info: ClassInfo}[]) {
    const currentMap = new Map(this.classSchedule());
    updates.forEach(u => {
        const key = `d${u.day}-p${u.period}`;
        currentMap.set(key, u.info);
    });
    this.classSchedule.set(currentMap);
  }

  toggleException(dateStr: string, type: DayType) {
    const current = new Map(this.exceptions());
    if (current.get(dateStr) === type) {
      current.delete(dateStr); // Toggle off if same
    } else {
      current.set(dateStr, type);
    }
    this.exceptions.set(current);
  }

  setCycleOverride(dateStr: string, val: number | null) {
    const current = new Map(this.cycleOverrides());
    if (val === null) {
      current.delete(dateStr);
    } else {
      current.set(dateStr, val);
    }
    this.cycleOverrides.set(current);
  }

  // The Big Calculation
  generatedSchedule = computed(() => {
    const start = new Date(this.startDate());
    const end = new Date(this.endDate());
    const days: GeneratedDay[] = [];
    const exceptions = this.exceptions();
    const cycleLen = this.cycleLength();
    const mode = this.cycleMode();
    const overrides = this.cycleOverrides();

    // Use the configured start cycle day
    let currentCycleDay = this.startCycleDay();
    const currDate = new Date(start);

    // Safety break
    let loopCount = 0;
    while (currDate <= end && loopCount < 1000) {
      loopCount++;
      const dateStr = currDate.toISOString().split('T')[0];
      const dayOfWeek = currDate.getDay(); // 0=Sun, 6=Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      let type: DayType = 'School';
      if (exceptions.has(dateStr)) {
        type = exceptions.get(dateStr)!;
      } else if (isWeekend) {
        // Automatically treat weekends as non-school days
      }

      let assignedCycle: number | null = null;
      
      // Override takes precedence
      if (overrides.has(dateStr)) {
        assignedCycle = overrides.get(dateStr)!;
        // Adjust the running counter based on the override if it's a School day to keep sequence logical
        if (type === 'School' && !isWeekend) {
             currentCycleDay = (assignedCycle % cycleLen) + 1; 
        }
      } else {
        // Logic for School Days
        if (!isWeekend && type === 'School') {
          assignedCycle = currentCycleDay;
          
          // Increment for next time
          currentCycleDay = (currentCycleDay % cycleLen) + 1;
        } else {
          // It's a weekend or exception
          if (mode === 'skip' && !isWeekend) {
            // "Skip" means the cycle continues in background
            currentCycleDay = (currentCycleDay % cycleLen) + 1;
          }
        }
      }

      if (!isWeekend || type !== 'School') {
          // Resolve classes if cycle day exists
          const classes: ClassInfo[] = [];
          if (assignedCycle !== null) {
              for(let p=0; p < this.periodsPerDay(); p++) {
                  classes.push(this.getClass(assignedCycle, p));
              }
          }

          if (!isWeekend) { // Only add weekdays to the list to keep it clean
            days.push({
                date: new Date(currDate),
                dateStr,
                type,
                cycleDay: assignedCycle,
                overrideCycleDay: overrides.get(dateStr) || null,
                classes
            });
          }
      }
      
      currDate.setDate(currDate.getDate() + 1);
    }
    return days;
  });
}
