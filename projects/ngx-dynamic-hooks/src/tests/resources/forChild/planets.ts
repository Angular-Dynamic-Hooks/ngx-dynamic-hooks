import { Component, Inject, ElementRef } from '@angular/core';
import { Route, RouterOutlet } from '@angular/router';
import { CONTENT_STRING } from './contentString';
import { getPlanetCitiesRoutes } from './planetCities';
import { getPlanetCountriesRoutes } from './planetCountries';
import { getPlanetSpeciesRoutes } from './planetSpecies';
import { DynamicHooksComponent, provideDynamicHooksForChild } from '../../testing-api';

@Component({
  selector: 'app-dynamicplanets',
  template: `<div class="planetsDynamic">DYNAMIC PLANETS COMPONENT</div>`
})
export class DynamicPlanetsComponent {}

@Component({
  selector: 'app-planets',
  imports: [DynamicHooksComponent, RouterOutlet],
  template: `<div class="planets">
    <span>Planets component exists</span>
    <!-- Intentionally not rendering ngx-dynamic-hooks to test that Planets config is still included in DynamicHooksInheritance.All and DynamicHooksInheritance.Linear -->
    <router-outlet name="nestedOutlet"></router-outlet>
  </div>`,
  standalone: true
})
export class PlanetsComponent {
  constructor(public hostElement: ElementRef, @Inject(CONTENT_STRING) public contentString: any) {}
}

export const getPlanetsRoutes: (lazyChildren: boolean) => Route[] = (lazyChildren) => {
  return [
    { path: '', 
      component: PlanetsComponent, 
      providers: [
        provideDynamicHooksForChild({
          parsers: [
            {component: DynamicPlanetsComponent}
          ],
          options: {
            sanitize: true,
            updateOnPushOnly: false,
            compareInputsByValue: true
          }
        })
      ],
      children: lazyChildren ? [
        { path: 'countries', outlet: 'nestedOutlet', loadChildren: () => new Promise(resolve => resolve(getPlanetCountriesRoutes())) },
        { path: 'cities', outlet: 'nestedOutlet', loadChildren: () => new Promise(resolve => resolve(getPlanetCitiesRoutes())) },
        { path: 'species', outlet: 'nestedOutlet', loadChildren: () => new Promise(resolve => resolve(getPlanetSpeciesRoutes())) }
      ] : [
        { path: 'countries', outlet: 'nestedOutlet', children: getPlanetCountriesRoutes() },
        { path: 'cities', outlet: 'nestedOutlet', children: getPlanetCitiesRoutes() },
        { path: 'species', outlet: 'nestedOutlet', children: getPlanetSpeciesRoutes() }
      ]
    }
  ];
}