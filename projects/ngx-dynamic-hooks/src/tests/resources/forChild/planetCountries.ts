import { NgModule, Component, ElementRef, Inject, ModuleWithProviders, Optional } from '@angular/core';
import { ComponentFixtureAutoDetect } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { DynamicHooksModule, DynamicHooksGlobalSettings, DynamicHooksInheritance, DYNAMICHOOKS_MODULESETTINGS, DYNAMICHOOKS_ANCESTORSETTINGS, OutletService } from '../../testing-api';
import { CONTENT_STRING } from './contentString';

export function createPlanetCountriesModuleSync() {
  @NgModule({
    declarations: [PlanetCountriesComponent],
    exports: [PlanetCountriesComponent],
    imports: [
      createPlanetCountriesModuleHooksImport()
    ]
  })
  class PlanetCountriesModuleSync {}

  return PlanetCountriesModuleSync;
}

export function createPlanetCountriesModuleLazy() {
  @NgModule({
    declarations: [PlanetCountriesComponent],
    exports: [PlanetCountriesComponent],
    imports: [
      RouterModule.forChild([
        { path: '', component: PlanetCountriesComponent }
      ]),
      createPlanetCountriesModuleHooksImport()
    ],
    providers: [
      { provide: ComponentFixtureAutoDetect, useValue: true },
    ]
  })
  class PlanetContriesModuleLazy {}

  return PlanetContriesModuleLazy;
}

function createPlanetCountriesModuleHooksImport(): ModuleWithProviders<DynamicHooksModule> {
  return DynamicHooksModule.forChild({
    globalParsers: [
      {component: DynamicPlanetCountriesComponent}
    ],
    globalOptions: {
      convertHTMLEntities: true,
      updateOnPushOnly: true,
      compareOutputsByValue: true
    },
    lazyInheritance: DynamicHooksInheritance.All
  });
}

@Component({
  selector: 'app-planetcountries',
  template: `<div class="countries">
    Planet countries component exists
    {{ contentString.value }}
    <ngx-dynamic-hooks [content]="contentString.value"></ngx-dynamic-hooks>
  </div>`
})
export class PlanetCountriesComponent {
  constructor(
    public hostElement: ElementRef,
    @Inject(CONTENT_STRING) public contentString: any,
    @Inject(DYNAMICHOOKS_ANCESTORSETTINGS) public ancestorSettings: DynamicHooksGlobalSettings[],
    @Inject(DYNAMICHOOKS_MODULESETTINGS) public moduleSettings: DynamicHooksGlobalSettings,
    public outletService: OutletService
  ) {
  }
}

@Component({
  selector: 'app-dynamicplanetcountries',
  template: `<div class="countriesDynamic">DYNAMIC PLANET COUNTRIES COMPONENT</div>`
})
export class DynamicPlanetCountriesComponent {}

