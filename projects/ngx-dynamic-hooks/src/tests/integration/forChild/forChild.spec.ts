import { RouterModule, Router } from '@angular/router';
import { TestBed, TestBedStatic, ComponentFixtureAutoDetect, fakeAsync, tick, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

// Testing api resources
import { DynamicHooksService, DYNAMICHOOKS_ALLSETTINGS, getOutletOptionDefaults, SelectorHookParser, allSettings, SelectorHookParserConfig, HookParser } from '../../testing-api';

// Resources
import { DynamicRootComponent } from '../../resources/forChild/root';
import { DynamicPlanetsComponent, PlanetsComponent } from '../../resources/forChild/planets';
import { DynamicPlanetCountriesComponent, PlanetCountriesComponent } from '../../resources/forChild/planetCountries';
import { DynamicPlanetCitiesComponent, DynamicPlanetCitiesElementInjectorComponent, PlanetCitiesComponent } from '../../resources/forChild/planetCities';
import { DynamicPlanetSpeciesComponent, PlanetSpeciesComponent } from '../../resources/forChild/planetSpecies';
import { StarsComponent, DynamicStarsComponent } from '../../resources/forChild/stars';
import { DynamicHyperlanesComponent, HyperlanesComponent } from '../../resources/forChild/hyperlanes';
import { SettingsResolver } from '../../../lib/services/settings/settingsResolver';
import { TestSetup, createForChildTestingModule } from './shared';

describe('forChild', () => {

  beforeAll(() => {
    // This is specifically for preventing PlanetCitiesComponent from immediately adding its component-level provider to allSettings when its esmodule is imported (before running any logic)
    // Instead, simply add the component-level provider when getPlanetCitiesRoutes() is called, which is realistic and can be controlled easily.
    allSettings.length = 0;
  });

  it('#should set up the sync child modules correctly', fakeAsync(() => {
    const setup = createForChildTestingModule('sync');
    testModuleRoutingScaffolding(setup);
  }));

  it('#should set up the lazy child modules correctly', fakeAsync(() => {
    const setup = createForChildTestingModule('lazy');
    testModuleRoutingScaffolding(setup);
  }));

  // To test that the routing config for the following tests works as expected in both sync/lazy mode. Doesn't test the hooks configs yet.
  function testModuleRoutingScaffolding(setup: TestSetup): void {
    const router = setup.testBed.inject(Router);
    expect(setup.fixture.nativeElement.innerHTML).toContain('Root component exists');

    router.navigate(['hyperlanes']);
    tick();
    setup.fixture.detectChanges(); // After router has loaded component, have to trigger change detection manually or it won't run lifecycle methods
    expect(setup.fixture.nativeElement.innerHTML).toContain('Hyperlanes component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Stars component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Planets component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Planet countries component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Planet cities component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Planet species component exists');

    router.navigate(['stars']);
    tick();
    setup.fixture.detectChanges();
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Hyperlanes component exists');
    expect(setup.fixture.nativeElement.innerHTML).toContain('Stars component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Planets component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Planet countries component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Planet cities component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Planet species component exists');

    router.navigate(['planets', {outlets: {nestedOutlet: 'countries'}} ]);
    tick();
    setup.fixture.detectChanges();
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Hyperlanes component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Stars component exists');
    expect(setup.fixture.nativeElement.innerHTML).toContain('Planets component exists');
    expect(setup.fixture.nativeElement.innerHTML).toContain('Planet countries component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Planet cities component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Planet species component exists');

    router.navigate(['planets', {outlets: {nestedOutlet: 'cities'}} ]);
    tick();
    setup.fixture.detectChanges();
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Hyperlanes component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Stars component exists');
    expect(setup.fixture.nativeElement.innerHTML).toContain('Planets component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Planet countries component exists');
    expect(setup.fixture.nativeElement.innerHTML).toContain('Planet cities component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Planet species component exists');

    router.navigate(['planets', {outlets: {nestedOutlet: 'species'}} ]);
    tick();
    setup.fixture.detectChanges();
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Hyperlanes component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Stars component exists');
    expect(setup.fixture.nativeElement.innerHTML).toContain('Planets component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Planet countries component exists');
    expect(setup.fixture.nativeElement.innerHTML).not.toContain('Planet cities component exists');
    expect(setup.fixture.nativeElement.innerHTML).toContain('Planet species component exists');
  }

  it('#should be able to merge an array of settings objects into a single combined settings object', () => {
    const setup = createForChildTestingModule('sync');
    const settingsResolver = setup.testBed.inject(SettingsResolver);
    const settingsArray = [
      {
        parsers: [{component: DynamicRootComponent}, {component: DynamicPlanetsComponent}],
        options: {sanitize: true, convertHTMLEntities: true, fixParagraphTags: true}
      },
      {
        parsers: [{component: DynamicPlanetsComponent}, {component: DynamicPlanetCountriesComponent}],
        options: {convertHTMLEntities: false, updateOnPushOnly: false}
      },
      {
        parsers: [{component: DynamicStarsComponent}],
        options: {convertHTMLEntities: true, fixParagraphTags: false, ignoreOutputAliases: true}
      }
    ];
    const mergedSettings = settingsResolver['mergeSettings'](settingsArray);
    expect(mergedSettings).toEqual(
      {
        parsers: [{component: DynamicRootComponent}, {component: DynamicPlanetsComponent}, {component: DynamicPlanetsComponent}, {component: DynamicPlanetCountriesComponent}, {component: DynamicStarsComponent}],
        options: {sanitize: true, convertHTMLEntities: true, fixParagraphTags: false, updateOnPushOnly: false, ignoreOutputAliases: true}
      }
    );
  });

  it('#should immediately merge sync child settings when using DynamicHooksInheritance.All', fakeAsync(() => {
    let setup = createForChildTestingModule('sync');
    const dynamicHooksService = setup.testBed.inject(DynamicHooksService);

    const mergedSettings = dynamicHooksService['settingsResolver'].resolve(
      '',
      dynamicHooksService['allSettings'], 
      dynamicHooksService['ancestorSettings'], 
      dynamicHooksService['moduleSettings'], 
      null, 
      null, 
      null, 
      null, 
      null
    );

    const loadedParsers = mergedSettings.parsers.map(parser => (<SelectorHookParser>parser).config.component).flat(10);

    // In sync configs, all provideDynamicHooksForChild functions are called immediately on app init, so allSettings is also immediately populated
    expect(loadedParsers.length).toBe(8);
    expect(loadedParsers.includes(DynamicRootComponent)).toBeTrue();
    expect(loadedParsers.includes(DynamicHyperlanesComponent)).toBeTrue();
    expect(loadedParsers.includes(DynamicStarsComponent)).toBeTrue();
    expect(loadedParsers.includes(DynamicPlanetsComponent)).toBeTrue();
    expect(loadedParsers.includes(DynamicPlanetCountriesComponent)).toBeTrue();
    expect(loadedParsers.includes(DynamicPlanetCitiesComponent)).toBeTrue();
    expect(loadedParsers.includes(DynamicPlanetCitiesElementInjectorComponent)).toBeTrue();
    expect(loadedParsers.includes(DynamicPlanetSpeciesComponent)).toBeTrue();

    // Therefore, when merging options, it will be in the order of calling provideDynamicHooksForChild
    // This is the expected merged settings object based on the module import order used at the start of createTestingModuleSync():
    // root > hyperlanes > stars > planets > countries > cities > species
    expect(mergedSettings.options).toEqual(jasmine.objectContaining({
      sanitize: false,
      convertHTMLEntities: true,
      fixParagraphTags: true,
      updateOnPushOnly: true,
      compareInputsByValue: true,
      compareOutputsByValue: true
    }));
  }));

  it('#should not immediately merge lazy child settings when using DynamicHooksInheritance.All', fakeAsync(() => {
    const setup = createForChildTestingModule('lazy');
    const dynamicHooksService = setup.testBed.inject(DynamicHooksService);

    const mergedSettings = dynamicHooksService['settingsResolver'].resolve(
      '',
      dynamicHooksService['allSettings'], 
      dynamicHooksService['ancestorSettings'], 
      dynamicHooksService['moduleSettings'], 
      null, 
      null, 
      null, 
      null, 
      null
    );

    const loadedParsers = mergedSettings.parsers.map(parser => (<SelectorHookParser>parser).config.component).flat(10);

    // Should only include root and hyperlane settings (which are sync-loaded)
    expect(loadedParsers.length).toBe(2);
    expect(loadedParsers.includes(DynamicRootComponent)).toBeTrue();
    expect(loadedParsers.includes(DynamicHyperlanesComponent)).toBeTrue();
    
    expect(mergedSettings.options).toEqual(getOutletOptionDefaults());
  }));

  it('#should prioritize ancestor options when using DynamicHooksInheritance.All', fakeAsync(() => {
    const setup = createForChildTestingModule('lazy');
    const router = setup.testBed.inject(Router);

    // Route to planets to load its settings
    router.navigate(['planets', {outlets: {nestedOutlet: 'countries'}} ]);
    tick(1000);
    setup.fixture.detectChanges();

    // Then to stars to load its settings
    router.navigate(['stars']);
    tick(1000);
    setup.fixture.detectChanges();

    // Route back
    router.navigate(['planets', {outlets: {nestedOutlet: 'countries'}} ]);
    tick(1000);
    setup.fixture.detectChanges();

    // Get child instance of dynamicHooksService from lazily-loaded child module and resolve options
    const childDynamicHooksService = setup.fixture.debugElement.query(By.directive(PlanetCountriesComponent)).componentInstance.dynamicHooksService as DynamicHooksService;
    const options = childDynamicHooksService['settingsResolver'].resolve('', childDynamicHooksService['allSettings'], childDynamicHooksService['ancestorSettings'], childDynamicHooksService['moduleSettings'], null, null, null, null, null).options;

    // With DynamicHooksInheritance.All, allSettings and ancestorSettings are merged, with ancestorSettings overwriting the former
    // Because of that, despite the settings of "stars" being the last ones added to allSettings, "countries" should still overwrite "stars" options with its ancestorOptions
    expect(options).toEqual(jasmine.objectContaining({
      sanitize: true,
      convertHTMLEntities: true,
      fixParagraphTags: true,
      updateOnPushOnly: true,
      compareInputsByValue: true,
      compareOutputsByValue: true
    }));
  }));

  it('#should prioritize settings from ElementInjectors to those from EnvironmentInjectors', fakeAsync(() => {
    const setup = createForChildTestingModule('lazy');
    const router = setup.testBed.inject(Router);

    router.navigate(['planets', {outlets: {nestedOutlet: 'cities'}} ]);
    tick(1000);
    setup.fixture.detectChanges();

    // Get ancestorSettings from PlanetCitiesComponent. It should have its own injector with its own DynamicHooksService, etc. (b/c of its uses forChild in its component-level-providers)
    const childDynamicHooksService = setup.fixture.debugElement.query(By.directive(PlanetCitiesComponent)).componentInstance.dynamicHooksService as DynamicHooksService;
    const ancestorSettings = childDynamicHooksService['ancestorSettings'];

    // When assembling ancestors, should first look through all ElementInjectors, then all EnvironmentInjectors. B/c of that, settings set directly in providers array of
    // PlanetCitiesComponent should be the first ones to be found.
    const ancestorParsers = ancestorSettings.map(settings => (settings.parsers![0] as SelectorHookParserConfig).component)
    expect(ancestorParsers.length).toBe(4);
    expect(ancestorParsers[0]).toBe(DynamicRootComponent);
    expect(ancestorParsers[1]).toBe(DynamicPlanetsComponent);
    expect(ancestorParsers[2]).toBe(DynamicPlanetCitiesComponent);
    expect(ancestorParsers[3]).toBe(DynamicPlanetCitiesElementInjectorComponent);
  }));

  it('#should correctly use inheritance for child settings in lazy config', fakeAsync(() => {
    testInheritance('lazy');
  }));

  it('#should correctly use inheritance for child settings in sync config', fakeAsync(() => {
    testInheritance('sync');
  }));

  // Testing inheritance by navigating around child routes and checking which settings are loaded/used
  function testInheritance (mode: 'lazy'|'sync') {
    const setup = mode === 'lazy' ? createForChildTestingModule('lazy') : createForChildTestingModule('sync');
    const router = setup.testBed.inject(Router);
    const allSettings = setup.testBed.inject(DYNAMICHOOKS_ALLSETTINGS);

    // Root (DynamicHooksInheritance.All)
    let html = setup.rootComp.hostElement.nativeElement.innerHTML;
    if (mode === 'lazy') {
      // In lazy config, should have loaded root and hyperlane settings only
      expect(html).toContain('DYNAMIC ROOT COMPONENT');
      expect(html).toContain('DYNAMIC HYPERLANES COMPONENT');
      expect(html).not.toContain('DYNAMIC STARS COMPONENT');
      expect(html).not.toContain('DYNAMIC PLANETS COMPONENT');
      expect(html).not.toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
      expect(html).not.toContain('DYNAMIC PLANET CITIES COMPONENT');
      expect(html).not.toContain('DYNAMIC PLANET CITIES FROM ELEMENTINJECTOR COMPONENT');
      expect(html).not.toContain('DYNAMIC PLANET SPECIES COMPONENT');      
    } else {
      // In sync config, should have loaded everything right away
      expect(html).toContain('DYNAMIC ROOT COMPONENT');
      expect(html).toContain('DYNAMIC HYPERLANES COMPONENT');
      expect(html).toContain('DYNAMIC STARS COMPONENT');
      expect(html).toContain('DYNAMIC PLANETS COMPONENT');
      expect(html).toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
      expect(html).toContain('DYNAMIC PLANET CITIES COMPONENT');
      expect(html).toContain('DYNAMIC PLANET CITIES FROM ELEMENTINJECTOR COMPONENT');
      expect(html).toContain('DYNAMIC PLANET SPECIES COMPONENT');
    }

    // Stars route (DynamicHooksInheritance.All)
    console.log('navigating to stars...');
    router.navigate(['stars']);
    tick(1000);
    setup.fixture.detectChanges();
    let starsComponent = setup.fixture.debugElement.query(By.directive(StarsComponent)).componentInstance;
    html = starsComponent.hostElement.nativeElement.innerHTML;

    if (mode === 'lazy') {
      // In lazy config, should now have loaded render root, hyperlanes and own settings
      expect(html).toContain('DYNAMIC ROOT COMPONENT');
      expect(html).toContain('DYNAMIC HYPERLANES COMPONENT');
      expect(html).toContain('DYNAMIC STARS COMPONENT');
      expect(html).not.toContain('DYNAMIC PLANETS COMPONENT');
      expect(html).not.toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
      expect(html).not.toContain('DYNAMIC PLANET CITIES COMPONENT');
      expect(html).not.toContain('DYNAMIC PLANET CITIES FROM ELEMENTINJECTOR COMPONENT');
      expect(html).not.toContain('DYNAMIC PLANET SPECIES COMPONENT');
    } else {
      // Same as before
      expect(html).toContain('DYNAMIC ROOT COMPONENT');
      expect(html).toContain('DYNAMIC HYPERLANES COMPONENT');
      expect(html).toContain('DYNAMIC STARS COMPONENT');
      expect(html).toContain('DYNAMIC PLANETS COMPONENT');
      expect(html).toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
      expect(html).toContain('DYNAMIC PLANET CITIES COMPONENT');
      expect(html).toContain('DYNAMIC PLANET CITIES FROM ELEMENTINJECTOR COMPONENT');
      expect(html).toContain('DYNAMIC PLANET SPECIES COMPONENT');
    }

    // Planets.countries route (DynamicHooksInheritance.All)
    router.navigate(['planets', {outlets: {nestedOutlet: 'countries'}} ]);
    tick(1000);
    setup.fixture.detectChanges();
    let planetCountriesComponent = setup.fixture.debugElement.query(By.directive(PlanetCountriesComponent)).componentInstance;
    html = planetCountriesComponent.hostElement.nativeElement.innerHTML;

    if (mode === 'lazy') {
      // In lazy config, should now additionally have loaded planet and planet contries settings
      expect(html).toContain('DYNAMIC ROOT COMPONENT');
      expect(html).toContain('DYNAMIC HYPERLANES COMPONENT');
      expect(html).toContain('DYNAMIC STARS COMPONENT');
      expect(html).toContain('DYNAMIC PLANETS COMPONENT');
      expect(html).toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
      expect(html).not.toContain('DYNAMIC PLANET CITIES COMPONENT');
      expect(html).not.toContain('DYNAMIC PLANET CITIES FROM ELEMENTINJECTOR COMPONENT');
      expect(html).not.toContain('DYNAMIC PLANET SPECIES COMPONENT');      
    } else {
      // Same as before
      expect(html).toContain('DYNAMIC ROOT COMPONENT');
      expect(html).toContain('DYNAMIC HYPERLANES COMPONENT');
      expect(html).toContain('DYNAMIC STARS COMPONENT');
      expect(html).toContain('DYNAMIC PLANETS COMPONENT');
      expect(html).toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
      expect(html).toContain('DYNAMIC PLANET CITIES COMPONENT');
      expect(html).toContain('DYNAMIC PLANET CITIES FROM ELEMENTINJECTOR COMPONENT');
      expect(html).toContain('DYNAMIC PLANET SPECIES COMPONENT');
    }

    // Planets.cities route (DynamicHooksInheritance.Linear)
    router.navigate(['planets', {outlets: {nestedOutlet: 'cities'}} ]);
    tick(1000);
    setup.fixture.detectChanges();
    const planetCitiesComponent = setup.fixture.debugElement.query(By.directive(PlanetCitiesComponent)).componentInstance;
    html = planetCitiesComponent.hostElement.nativeElement.innerHTML;

    // Should only render direct ancestors, no matter if lazy or sync
    expect(html).toContain('DYNAMIC ROOT COMPONENT');
    expect(html).not.toContain('DYNAMIC HYPERLANES COMPONENT');
    expect(html).not.toContain('DYNAMIC STARS COMPONENT');
    expect(html).toContain('DYNAMIC PLANETS COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET CITIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET CITIES FROM ELEMENTINJECTOR COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET SPECIES COMPONENT');

    console.log('LOADING UP SPECIES COMPONENT');

    // Planets.species route (DynamicHooksInheritance.None)
    router.navigate(['planets', {outlets: {nestedOutlet: 'species'}} ]);
    tick(1000);
    setup.fixture.detectChanges();
    const planetSpeciesComponent = setup.fixture.debugElement.query(By.directive(PlanetSpeciesComponent)).componentInstance;
    html = planetSpeciesComponent.hostElement.nativeElement.innerHTML;

    // Should only render own config, no matter if lazy or sync
    expect(html).not.toContain('DYNAMIC ROOT COMPONENT');
    expect(html).not.toContain('DYNAMIC HYPERLANES COMPONENT');
    expect(html).not.toContain('DYNAMIC STARS COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANETS COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET CITIES COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET CITIES FROM ELEMENTINJECTOR COMPONENT');
    expect(html).toContain('DYNAMIC PLANET SPECIES COMPONENT');

    // Come back to countries and stars. Even lazy config should now load everything as we have visited everything.
    router.navigate(['planets', {outlets: {nestedOutlet: 'countries'}} ]);
    tick(1000);
    setup.fixture.detectChanges();

    planetCountriesComponent = setup.fixture.debugElement.query(By.directive(PlanetCountriesComponent)).componentInstance;
    html = planetCountriesComponent.hostElement.nativeElement.innerHTML;
    expect(html).toContain('DYNAMIC ROOT COMPONENT');
    expect(html).toContain('DYNAMIC HYPERLANES COMPONENT');
    expect(html).toContain('DYNAMIC STARS COMPONENT');
    expect(html).toContain('DYNAMIC PLANETS COMPONENT');
    expect(html).toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET CITIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET CITIES FROM ELEMENTINJECTOR COMPONENT');
    expect(html).toContain('DYNAMIC PLANET SPECIES COMPONENT');

    router.navigate(['stars']);
    tick(1000);
    setup.fixture.detectChanges();

    starsComponent = setup.fixture.debugElement.query(By.directive(StarsComponent)).componentInstance;
    html = starsComponent.hostElement.nativeElement.innerHTML;
    expect(html).toContain('DYNAMIC ROOT COMPONENT');
    expect(html).toContain('DYNAMIC HYPERLANES COMPONENT');
    expect(html).toContain('DYNAMIC STARS COMPONENT');
    expect(html).toContain('DYNAMIC PLANETS COMPONENT');
    expect(html).toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET CITIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET CITIES FROM ELEMENTINJECTOR COMPONENT');
    expect(html).toContain('DYNAMIC PLANET SPECIES COMPONENT');
  } 

});

