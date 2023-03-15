import { Component, ElementRef, Inject, InjectionToken, Injector, Optional } from '@angular/core';
import { ComponentUpdater, OutletComponent, OutletService, PlatformService } from '../../testing-api';

export const OUTLETCOMPONENTSERVICE = new InjectionToken<any>('a service that is only provided at the OutletComponent, not root');

@Component({
  selector: 'ngx-dynamic-hooks',
  template: '',
  styles: [],
  providers: [{provide: OUTLETCOMPONENTSERVICE, useValue: { name: 'OutletComponentService' } }]
})
export class OutletComponentWithProviders extends OutletComponent {
}
