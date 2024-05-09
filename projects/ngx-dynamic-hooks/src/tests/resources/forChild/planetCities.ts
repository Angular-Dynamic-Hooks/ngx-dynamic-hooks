import { Component, ElementRef, Inject, ModuleWithProviders } from '@angular/core';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DynamicHooksModule, DynamicHooksInheritance } from '../../testing-api';
import { CONTENT_STRING } from './contentString';

export function createPlanetCitiesModuleSync() {
  @NgModule({
    declarations: [PlanetCitiesComponent],
    exports: [PlanetCitiesComponent],
    imports: [
      createPlanetCitiesModuleHooksImport()
    ]
  })
  class PlanetCitiesModuleSync {}

  return PlanetCitiesModuleSync;
}

export function createPlanetCitiesModuleLazy() {
  @NgModule({
    declarations: [PlanetCitiesComponent],
    exports: [PlanetCitiesComponent],
    imports: [
      RouterModule.forChild([
        { path: '', component: PlanetCitiesComponent }
      ]),
      createPlanetCitiesModuleHooksImport()
    ]
  })
  class PlanetCitiesModuleLazy {}

  return PlanetCitiesModuleLazy;
}

function createPlanetCitiesModuleHooksImport(): ModuleWithProviders<DynamicHooksModule> {
  return DynamicHooksModule.forChild({
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
  template: `<div class="cities">
    Planet cities component exists
    <ngx-dynamic-hooks [content]="contentString.value"></ngx-dynamic-hooks>
  </div>`
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