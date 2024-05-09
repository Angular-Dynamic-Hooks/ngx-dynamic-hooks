import { NgModule, Component, ElementRef, Inject, ModuleWithProviders, Optional } from '@angular/core';
import { ComponentFixtureAutoDetect } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { DynamicHooksModule, DynamicHooksGlobalSettings, DynamicHooksInheritance, DYNAMICHOOKS_MODULESETTINGS, DYNAMICHOOKS_ANCESTORSETTINGS, OutletService } from '../../testing-api';
import { CONTENT_STRING } from './contentString';

@Component({
  selector: 'app-dynamicplanetcountries',
  template: `<div class="countriesDynamic">DYNAMIC PLANET COUNTRIES COMPONENT</div>`
})
export class DynamicPlanetCountriesComponent {}

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

export function createPlanetCountriesModuleHooksImport(): ModuleWithProviders<DynamicHooksModule> {
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

@NgModule({
  declarations: [PlanetCountriesComponent],
  exports: [PlanetCountriesComponent],
  imports: [
    createPlanetCountriesModuleHooksImport()
  ]
})
export class PlanetCountriesModuleSync {}

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
export class PlanetContriesModuleLazy {}


