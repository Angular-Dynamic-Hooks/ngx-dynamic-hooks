import { Component, ElementRef, Inject, InjectionToken, Injector, Optional } from '@angular/core';
import { ComponentUpdater, DynamicHooksComponent } from '../../testing-api';

export const COMPONENTONLYSERVICE = new InjectionToken<any>('a service that is only provided at the OutletComponent, not root');

@Component({
  selector: 'ngx-dynamic-hooks',
  template: '',
  styles: [],
  providers: [{provide: COMPONENTONLYSERVICE, useValue: { name: 'ComponentOnlyService' } }]
})
export class DynamicHooksComponentWithProviders extends DynamicHooksComponent {
}
