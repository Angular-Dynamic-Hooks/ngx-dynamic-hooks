import { Component, ElementRef, Inject, Optional } from '@angular/core';
import { Route } from '@angular/router';
import { DYNAMICHOOKS_ALLSETTINGS, DynamicHooksComponent, DynamicHooksSettings, DynamicHooksInheritance, DynamicHooksService, allSettings, provideDynamicHooks } from '../../testing-api';
import { CONTENT_STRING } from './contentString';

@Component({
  selector: 'app-dynamicplanetcities',
  template: `<div class="citiesDynamic">DYNAMIC PLANET CITIES COMPONENT</div>`
})
export class DynamicPlanetCitiesComponent {}

@Component({
  selector: 'app-dynamicplanetcities-elementinjector',
  template: `<div class="speciesDynamic">DYNAMIC PLANET CITIES FROM ELEMENTINJECTOR COMPONENT</div>`
})
export class DynamicPlanetCitiesElementInjectorComponent {}

export const planetCitiesComponentProviderSettings = {
  parsers: [
    {component: DynamicPlanetCitiesElementInjectorComponent}
  ],
  inheritance: DynamicHooksInheritance.Linear
};

@Component({
  selector: 'app-planetcities',
  imports: [DynamicHooksComponent],
  template: `<div class="cities">
    Planet cities component exists
    <ngx-dynamic-hooks [content]="contentString.value"></ngx-dynamic-hooks>
  </div>`,
  standalone: true,
  providers: [
    provideDynamicHooks(planetCitiesComponentProviderSettings)
  ]
})
export class PlanetCitiesComponent {
  constructor(
    public hostElement: ElementRef,
    @Inject(CONTENT_STRING) public contentString: any,
    public dynamicHooksService: DynamicHooksService
  ) {}
}


export const getPlanetCitiesRoutes: () => Route[] = () => {
  // Due to component-level providers being immediately loaded once its esmodule is imported anywhere, they can't be easily reset for testing.
  // This is a problem for adding the component-level hook config to allSettings for each new test. However, we can simulate this by checking here
  // and adding it manually, if its missing.
  if (!allSettings.includes(planetCitiesComponentProviderSettings)) {
    allSettings.push(planetCitiesComponentProviderSettings);
    console.log('Missing DynamicPlanetCitiesElementInjectorComponent from allSettings. Re-adding...');
  }

  return [
    { path: '', component: PlanetCitiesComponent, providers: [
      provideDynamicHooks({
        parsers: [
          {component: DynamicPlanetCitiesComponent}
        ],
        options: {
          sanitize: false
        }        
      })
    ]}
  ];
}