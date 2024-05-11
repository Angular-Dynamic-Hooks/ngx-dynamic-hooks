import { Component, ElementRef, Inject, InjectionToken, Injector, Optional } from '@angular/core';
import { ComponentUpdater, DynamicHooksComponent } from '../../testing-api';

export const DYNAMICHOOKSCOMPONENTSERVICE = new InjectionToken<any>('A service that is only provided directly on the DynamicHooksComponent');

@Component({
  selector: 'ngx-dynamic-hooks',
  template: '',
  styles: [],
  standalone: true,
  providers: [{provide: DYNAMICHOOKSCOMPONENTSERVICE, useValue: { name: 'DynamicHooksComponentService' } }]
})
export class DynamicHooksComponentWithProviders extends DynamicHooksComponent {
}
