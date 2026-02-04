import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SetupComponent } from './components/setup.component';
import { ClassInputComponent } from './components/class-input.component';
import { CalendarComponent } from './components/calendar.component';
import { ReviewComponent } from './components/review.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SetupComponent, ClassInputComponent, CalendarComponent, ReviewComponent],
  template: `
    <div class="min-h-screen bg-slate-50 font-sans pb-20">
      <!-- Header -->
      <header class="bg-indigo-600 text-white shadow-lg sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <div>
                <h1 class="text-xl font-bold tracking-tight">Cycle Schedule Master</h1>
                <p class="text-xs text-indigo-200">For Teachers, By Teachers</p>
            </div>
          </div>
          
          <!-- Stepper Dots (Desktop) -->
          <div class="hidden md:flex items-center gap-2">
            @for(step of steps; track step.id; let i = $index) {
                <div 
                   (click)="goToStep(i)"
                   class="flex items-center gap-2 cursor-pointer transition-opacity group"
                   [class.opacity-50]="currentStep() !== i"
                   [class.opacity-100]="currentStep() === i"
                >
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 
                        {{ currentStep() === i ? 'bg-white text-indigo-600 border-white' : 'border-indigo-400 text-indigo-200 group-hover:border-white group-hover:text-white' }}">
                        {{ i + 1 }}
                    </div>
                    <span class="text-sm font-medium {{ currentStep() === i ? 'text-white' : 'text-indigo-200 group-hover:text-white' }}">{{ step.label }}</span>
                    @if(i < steps.length - 1) {
                        <div class="w-8 h-0.5 bg-indigo-400/50 mx-2"></div>
                    }
                </div>
            }
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 py-8">
        @switch (currentStep()) {
          @case (0) { <app-setup /> }
          @case (1) { <app-class-input /> }
          @case (2) { <app-calendar-mgr /> }
          @case (3) { <app-review /> }
        }
      </main>

      <!-- Footer Navigation -->
      <footer class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
          <button 
             (click)="prev()"
             [disabled]="currentStep() === 0"
             class="px-6 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
             Back
          </button>
          
          <div class="flex gap-2">
             @if(currentStep() < steps.length - 1) {
                <button 
                (click)="next()"
                class="px-8 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95">
                Next: {{ steps[currentStep() + 1].label }}
                </button>
             } @else {
                <div class="text-sm text-slate-500 font-medium flex items-center gap-2">
                    <svg class="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Ready to Export
                </div>
             }
          </div>
        </div>
      </footer>
    </div>
  `
})
export class AppComponent {
  currentStep = signal(0);
  
  steps = [
    { id: 'setup', label: 'Setup' },
    { id: 'classes', label: 'Classes' },
    { id: 'exceptions', label: 'Calendar' },
    { id: 'review', label: 'Review & Export' }
  ];

  next() {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update(i => i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prev() {
    if (this.currentStep() > 0) {
      this.currentStep.update(i => i - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToStep(index: number) {
    this.currentStep.set(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
