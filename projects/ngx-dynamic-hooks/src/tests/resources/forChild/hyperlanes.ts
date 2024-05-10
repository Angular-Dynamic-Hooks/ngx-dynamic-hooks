import { NgModule, ModuleWithProviders, Component, Inject, ElementRef, Provider } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CONTENT_STRING } from './contentString';
import { DynamicHooksComponent, provideDynamicHooksForChild } from '../../testing-api';

export function createHyperlanesModuleSync() {
  @NgModule({
    imports: [
      RouterModule.forChild([
        { path: 'hyperlanes', component: HyperlanesComponent }
      ])
    ],
    providers: [
      createHyperlanesModuleHooksImport()
    ]
  })
  class HyperlanesModuleSync {}

  return HyperlanesModuleSync;
}

function createHyperlanesModuleHooksImport(): Provider[] {
  return provideDynamicHooksForChild({
    globalParsers: [
      {component: DynamicHyperlanesComponent}
    ]
  });
}

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

@Component({
  selector: 'app-dynamichyperlanes',
  template: `<div class="hyperlanesDynamic">DYNAMIC HYPERLANES COMPONENT</div>`
})
export class DynamicHyperlanesComponent {}