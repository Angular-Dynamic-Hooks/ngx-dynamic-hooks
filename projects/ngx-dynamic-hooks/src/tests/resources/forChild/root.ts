import { Component, Inject, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CONTENT_STRING } from './contentString';
import { DynamicHooksComponent } from '../../testing-api';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dynamicroot',
  template: `<div class="rootDynamic">DYNAMIC ROOT COMPONENT</div>`
})
export class DynamicRootComponent {}

@Component({
  selector: 'app-root',
  imports: [DynamicHooksComponent, RouterOutlet],
  template: `<div class="rootComponent">
    Root component exists
    <ngx-dynamic-hooks [content]="contentString.value"></ngx-dynamic-hooks>
    <router-outlet></router-outlet>
  </div>`,
  standalone: true
})
export class RootComponent {
  constructor(public hostElement: ElementRef, @Inject(CONTENT_STRING) public contentString: any) {
  }
}
