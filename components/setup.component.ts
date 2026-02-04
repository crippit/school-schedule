import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SchedulerService } from '../services/scheduler.service';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h2 class="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Configuration
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Dates -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700">Start Date</label>
          <input type="date" [ngModel]="sched.startDate()" (ngModelChange)="sched.startDate.set($event)" 
                 class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
        </div>
        
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700">End Date</label>
          <input type="date" [ngModel]="sched.endDate()" (ngModelChange)="sched.endDate.set($event)"
                 class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
        </div>

        <!-- Cycle Config -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700">Days in Cycle</label>
          <input type="number" min="1" max="20" [ngModel]="sched.cycleLength()" (ngModelChange)="sched.cycleLength.set($event)"
                 class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
        </div>

        <div class="space-y-2">
            <label class="block text-sm font-medium text-slate-700">First Day is Cycle Day</label>
            <input type="number" min="1" [max]="sched.cycleLength()" [ngModel]="sched.startCycleDay()" (ngModelChange)="sched.startCycleDay.set($event)"
                   class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
            <p class="text-xs text-slate-500">The cycle number for {{ sched.startDate() }}</p>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700">Periods per Day</label>
          <input type="number" min="1" max="20" [ngModel]="sched.periodsPerDay()" (ngModelChange)="sched.updatePeriodCount($event)"
                 class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
        </div>

        <!-- Logic -->
        <div class="col-span-1 md:col-span-2 space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <span class="block text-sm font-medium text-slate-700">Holiday Logic</span>
          <div class="flex flex-col sm:flex-row gap-4">
            <label class="inline-flex items-center">
              <input type="radio" class="form-radio text-indigo-600 focus:ring-indigo-500 h-5 w-5" 
                     name="mode" [ngModel]="sched.cycleMode()" (ngModelChange)="sched.cycleMode.set('shift')" value="shift">
              <span class="ml-2 text-slate-700">
                <span class="font-semibold block">Shift Cycle (Pause)</span>
                <span class="text-xs text-slate-500">Day 1 -> Holiday -> Day 2</span>
              </span>
            </label>
            <label class="inline-flex items-center">
              <input type="radio" class="form-radio text-indigo-600 focus:ring-indigo-500 h-5 w-5" 
                     name="mode" [ngModel]="sched.cycleMode()" (ngModelChange)="sched.cycleMode.set('skip')" value="skip">
              <span class="ml-2 text-slate-700">
                <span class="font-semibold block">Fixed Cycle (Skip)</span>
                <span class="text-xs text-slate-500">Day 1 -> Holiday -> Day 3</span>
              </span>
            </label>
          </div>
        </div>

        <!-- Rooms -->
        <div class="col-span-1 md:col-span-2 space-y-2">
             <label class="block text-sm font-medium text-slate-700">Available Rooms</label>
             <div class="flex gap-2">
               <input type="text" [(ngModel)]="newRoom" (keyup.enter)="addRoom()" placeholder="e.g. 101, Gym, Lab A" class="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
               <button (click)="addRoom()" class="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 font-medium text-sm">Add</button>
             </div>
             @if(sched.rooms().length > 0) {
               <div class="flex flex-wrap gap-2 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  @for(room of sched.rooms(); track room) {
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {{ room }}
                        <button (click)="sched.removeRoom(room)" class="ml-1.5 text-indigo-500 hover:text-indigo-900 focus:outline-none">
                          <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                        </button>
                      </span>
                  }
               </div>
             }
        </div>
      </div>
      
      <!-- Bell Schedule -->
      <div class="mt-8">
         <h3 class="text-lg font-semibold text-slate-800 mb-4">Bell Schedule</h3>
         <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-slate-100 text-slate-600 uppercase text-xs">
                <tr>
                  <th class="px-4 py-2 rounded-tl-lg">Period</th>
                  <th class="px-4 py-2">Start Time</th>
                  <th class="px-4 py-2 rounded-tr-lg">End Time</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (period of sched.bellSchedule(); track $index) {
                  <tr>
                    <td class="px-4 py-2 font-medium text-slate-700">Period {{ $index + 1 }}</td>
                    <td class="px-4 py-2">
                       <input type="time" [(ngModel)]="period.start" class="px-2 py-1 border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    </td>
                    <td class="px-4 py-2">
                       <input type="time" [(ngModel)]="period.end" class="px-2 py-1 border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    </td>
                  </tr>
                }
              </tbody>
            </table>
         </div>
      </div>
    </div>
  `
})
export class SetupComponent {
  sched = inject(SchedulerService);
  newRoom = signal('');

  addRoom() {
    if(this.newRoom().trim()) {
        this.sched.addRoom(this.newRoom().trim());
        this.newRoom.set('');
    }
  }
}