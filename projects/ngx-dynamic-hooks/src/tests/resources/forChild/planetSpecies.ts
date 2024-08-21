import { Component, Inject, ElementRef } from '@angular/core';
import { Route } from '@angular/router';
import { DynamicHooksComponent, DynamicHooksInheritance, provideDynamicHooks } from '../../testing-api';
import { CONTENT_STRING } from './contentString';

@Component({
  selector: 'app-dynamicplanetspecies',
  template: `<div class="speciesDynamic">DYNAMIC PLANET SPECIES COMPONENT</div>`
})
export class DynamicPlanetSpeciesComponent {}

@Component({
  selector: 'app-planetspecies',
  imports: [DynamicHooksComponent],
  template: `<div class="species">
    Planet species component exists
    <ngx-dynamic-hooks [content]="contentString.value"></ngx-dynamic-hooks>
  </div>`,
  standalone: true
})
export class PlanetSpeciesComponent {
  constructor(public hostElement: ElementRef, @Inject(CONTENT_STRING) public contentString: any) {}
}

export const getPlanetSpeciesRoutes: () => Route[] = () => {
  return [
    { path: '', component: PlanetSpeciesComponent, providers: [
      provideDynamicHooks({
        parsers: [
          {component: DynamicPlanetSpeciesComponent}
        ],
        inheritance: DynamicHooksInheritance.None
      })
    ]}
  ];
}