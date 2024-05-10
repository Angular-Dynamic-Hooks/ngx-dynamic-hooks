import { NgModule, ModuleWithProviders, Component, Inject, ElementRef, Provider } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DynamicHooksComponent, DynamicHooksInheritance, provideDynamicHooksForChild } from '../../testing-api';
import { CONTENT_STRING } from './contentString';

export function createPlanetSpeciesModuleSync() {
  @NgModule({
    imports: [
      RouterModule.forChild([
        { path: 'species', component: PlanetSpeciesComponent }
      ])
    ],
    providers: [
      createPlanetSpeciesModuleHooksImport()
    ]
  })
  class PlanetSpeciesModuleSync {}

  return PlanetSpeciesModuleSync;
}

export function createPlanetSpeciesModuleLazy() {
  @NgModule({
    imports: [
      RouterModule.forChild([
        { path: '', component: PlanetSpeciesComponent }
      ])      
    ],
    providers: [
      createPlanetSpeciesModuleHooksImport()
    ]
  })
  class PlanetSpeciesModuleLazy {}

  return PlanetSpeciesModuleLazy;
}

function createPlanetSpeciesModuleHooksImport(): Provider[] {
  return provideDynamicHooksForChild({
    globalParsers: [
      {component: DynamicPlanetSpeciesComponent}
    ],
    lazyInheritance: DynamicHooksInheritance.None
  });
}

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

@Component({
  selector: 'app-dynamicplanetspecies',
  template: `<div class="speciesDynamic">DYNAMIC PLANET SPECIES COMPONENT</div>`
})
export class DynamicPlanetSpeciesComponent {}