import { NgModule, ModuleWithProviders, Component, Inject, ElementRef, Provider } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { CONTENT_STRING } from './contentString';
import { DynamicHooksComponent, DynamicHooksInheritance, provideDynamicHooks } from '../../testing-api';

@Component({
  selector: 'app-dynamichyperlanes',
  template: `<div class="hyperlanesDynamic">DYNAMIC HYPERLANES COMPONENT</div>`
})
export class DynamicHyperlanesComponent {}

@Component({
  selector: 'app-hyperlanes',
  imports: [DynamicHooksComponent],
  template: `<div class="hyperlanes">
    Hyperlanes component exists
    <ngx-dynamic-hooks [content]="contentString.value"></ngx-dynamic-hooks>
  </div>`,
  standalone: true
})
export class HyperlanesComponent {
  constructor(public hostElement: ElementRef, @Inject(CONTENT_STRING) public contentString: any) {}
}

export const getHyperlaneRoutes: () => Route[] = () => {
  return [
    { path: '', component: HyperlanesComponent, providers: [
      provideDynamicHooks({
        parsers: [
          {component: DynamicHyperlanesComponent}
        ],
        inheritance: DynamicHooksInheritance.All
      })
    ]}
  ];
}
