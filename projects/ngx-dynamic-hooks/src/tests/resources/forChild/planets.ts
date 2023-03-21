import { NgModule, ModuleWithProviders, Component, Optional, Inject, ElementRef, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DynamicHooksModule } from '../../testing-api';
import { CONTENT_STRING } from './contentString';
import { PlanetCitiesModuleSync, PlanetCitiesModuleLazy, createPlanetCitiesModuleHooksImport, PlanetCitiesComponent } from './planetCities';
import { PlanetCountriesModuleSync, PlanetContriesModuleLazy, createPlanetCountriesModuleHooksImport, PlanetCountriesComponent } from './planetCountries';
import { PlanetSpeciesModuleSync, PlanetSpeciesModuleLazy, createPlanetSpeciesModuleHooksImport, PlanetSpeciesComponent } from './planetSpecies';

@Component({
  selector: 'app-dynamicplanets',
  template: `<div class="planetsDynamic">DYNAMIC PLANETS COMPONENT</div>`
})
export class DynamicPlanetsComponent {}

@Component({
  selector: 'app-planets',
  template: `<div class="planets">
    <span>Planets component exists</span>
    <!-- Intentionally not rendering ngx-dynamic-hooks to test that Planets config is still included in DynamicHooksInheritance.All and DynamicHooksInheritance.Linear -->
    <router-outlet name="nestedOutlet"></router-outlet>
  </div>`
})
export class PlanetsComponent {
  constructor(public hostElement: ElementRef, @Inject(CONTENT_STRING) public contentString) {}
}

export function createPlanetsModuleHooksImport(): ModuleWithProviders<DynamicHooksModule> {
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

@NgModule({
  declarations: [PlanetsComponent],
  exports: [PlanetsComponent],
  imports: [
    PlanetCountriesModuleSync,
    PlanetCitiesModuleSync,
    PlanetSpeciesModuleSync,
    RouterModule.forChild([{
      path: 'planets/m',
      component: PlanetsComponent,
      children: [
        { path: 'countries', outlet: 'nestedOutlet', component: PlanetCountriesComponent },
        { path: 'cities', outlet: 'nestedOutlet', component: PlanetCitiesComponent },
        { path: 'species', outlet: 'nestedOutlet', component: PlanetSpeciesComponent }
      ]
    }]),
    createPlanetsModuleHooksImport()
  ]
})
export class PlanetsModuleSync {}

@NgModule({
  declarations: [PlanetsComponent],
  exports: [PlanetsComponent],
  imports: [
    RouterModule.forChild([{
      path: 'm',  // Bugfix: Named router-outlet-routes from lazily loaded modules (like this one) need a non-empty parent path, other it won't find the routes. So adding 'm(odule)' as a placeholder.
      component: PlanetsComponent,
      children: [
        { path: 'countries', outlet: 'nestedOutlet', loadChildren: () => new Promise(resolve => { createPlanetCountriesModuleHooksImport(); resolve(PlanetContriesModuleLazy); }) },
        { path: 'cities', outlet: 'nestedOutlet', loadChildren: () => new Promise(resolve => { createPlanetCitiesModuleHooksImport(); resolve(PlanetCitiesModuleLazy); }) },
        { path: 'species', outlet: 'nestedOutlet', loadChildren: () => new Promise(resolve => { createPlanetSpeciesModuleHooksImport(); resolve(PlanetSpeciesModuleLazy); }) }
      ]
    }]),
    createPlanetsModuleHooksImport()
  ]
})
export class PlanetsModuleLazy {}