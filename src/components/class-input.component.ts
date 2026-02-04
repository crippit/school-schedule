import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SchedulerService, ClassInfo } from '../services/scheduler.service';
import { GoogleGenAI, Type } from "@google/genai";

@Component({
  selector: 'app-class-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- AI Assistant -->
      <div class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-xl shadow-md">
        <h3 class="text-lg font-bold mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          Smart Schedule Fill
        </h3>
        <p class="text-indigo-100 text-sm mb-4">
           Paste your schedule description below (e.g., "I teach Math 9 in Room 304 on Day 1 Period 2 and Day 3 Period 4...").
           We'll try to fill the grid for you.
        </p>
        <div class="relative">
          <textarea 
            [(ngModel)]="aiPrompt" 
            placeholder="Paste text here..." 
            class="w-full text-slate-800 p-3 rounded-lg focus:ring-2 focus:ring-indigo-300 border-none h-24 text-sm"
          ></textarea>
          <button 
            (click)="runSmartFill()" 
            [disabled]="isProcessing()"
            class="absolute bottom-3 right-3 bg-indigo-800 hover:bg-indigo-900 text-white text-xs font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2">
            @if(isProcessing()) {
              <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            }
            {{ isProcessing() ? 'Thinking...' : 'Auto-Fill' }}
          </button>
        </div>
        @if(aiError()) {
            <p class="text-red-200 text-xs mt-2">{{ aiError() }}</p>
        }
      </div>

      <!-- Main Grid -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 w-24">
                  Period
                </th>
                @for (day of daysArray(); track $index) {
                  <th class="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[200px]">
                    Cycle Day {{ $index + 1 }}
                  </th>
                }
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-slate-200">
              @for (period of sched.bellSchedule(); track pIndex; let pIndex = $index) {
                <tr>
                  <td class="px-3 py-4 whitespace-nowrap text-sm font-medium text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-100">
                    <div class="flex flex-col">
                      <span>Period {{ pIndex + 1 }}</span>
                      <span class="text-xs text-slate-400 font-normal">{{ period.start }} - {{ period.end }}</span>
                    </div>
                  </td>
                  @for (day of daysArray(); track dIndex; let dIndex = $index) {
                    <td class="px-2 py-2 align-top border-r border-slate-50 last:border-none">
                      <div class="space-y-2 bg-slate-50 p-2 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors">
                        <input 
                          type="text" 
                          [value]="sched.getClass(dIndex + 1, pIndex).name"
                          (input)="update(dIndex + 1, pIndex, 'name', $event)"
                          placeholder="Class Name" 
                          class="block w-full text-sm font-medium text-slate-900 bg-transparent border-0 border-b border-slate-200 focus:border-indigo-500 focus:ring-0 px-0 placeholder-slate-400"
                        />
                        <div class="flex gap-2">
                            <input 
                            list="roomOptions"
                            type="text" 
                            [value]="sched.getClass(dIndex + 1, pIndex).room"
                            (input)="update(dIndex + 1, pIndex, 'room', $event)"
                            placeholder="Room" 
                            class="block w-1/3 text-xs text-slate-600 bg-transparent border-0 focus:ring-0 px-0 placeholder-slate-400"
                            />
                            <input 
                            type="text" 
                            [value]="sched.getClass(dIndex + 1, pIndex).note"
                            (input)="update(dIndex + 1, pIndex, 'note', $event)"
                            placeholder="Note" 
                            class="block w-2/3 text-xs text-slate-600 bg-transparent border-0 focus:ring-0 px-0 placeholder-slate-400 text-right"
                            />
                        </div>
                      </div>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Shared Datalist for Rooms -->
      <datalist id="roomOptions">
         @for(room of sched.rooms(); track room) {
             <option [value]="room"></option>
         }
      </datalist>
    </div>
  `
})
export class ClassInputComponent {
  sched = inject(SchedulerService);
  aiPrompt = signal('');
  isProcessing = signal(false);
  aiError = signal('');

  daysArray = computed(() => Array(this.sched.cycleLength()).fill(0));

  update(day: number, period: number, field: keyof ClassInfo, event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.sched.updateClass(day, period, field, val);
  }

  async runSmartFill() {
    if (!this.aiPrompt().trim()) return;
    this.isProcessing.set(true);
    this.aiError.set('');

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const systemInstruction = `
            You are a JSON generator for a school schedule. 
            The user will describe their schedule.
            You must output a JSON object containing an array of classes.
            Each item in the array must have:
            - 'cycleDay' (number, 1-based index)
            - 'period' (number, 0-based index. e.g. Period 1 is 0)
            - 'name' (string, Class Name)
            - 'room' (string)
            - 'note' (string)
            
            The user's cycle length is ${this.sched.cycleLength()}.
            The periods per day is ${this.sched.periodsPerDay()}.
            
            If a class happens on multiple days (e.g. "Day 1 and 3"), output two separate objects.
            Ignore irrelevant text.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: this.aiPrompt(),
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        classes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    cycleDay: { type: Type.INTEGER },
                                    period: { type: Type.INTEGER },
                                    name: { type: Type.STRING },
                                    room: { type: Type.STRING },
                                    note: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });

        const json = JSON.parse(response.text);
        if (json.classes && Array.isArray(json.classes)) {
            const updates = json.classes.map((c: any) => ({
                day: c.cycleDay,
                period: c.period,
                info: { name: c.name || '', room: c.room || '', note: c.note || '' }
            }));
            this.sched.updateClassBatch(updates);
        }
    } catch (err) {
        console.error(err);
        this.aiError.set('Failed to generate schedule. Check API Key or try again.');
    } finally {
        this.isProcessing.set(false);
    }
  }
}