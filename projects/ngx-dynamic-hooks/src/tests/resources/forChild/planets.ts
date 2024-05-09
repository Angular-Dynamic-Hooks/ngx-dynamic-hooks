import { NgModule, ModuleWithProviders, Component, Optional, Inject, ElementRef, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DynamicHooksModule } from '../../testing-api';
import { CONTENT_STRING } from './contentString';
import { PlanetCitiesComponent, createPlanetCitiesModuleSync, createPlanetCitiesModuleLazy } from './planetCities';
import { PlanetCountriesComponent, createPlanetCountriesModuleLazy, createPlanetCountriesModuleSync } from './planetCountries';
import { PlanetSpeciesComponent, createPlanetSpeciesModuleLazy, createPlanetSpeciesModuleSync } from './planetSpecies';

export function createPlanetsModuleSync() {
  @NgModule({
    declarations: [PlanetsComponent],
    exports: [PlanetsComponent],
    imports: [
      createPlanetsModuleHooksImport(),
      createPlanetCountriesModuleSync(),
      createPlanetCitiesModuleSync(),
      createPlanetSpeciesModuleSync(),
      RouterModule.forChild([{
        path: 'planets', component: PlanetsComponent,
        children: [
          { path: 'countries', outlet: 'nestedOutlet', component: PlanetCountriesComponent },
          { path: 'cities', outlet: 'nestedOutlet', component: PlanetCitiesComponent },
          { path: 'species', outlet: 'nestedOutlet', component: PlanetSpeciesComponent }
        ]
      }])
    ]
  })
  class PlanetsModuleSync {}

  return PlanetsModuleSync;
}

export function createPlanetsModuleLazy() {
  @NgModule({
    declarations: [PlanetsComponent],
    exports: [PlanetsComponent],
    imports: [
      RouterModule.forChild([{
        path: '',
        component: PlanetsComponent,
        children: [
          { path: 'countries', outlet: 'nestedOutlet', loadChildren: () => new Promise(resolve => resolve(createPlanetCountriesModuleLazy())) },
          { path: 'cities', outlet: 'nestedOutlet', loadChildren: () => new Promise(resolve => resolve(createPlanetCitiesModuleLazy())) },
          { path: 'species', outlet: 'nestedOutlet', loadChildren: () => new Promise(resolve => resolve(createPlanetSpeciesModuleLazy())) }
        ]
      }]),
      createPlanetsModuleHooksImport()
    ]
  })
  class PlanetsModuleLazy {}

  return PlanetsModuleLazy;
}

function createPlanetsModuleHooksImport(): ModuleWithProviders<DynamicHooksModule> {
  return DynamicHooksModule.forChild({
    globalParsers: [
      {component: DynamicPlanetsComponent}
    ],
    globalOptions: {
      sanitize: true,
      updateOnPushOnly: false,
      compareInputsByValue: true
    }
  });
}

@Component({
  selector: 'app-planets',
  template: `<div class="planets">
    <span>Planets component exists</span>
    <!-- Intentionally not rendering ngx-dynamic-hooks to test that Planets config is still included in DynamicHooksInheritance.All and DynamicHooksInheritance.Linear -->
    <router-outlet name="nestedOutlet"></router-outlet>
  </div>`
})
export class PlanetsComponent {
  constructor(public hostElement: ElementRef, @Inject(CONTENT_STRING) public contentString: any) {}
}

@Component({
  selector: 'app-dynamicplanets',
  template: `<div class="planetsDynamic">DYNAMIC PLANETS COMPONENT</div>`
})
export class DynamicPlanetsComponent {}
