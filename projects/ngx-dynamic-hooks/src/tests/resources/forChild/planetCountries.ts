import { Component, ElementRef, Inject } from '@angular/core';
import { Route } from '@angular/router';
import { DynamicHooksGlobalSettings, DynamicHooksInheritance, DYNAMICHOOKS_ANCESTORSETTINGS, DynamicHooksService, provideDynamicHooksForChild, DynamicHooksComponent, DYNAMICHOOKS_MODULESETTINGS } from '../../testing-api';
import { CONTENT_STRING } from './contentString';

@Component({
  selector: 'app-dynamicplanetcountries',
  template: `<div class="countriesDynamic">DYNAMIC PLANET COUNTRIES COMPONENT</div>`
})
export class DynamicPlanetCountriesComponent {}

@Component({
  selector: 'app-planetcountries',
  imports: [DynamicHooksComponent],
  template: `<div class="countries">
    Planet countries component exists
    {{ contentString.value }}
    <ngx-dynamic-hooks [content]="contentString.value"></ngx-dynamic-hooks>
  </div>`,
  standalone: true
})
export class PlanetCountriesComponent {
  constructor(
    public hostElement: ElementRef,
    @Inject(CONTENT_STRING) public contentString: any,
    @Inject(DYNAMICHOOKS_ANCESTORSETTINGS) public ancestorSettings: DynamicHooksGlobalSettings[],
    @Inject(DYNAMICHOOKS_MODULESETTINGS) public moduleSettings: DynamicHooksGlobalSettings,
    public dynamicHooksService: DynamicHooksService
  ) {
  }
}

export const getPlanetCountriesRoutes: () => Route[] = () => {
  return [
    { path: '', component: PlanetCountriesComponent, providers: [
      provideDynamicHooksForChild({
        globalParsers: [
          {component: DynamicPlanetCountriesComponent}
        ],
        globalOptions: {
          convertHTMLEntities: true,
          updateOnPushOnly: true,
          compareOutputsByValue: true
        },
        inheritance: DynamicHooksInheritance.All
      })
    ]}
  ];
}

