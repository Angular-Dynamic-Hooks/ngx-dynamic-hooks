import { NgModule, ModuleWithProviders, Component, Inject, ElementRef, Provider } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CONTENT_STRING } from './contentString';
import { DynamicHooksComponent, provideDynamicHooksForChild } from '../../testing-api';

export function createStarsModuleSync() {
  @NgModule({
    imports: [
      RouterModule.forChild([
        { path: 'stars', component: StarsComponent }
      ])
    ],
    providers: [
      createStarsModuleHooksImport()
    ]
  })
  class StarsModuleSync {}

  return StarsModuleSync;
}

export function createStarsModuleLazy() {
  @NgModule({
    imports: [
      RouterModule.forChild([
        { path: '', component: StarsComponent }
      ])      
    ],
    providers: [
      createStarsModuleHooksImport()
    ]
  })
  class StarsModuleLazy {}

  return StarsModuleLazy;
}

function createStarsModuleHooksImport(): Provider[] {
  return provideDynamicHooksForChild({
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
  imports: [DynamicHooksComponent],
  template: `<div class="stars">
    Stars component exists
    <ngx-dynamic-hooks [content]="contentString.value"></ngx-dynamic-hooks>
  </div>`,
  standalone: true
})
export class StarsComponent {
  constructor(public hostElement: ElementRef, @Inject(CONTENT_STRING) public contentString: any) {}
}

@Component({
  selector: 'app-dynamicstars',
  template: `<div class="starsDynamic">DYNAMIC STARS COMPONENT</div>`
})
export class DynamicStarsComponent {}