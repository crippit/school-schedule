import { Routes } from '@angular/router';
import { SetupComponent } from './components/setup.component';
import { ClassInputComponent } from './components/class-input.component';
import { CalendarComponent } from './components/calendar.component';
import { ReviewComponent } from './components/review.component';

export const routes: Routes = [
  { path: '', component: SetupComponent, title: 'Setup' },
  { path: 'setup', component: SetupComponent, title: 'Setup' },
  { path: 'classes', component: ClassInputComponent, title: 'Classes' },
  { path: 'calendar', component: CalendarComponent, title: 'Calendar' },
  { path: 'review', component: ReviewComponent, title: 'Review' },
  { path: '**', redirectTo: '' }
];