import { RouterModule, Router } from '@angular/router';
import { TestBed, TestBedStatic, ComponentFixtureAutoDetect, ComponentFixture } from '@angular/core/testing';

// Testing api resources
import { provideDynamicHooks } from '../../testing-api';

// Resources
import { CONTENT_STRING, contentString } from '../../resources/forChild/contentString';
import { RootComponent, DynamicRootComponent } from '../../resources/forChild/root';
import { getPlanetsRoutes } from '../../resources/forChild/planets';
import { getStarsRoutes } from '../../resources/forChild/stars';
import { getHyperlaneRoutes } from '../../resources/forChild/hyperlanes';

export interface TestSetup {
  testBed: TestBedStatic;
  fixture: ComponentFixture<RootComponent>;
  rootComp: RootComponent;
}

export const createForChildTestingModule = (mode: 'lazy'|'sync') => {
  TestBed.resetTestingModule();

  // To run allsettings reset before loading child settings
  const rootHooksProviders = provideDynamicHooks({
    globalParsers: [
      {component: DynamicRootComponent}
    ]
  });

  TestBed.configureTestingModule({
    imports: [
      RouterModule.forRoot(mode === 'lazy' ?
        [
          { path: 'hyperlanes', children: getHyperlaneRoutes() },
          { path: 'stars', loadChildren: () => new Promise(resolve => resolve(getStarsRoutes())) },
          { path: 'planets', loadChildren: () => new Promise(resolve => resolve(getPlanetsRoutes(true))) }
        ] : [
          { path: 'hyperlanes', children: getHyperlaneRoutes() },
          { path: 'stars', children: getStarsRoutes() },
          { path: 'planets', children: getPlanetsRoutes(false) },
        ]
      )
    ],
    providers: [
      rootHooksProviders,
      { provide: ComponentFixtureAutoDetect, useValue: true },
      { provide: CONTENT_STRING, useValue: {value: contentString} }
    ]
  });

  const fixture = TestBed.createComponent(RootComponent);
  return {
    testBed: TestBed,
    fixture,
    rootComp: fixture.componentInstance
  };
}