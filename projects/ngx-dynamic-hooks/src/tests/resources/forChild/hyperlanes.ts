import { NgModule, ModuleWithProviders, Component, Inject, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DynamicHooksModule } from '../../testing-api';
import { CONTENT_STRING } from './contentString';

export function createHyperlanesModuleSync() {
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
  class HyperlanesModuleSync {}

  return HyperlanesModuleSync;
}

function createHyperlanesModuleHooksImport(): ModuleWithProviders<DynamicHooksModule> {
  return DynamicHooksModule.forChild({
    globalParsers: [
      {component: DynamicHyperlanesComponent}
    ]
  });
}

@Component({
  selector: 'app-hyperlanes',
  template: `<div class="hyperlanes">
    Hyperlanes component exists
    <ngx-dynamic-hooks [content]="contentString.value"></ngx-dynamic-hooks>
  </div>`
})
export class HyperlanesComponent {
  constructor(public hostElement: ElementRef, @Inject(CONTENT_STRING) public contentString: any) {}
}

@Component({
  selector: 'app-dynamichyperlanes',
  template: `<div class="hyperlanesDynamic">DYNAMIC HYPERLANES COMPONENT</div>`
})
export class DynamicHyperlanesComponent {}