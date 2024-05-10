import { NgModule, ModuleWithProviders, Component, Optional, Inject, ElementRef, OnInit, AfterViewInit, OnDestroy, Provider } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CONTENT_STRING } from './contentString';
import { PlanetCitiesComponent, createPlanetCitiesModuleSync, createPlanetCitiesModuleLazy } from './planetCities';
import { PlanetCountriesComponent, createPlanetCountriesModuleLazy, createPlanetCountriesModuleSync } from './planetCountries';
import { PlanetSpeciesComponent, createPlanetSpeciesModuleLazy, createPlanetSpeciesModuleSync } from './planetSpecies';
import { DynamicHooksComponent, provideDynamicHooksForChild } from '../../testing-api';

export function createPlanetsModuleSync() {
  // To register with allSettings before loading child imports
  const childModuleProviders = createPlanetsModuleHooksImport();

  @NgModule({
    imports: [
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
    ],
    providers: [
      childModuleProviders
    ]
  })
  class PlanetsModuleSync {}

  return PlanetsModuleSync;
}

export function createPlanetsModuleLazy() {
  @NgModule({
    imports: [
      RouterModule.forChild([{
        path: '',
        component: PlanetsComponent,
        children: [
          { path: 'countries', outlet: 'nestedOutlet', loadChildren: () => new Promise(resolve => resolve(createPlanetCountriesModuleLazy())) },
          { path: 'cities', outlet: 'nestedOutlet', loadChildren: () => new Promise(resolve => resolve(createPlanetCitiesModuleLazy())) },
          { path: 'species', outlet: 'nestedOutlet', loadChildren: () => new Promise(resolve => resolve(createPlanetSpeciesModuleLazy())) }
        ]
      }])
    ],
    providers: [
      createPlanetsModuleHooksImport()
    ]
  })
  class PlanetsModuleLazy {}

  return PlanetsModuleLazy;
}

function createPlanetsModuleHooksImport(): Provider[] {
  return provideDynamicHooksForChild({
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

@Component({
  selector: 'app-dynamicplanets',
  template: `<div class="planetsDynamic">DYNAMIC PLANETS COMPONENT</div>`
})
export class DynamicPlanetsComponent {}
