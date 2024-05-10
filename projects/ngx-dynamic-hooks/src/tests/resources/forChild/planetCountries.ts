import { NgModule, Component, ElementRef, Inject, ModuleWithProviders, Optional, Provider } from '@angular/core';
import { ComponentFixtureAutoDetect } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { DynamicHooksGlobalSettings, DynamicHooksInheritance, DYNAMICHOOKS_MODULESETTINGS, DYNAMICHOOKS_ANCESTORSETTINGS, DynamicHooksService, provideDynamicHooksForChild, DynamicHooksComponent } from '../../testing-api';
import { CONTENT_STRING } from './contentString';

export function createPlanetCountriesModuleSync() {
  @NgModule({
    providers: [
      createPlanetCountriesModuleHooksImport()
    ]
  })
  class PlanetCountriesModuleSync {}

  return PlanetCountriesModuleSync;
}

export function createPlanetCountriesModuleLazy() {
  @NgModule({
    imports: [
      RouterModule.forChild([
        { path: '', component: PlanetCountriesComponent }
      ])
      
    ],
    providers: [
      createPlanetCountriesModuleHooksImport(),
      { provide: ComponentFixtureAutoDetect, useValue: true },
    ]
  })
  class PlanetContriesModuleLazy {}

  return PlanetContriesModuleLazy;
}

function createPlanetCountriesModuleHooksImport(): Provider[] {
  return provideDynamicHooksForChild({
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
  imports: [DynamicHooksComponent],
  template: `<div class="countries">
    Planet countries component exists
    {{ contentString.value }}
    <ngx-dynamic-hooks [content]="contentString.value"></ngx-dynamic-hooks>
  </div>`,
  standalone: true
})
export class PlanetCountriesComponent {
  constructor(
    public hostElement: ElementRef,
    @Inject(CONTENT_STRING) public contentString: any,
    @Inject(DYNAMICHOOKS_ANCESTORSETTINGS) public ancestorSettings: DynamicHooksGlobalSettings[],
    @Inject(DYNAMICHOOKS_MODULESETTINGS) public moduleSettings: DynamicHooksGlobalSettings,
    public dynamicHooksService: DynamicHooksService
  ) {
  }
}

@Component({
  selector: 'app-dynamicplanetcountries',
  template: `<div class="countriesDynamic">DYNAMIC PLANET COUNTRIES COMPONENT</div>`
})
export class DynamicPlanetCountriesComponent {}

