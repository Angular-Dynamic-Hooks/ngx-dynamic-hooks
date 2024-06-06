import { NgModule, ModuleWithProviders, Component, Inject, ElementRef, Provider } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { CONTENT_STRING } from './contentString';
import { DynamicHooksComponent, provideDynamicHooksForChild } from '../../testing-api';

@Component({
  selector: 'app-dynamicstars',
  template: `<div class="starsDynamic">DYNAMIC STARS COMPONENT</div>`
})
export class DynamicStarsComponent {}

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

export const getStarsRoutes: () => Route[] = () => {
  return [
    { path: '', component: StarsComponent, providers: [
      provideDynamicHooksForChild({
        parsers: [
          {component: DynamicStarsComponent}
        ],
        options: {
          sanitize: false,
          convertHTMLEntities: false,
          fixParagraphTags: true
        }
      })
    ]}
  ];
}

