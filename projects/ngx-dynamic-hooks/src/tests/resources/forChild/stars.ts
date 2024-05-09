import { NgModule, ModuleWithProviders, Component, Inject, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DynamicHooksModule } from '../../testing-api';
import { CONTENT_STRING } from './contentString';

export function createStarsModuleSync() {
  @NgModule({
    declarations: [StarsComponent],
    exports: [StarsComponent],
    imports: [
      RouterModule.forChild([
        { path: 'stars', component: StarsComponent }
      ]),
      createStarsModuleHooksImport()
    ]
  })
  class StarsModuleSync {}

  return StarsModuleSync;
}

export function createStarsModuleLazy() {
  @NgModule({
    declarations: [StarsComponent],
    exports: [StarsComponent],
    imports: [
      RouterModule.forChild([
        { path: '', component: StarsComponent }
      ]),
      createStarsModuleHooksImport()
    ]
  })
  class StarsModuleLazy {}

  return StarsModuleLazy;
}

function createStarsModuleHooksImport(): ModuleWithProviders<DynamicHooksModule> {
  return DynamicHooksModule.forChild({
    globalParsers: [
      {component: DynamicStarsComponent}
    ],
    globalOptions: {
      sanitize: false,
      convertHTMLEntities: false,
      fixParagraphTags: true
    }
  });
}

@Component({
  selector: 'app-stars',
  template: `<div class="stars">
    Stars component exists
    <ngx-dynamic-hooks [content]="contentString.value"></ngx-dynamic-hooks>
  </div>`
})
export class StarsComponent {
  constructor(public hostElement: ElementRef, @Inject(CONTENT_STRING) public contentString: any) {}
}

@Component({
  selector: 'app-dynamicstars',
  template: `<div class="starsDynamic">DYNAMIC STARS COMPONENT</div>`
})
export class DynamicStarsComponent {}