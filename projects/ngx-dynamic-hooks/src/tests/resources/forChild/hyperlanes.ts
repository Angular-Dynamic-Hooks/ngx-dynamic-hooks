import { NgModule, ModuleWithProviders, Component, Inject, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DynamicHooksModule } from '../../testing-api';
import { CONTENT_STRING } from './contentString';

@Component({
  selector: 'app-dynamichyperlanes',
  template: `<div class="hyperlanesDynamic">DYNAMIC HYPERLANES COMPONENT</div>`
})
export class DynamicHyperlanesComponent {}

@Component({
  selector: 'app-hyperlanes',
  template: `<div class="hyperlanes">
    Hyperlanes component exists
    <ngx-dynamic-hooks [content]="contentString.value"></ngx-dynamic-hooks>
  </div>`
})
export class HyperlanesComponent {
  constructor(public hostElement: ElementRef, @Inject(CONTENT_STRING) public contentString) {}
}

export function createHyperlanesModuleHooksImport(): ModuleWithProviders<DynamicHooksModule> {
  return DynamicHooksModule.forChild({
    globalParsers: [
      {component: DynamicHyperlanesComponent}
    ]
  });
}

@NgModule({
  declarations: [HyperlanesComponent],
  exports: [HyperlanesComponent],
  imports: [
    RouterModule.forChild([
      { path: 'hyperlanes', component: HyperlanesComponent }
    ]),
    createHyperlanesModuleHooksImport()
  ]
})
export class HyperlanesModuleSync {}