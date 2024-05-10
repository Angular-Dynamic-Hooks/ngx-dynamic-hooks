import { Component, ElementRef, Inject, ModuleWithProviders, Provider } from '@angular/core';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DynamicHooksComponent, DynamicHooksInheritance, provideDynamicHooksForChild } from '../../testing-api';
import { CONTENT_STRING } from './contentString';

export function createPlanetCitiesModuleSync() {
  @NgModule({
    providers: [
      createPlanetCitiesModuleHooksImport()
    ],
  })
  class PlanetCitiesModuleSync {}

  return PlanetCitiesModuleSync;
}

export function createPlanetCitiesModuleLazy() {
  @NgModule({
    imports: [
      RouterModule.forChild([
        { path: '', component: PlanetCitiesComponent }
      ])
    ],
    providers: [
      createPlanetCitiesModuleHooksImport()
    ]
  })
  class PlanetCitiesModuleLazy {}

  return PlanetCitiesModuleLazy;
}

function createPlanetCitiesModuleHooksImport(): Provider[] {
  return provideDynamicHooksForChild({
    globalParsers: [
      {component: DynamicPlanetCitiesComponent}
    ],
    globalOptions: {
      sanitize: false
    },
    lazyInheritance: DynamicHooksInheritance.Linear
  });
}

@Component({
  selector: 'app-planetcities',
  imports: [DynamicHooksComponent],
  template: `<div class="cities">
    Planet cities component exists
    <ngx-dynamic-hooks [content]="contentString.value"></ngx-dynamic-hooks>
  </div>`,
  standalone: true
})
export class PlanetCitiesComponent {
  constructor(
    public hostElement: ElementRef,
    @Inject(CONTENT_STRING) public contentString: any
  ) {}
}

@Component({
  selector: 'app-dynamicplanetcities',
  template: `<div class="citiesDynamic">DYNAMIC PLANET CITIES COMPONENT</div>`
})
export class DynamicPlanetCitiesComponent {}