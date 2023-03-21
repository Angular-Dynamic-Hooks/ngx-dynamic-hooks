import { Component, Inject, ElementRef } from '@angular/core';
import { CONTENT_STRING } from './contentString';

@Component({
  selector: 'app-dynamicroot',
  template: `<div class="rootDynamic">DYNAMIC ROOT COMPONENT</div>`
})
export class DynamicRootComponent {}

@Component({
  selector: 'app-root',
  template: `<div class="rootComponent">
    Root component exists
    <ngx-dynamic-hooks [content]="contentString.value"></ngx-dynamic-hooks>
    <router-outlet></router-outlet>
  </div>`
})
export class RootComponent {
  constructor(public hostElement: ElementRef, @Inject(CONTENT_STRING) public contentString) {}
}
