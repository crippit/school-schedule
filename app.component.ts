import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
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
            @for(step of steps; track step.path; let i = $index) {
                <a [routerLink]="['/' + step.path]" 
                   routerLinkActive="opacity-100" 
                   [class.opacity-50]="!isActive(step.path)"
                   class="flex items-center gap-2 cursor-pointer transition-opacity group no-underline">
                    
                   <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2"
                        [class.bg-white]="isActive(step.path)"
                        [class.text-indigo-600]="isActive(step.path)"
                        [class.border-white]="isActive(step.path)"
                        [class.border-indigo-400]="!isActive(step.path)"
                        [class.text-indigo-200]="!isActive(step.path)"
                   >
                        {{ i + 1 }}
                    </div>
                    <span class="text-sm font-medium" 
                          [class.text-white]="isActive(step.path)"
                          [class.text-indigo-200]="!isActive(step.path)">
                          {{ step.label }}
                    </span>
                    @if(i < steps.length - 1) {
                        <div class="w-8 h-0.5 bg-indigo-400/50 mx-2"></div>
                    }
                </a>
            }
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 py-8">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer Navigation -->
      <footer class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
          <button 
             (click)="prev()"
             [disabled]="isFirstStep()"
             class="px-6 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
             Back
          </button>
          
          <div class="flex gap-2">
             @if(!isLastStep()) {
                <button 
                (click)="next()"
                class="px-8 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95">
                Next: {{ getNextLabel() }}
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
  private router: Router = inject(Router);
  
  steps = [
    { path: 'setup', label: 'Setup' },
    { path: 'classes', label: 'Classes' },
    { path: 'calendar', label: 'Calendar' },
    { path: 'review', label: 'Review & Export' }
  ];

  isActive(path: string): boolean {
    return this.router.isActive('/' + path, {
        paths: 'exact',
        queryParams: 'ignored',
        fragment: 'ignored',
        matrixParams: 'ignored'
    });
  }

  getCurrentIndex(): number {
    const currentPath = this.router.url.split('/')[1]?.split('?')[0] || 'setup';
    return this.steps.findIndex(s => s.path === currentPath);
  }

  isFirstStep() {
    return this.getCurrentIndex() <= 0;
  }

  isLastStep() {
    return this.getCurrentIndex() >= this.steps.length - 1;
  }

  getNextLabel() {
    const idx = this.getCurrentIndex();
    if (idx < this.steps.length - 1) {
        return this.steps[idx + 1].label;
    }
    return '';
  }

  next() {
    const idx = this.getCurrentIndex();
    if (idx < this.steps.length - 1) {
      this.router.navigate(['/' + this.steps[idx + 1].path]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prev() {
    const idx = this.getCurrentIndex();
    if (idx > 0) {
      this.router.navigate(['/' + this.steps[idx - 1].path]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}