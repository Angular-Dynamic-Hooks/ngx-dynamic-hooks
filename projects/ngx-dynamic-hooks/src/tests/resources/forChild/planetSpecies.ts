import { NgModule, ModuleWithProviders, Component, Inject, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DynamicHooksModule, DynamicHooksInheritance } from '../../testing-api';
import { CONTENT_STRING } from './contentString';

export function createPlanetSpeciesModuleSync() {
  @NgModule({
    declarations: [PlanetSpeciesComponent],
    exports: [PlanetSpeciesComponent],
    imports: [
      RouterModule.forChild([
        { path: 'species', component: PlanetSpeciesComponent }
      ]),
      createPlanetSpeciesModuleHooksImport()
    ]
  })
  class PlanetSpeciesModuleSync {}

  return PlanetSpeciesModuleSync;
}

export function createPlanetSpeciesModuleLazy() {
  @NgModule({
    declarations: [PlanetSpeciesComponent],
    exports: [PlanetSpeciesComponent],
    imports: [
      RouterModule.forChild([
        { path: '', component: PlanetSpeciesComponent }
      ]),
      createPlanetSpeciesModuleHooksImport()
    ]
  })
  class PlanetSpeciesModuleLazy {}

  return PlanetSpeciesModuleLazy;
}

function createPlanetSpeciesModuleHooksImport(): ModuleWithProviders<DynamicHooksModule> {
  return DynamicHooksModule.forChild({
    globalParsers: [
      {component: DynamicPlanetSpeciesComponent}
    ],
    lazyInheritance: DynamicHooksInheritance.None
  });
}

@Component({
  selector: 'app-planetspecies',
  template: `<div class="species">
    Planet species component exists
    <ngx-dynamic-hooks [content]="contentString.value"></ngx-dynamic-hooks>
  </div>`
})
export class PlanetSpeciesComponent {
  constructor(public hostElement: ElementRef, @Inject(CONTENT_STRING) public contentString: any) {}
}

@Component({
  selector: 'app-dynamicplanetspecies',
  template: `<div class="speciesDynamic">DYNAMIC PLANET SPECIES COMPONENT</div>`
})
export class DynamicPlanetSpeciesComponent {}