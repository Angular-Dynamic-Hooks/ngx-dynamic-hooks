import { RouterModule, Router } from '@angular/router';
import { TestBed, TestBedStatic, ComponentFixtureAutoDetect, fakeAsync, tick, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

// Testing api resources
import { DynamicHooksModule, OutletService, DYNAMICHOOKS_ALLSETTINGS, SelectorHookParserConfig, DYNAMICHOOKS_ANCESTORSETTINGS } from '../testing-api';

// Resources
import { CONTENT_STRING, contentString } from '../resources/forChild/contentString';
import { RootComponent, DynamicRootComponent } from '../resources/forChild/root';
import { createPlanetsModuleHooksImport, PlanetsModuleSync, PlanetsComponent, PlanetsModuleLazy, DynamicPlanetsComponent } from '../resources/forChild/planets';
import { createPlanetCountriesModuleHooksImport, DynamicPlanetCountriesComponent, PlanetCountriesComponent } from '../resources/forChild/planetCountries';
import { createPlanetCitiesModuleHooksImport, DynamicPlanetCitiesComponent, PlanetCitiesComponent } from '../resources/forChild/planetCities';
import { createPlanetSpeciesModuleHooksImport, DynamicPlanetSpeciesComponent, PlanetSpeciesComponent } from '../resources/forChild/planetSpecies';
import { createStarsModuleHooksImport, StarsModuleSync, StarsModuleLazy, StarsComponent, DynamicStarsComponent } from '../resources/forChild/stars';
import { createHyperlanesModuleHooksImport, HyperlanesModuleSync, DynamicHyperlanesComponent } from '../resources/forChild/hyperlanes';

interface TestSetup {
  testBed: TestBedStatic;
  fixture: ComponentFixture<RootComponent>;
  rootComp: RootComponent;
}

const createTestingModuleSync: () => TestSetup = () => {
  // Rerun DynamicHooksModule.forChild()s of child modules to internally re-add settings to allSettings again after reset
  createHyperlanesModuleHooksImport();
  createStarsModuleHooksImport();
  createPlanetsModuleHooksImport();
  createPlanetCountriesModuleHooksImport();
  createPlanetCitiesModuleHooksImport();
  createPlanetSpeciesModuleHooksImport();

  // Load child modules synchronously via imports
  // When using normal module imports, the child module routing definitions are ABSOLUTE and simply added/merged at the top level to the already other existing routing config

  TestBed.configureTestingModule({
    imports: [
      HyperlanesModuleSync,
      PlanetsModuleSync,
      StarsModuleSync,
      RouterModule.forRoot([
        // All routes loaded via importing child modules
      ]),
      DynamicHooksModule.forRoot({
        globalParsers: [
          {component: DynamicRootComponent}
        ]
      })
    ],
    declarations: [
      RootComponent,
      PlanetsComponent
    ],
    providers: [
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
};

const createTestingModuleLazy: (rootSettings?: 'include'|'empty'|'none') => TestSetup = (rootSettings: 'include'|'empty'|'none' = 'include') => {
  // Load modules lazily via routing config
  // When using lazy-loading via routing, the child module routing definitions are RELATIVE to the path they are loaded under in the parent component. The first route is therefore typically '' and points to the main component

  // Hyperlanes is always a sync module even in lazy setup to test mixed child modules, so add settings to allSettings again after reset
  createHyperlanesModuleHooksImport();

  const imports = [
    HyperlanesModuleSync,
    RouterModule.forRoot([
      // Much like at start of in createTestingModuleSync, have to manually call createXModuleHooksImport() when lazy-loading a route like this, b/c we're not really using the import() syntax normally used in lazy-loaded routes.
      // In testing, we just create a promise and return the module to simulate that - but the module is already loaded of course. This is a problem b/c when running multiple tests and you call
      // DynamicHooksModule.reset() after each one, all settings are deleted for all modules. On the next test, if you didn't call createXModuleHooksImport() manually, the module settings wouldn't be repopulated again.
      { path: 'planets', loadChildren: () => new Promise(resolve => { createPlanetsModuleHooksImport(); resolve(PlanetsModuleLazy); }) },
      { path: 'stars', loadChildren: () => new Promise(resolve => { createStarsModuleHooksImport(); resolve(StarsModuleLazy); }) }
    ]),
  ];

  if (rootSettings !== 'none') {
    imports.push(
      DynamicHooksModule.forRoot(rootSettings === 'empty' ? {} : {
        globalParsers: [
          {component: DynamicRootComponent}
        ]
      })
    );
  } else {
    // Don't even init forRoot (for test with only calling forChild, which should throw error)
    imports.push({ngModule: DynamicHooksModule, providers: []});
  }

  TestBed.configureTestingModule({
    imports,
    declarations: [
      RootComponent
    ],
    providers: [
      { provide: ComponentFixtureAutoDetect, useValue: true },
      { provide: CONTENT_STRING, useValue: {value: contentString} },
    ]
  });

  const fixture = TestBed.createComponent(RootComponent);
  return {
    testBed: TestBed,
    fixture,
    rootComp: fixture.componentInstance
  };
};


// Tests
// #################################################################################


describe('forChild', () => {

  beforeEach(() => {
    TestBed.resetTestingModule();
    DynamicHooksModule.reset();
  });

  afterAll(() => {
    DynamicHooksModule.reset();
  });

  it('#should set up the sync child modules correctly', fakeAsync(() => {
    const setup = createTestingModuleSync();
    testModuleRoutingScaffolding(setup);
  }));

  it('#should set up the lazy child modules correctly', fakeAsync(() => {
    const setup = createTestingModuleLazy();
    testModuleRoutingScaffolding(setup);
  }));

  // Just test that routing config for the following tests works as expected in both sync/lazy mode and proper components are loaded
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

  it('#should correctly merge an array of settings objects into a single combined settings object', () => {
    const setup = createTestingModuleSync();
    const outletService = setup.testBed.inject(OutletService);
    const settingsArray = [
      {
        globalParsers: [{component: DynamicRootComponent}, {component: DynamicPlanetsComponent}],
        globalOptions: {sanitize: true, convertHTMLEntities: true, fixParagraphTags: true}
      },
      {
        globalParsers: [{component: DynamicPlanetsComponent}, {component: DynamicPlanetCountriesComponent}],
        globalOptions: {convertHTMLEntities: false, updateOnPushOnly: false}
      },
      {
        globalParsers: [{component: DynamicStarsComponent}],
        globalOptions: {convertHTMLEntities: true, fixParagraphTags: false, ignoreOutputAliases: true}
      }
    ];
    const mergedSettings = (outletService as any).mergeSettings(settingsArray);
    expect(mergedSettings).toEqual(
      {
        globalParsers: [{component: DynamicRootComponent}, {component: DynamicPlanetsComponent}, {component: DynamicPlanetsComponent}, {component: DynamicPlanetCountriesComponent}, {component: DynamicStarsComponent}],
        globalOptions: {sanitize: true, convertHTMLEntities: true, fixParagraphTags: false, updateOnPushOnly: false, ignoreOutputAliases: true}
      }
    );
  });

  it('#should correctly merge lazy child options when using DynamicHooksInheritance.All', fakeAsync(() => {
    const setup = createTestingModuleLazy();
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

    // Now, despite the settings of stars being the last ones added to allSettings and countries using DynamicHooksInheritance.All,
    // countries should still overwrite stars options with its ancestor (and finally its own) options
    const countriesComponent = setup.fixture.debugElement.query(By.directive(PlanetCountriesComponent)).componentInstance;
    expect(countriesComponent.outletService['resolveSettings']().globalOptions).toEqual({
      sanitize: true,
      convertHTMLEntities: true,
      fixParagraphTags: true,
      updateOnPushOnly: true,
      compareInputsByValue: true,
      compareOutputsByValue: true
    });
  }));

  it('#should correctly merge sync child options when using DynamicHooksInheritance.All', fakeAsync(() => {
    const setup = createTestingModuleSync();
    const outletService = setup.testBed.inject(OutletService);

    // In sync configs, all the settings of all child modules are added immediately to allSettings
    // Therefore, when merging options, it will be in the order of importing the modules / calling forRoot/forChild.
    // This is the expected merged options object based on the module import order used at the start of createTestingModuleSync():
    // stars > planets > countries > cities
    expect(outletService['resolveSettings']().globalOptions).toEqual({
      sanitize: false,
      convertHTMLEntities: true,
      fixParagraphTags: true,
      updateOnPushOnly: true,
      compareInputsByValue: true,
      compareOutputsByValue: true
    });
  }));

  it('#should merge child parsers based on inheritance in lazy config', fakeAsync(() => {
    const setup = createTestingModuleLazy();
    const router = setup.testBed.inject(Router);

    // Without specific route, should have loaded root settings and synchronously imported hyperlanes settings
    let html = setup.rootComp.hostElement.nativeElement.innerHTML;
    expect(html).toContain('DYNAMIC ROOT COMPONENT');
    expect(html).toContain('DYNAMIC HYPERLANES COMPONENT');
    expect(html).not.toContain('DYNAMIC STARS COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANETS COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET SPECIES COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET CITIES COMPONENT');

    // Stars has DynamicHooksInheritance.All, so should render everything that was loaded anywhere before (not much at this point)
    router.navigate(['stars']);
    tick(1000);
    setup.fixture.detectChanges();

    let starsComponent = setup.fixture.debugElement.query(By.directive(StarsComponent)).componentInstance;
    html = starsComponent.hostElement.nativeElement.innerHTML;
    expect(html).toContain('DYNAMIC ROOT COMPONENT');
    expect(html).toContain('DYNAMIC HYPERLANES COMPONENT');
    expect(html).toContain('DYNAMIC STARS COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANETS COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET SPECIES COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET CITIES COMPONENT');

    // Countries also has DynamicHooksInheritance.All, so should render all the previous plus self
    router.navigate(['planets', {outlets: {nestedOutlet: 'countries'}} ]);
    tick(1000);
    setup.fixture.detectChanges();

    let planetCountriesComponent = setup.fixture.debugElement.query(By.directive(PlanetCountriesComponent)).componentInstance;
    html = planetCountriesComponent.hostElement.nativeElement.innerHTML;
    expect(html).toContain('DYNAMIC ROOT COMPONENT');
    expect(html).toContain('DYNAMIC HYPERLANES COMPONENT');
    expect(html).toContain('DYNAMIC STARS COMPONENT');
    expect(html).toContain('DYNAMIC PLANETS COMPONENT');
    expect(html).toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET SPECIES COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET CITIES COMPONENT');

    // Planets has DynamicHooksInheritance.Linear, so should only render direct ancestors
    router.navigate(['planets', {outlets: {nestedOutlet: 'cities'}} ]);
    tick(1000);
    setup.fixture.detectChanges();

    const planetCitiesComponent = setup.fixture.debugElement.query(By.directive(PlanetCitiesComponent)).componentInstance;
    html = planetCitiesComponent.hostElement.nativeElement.innerHTML;
    expect(html).toContain('DYNAMIC ROOT COMPONENT');
    expect(html).not.toContain('DYNAMIC HYPERLANES COMPONENT');
    expect(html).not.toContain('DYNAMIC STARS COMPONENT');
    expect(html).toContain('DYNAMIC PLANETS COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET CITIES COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET SPECIES COMPONENT');

    // Species has DynamicHooksInheritance.None, so should only render own config
    router.navigate(['planets', {outlets: {nestedOutlet: 'species'}} ]);
    tick(1000);
    setup.fixture.detectChanges();

    const planetSpeciesComponent = setup.fixture.debugElement.query(By.directive(PlanetSpeciesComponent)).componentInstance;
    html = planetSpeciesComponent.hostElement.nativeElement.innerHTML;
    expect(html).not.toContain('DYNAMIC ROOT COMPONENT');
    expect(html).not.toContain('DYNAMIC HYPERLANES COMPONENT');
    expect(html).not.toContain('DYNAMIC STARS COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANETS COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET CITIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET SPECIES COMPONENT');

    // Come back to countries and stars. Previously loaded module settings should work now with DynamicHooksInheritance.All
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
    expect(html).toContain('DYNAMIC PLANET SPECIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET CITIES COMPONENT');

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
    expect(html).toContain('DYNAMIC PLANET SPECIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET CITIES COMPONENT');
  }));

  it('#should throw error if using forChild() without using forRoot()', (async () => {
    expect(() => {
      const setup = createTestingModuleLazy('none');
    }).toThrow(new Error('It seems you\'re trying to use ngx-dynamic-hooks without calling forRoot() on the main module first. Make sure to include this to register all needed services.'));
  }));

  it('#should load lazy child module settings even if root settings are empty', fakeAsync(() => {
    const setup = createTestingModuleLazy('empty');
    const router = setup.testBed.inject(Router);

    router.navigate(['planets', {outlets: {nestedOutlet: 'countries'}} ]);
    tick();
    setup.fixture.detectChanges();

    const planetCountriesComponent = setup.fixture.debugElement.query(By.directive(PlanetCountriesComponent)).componentInstance;
    let html = planetCountriesComponent.hostElement.nativeElement.innerHTML;
    expect(html).not.toContain('DYNAMIC ROOT COMPONENT');
    expect(html).toContain('DYNAMIC HYPERLANES COMPONENT');
    expect(html).not.toContain('DYNAMIC STARS COMPONENT');
    expect(html).toContain('DYNAMIC PLANETS COMPONENT');
    expect(html).toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET SPECIES COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET CITIES COMPONENT');

    // Planets has DynamicHooksInheritance.Linear, so should only render direct ancestors
    router.navigate(['planets', {outlets: {nestedOutlet: 'cities'}} ]);
    tick();
    setup.fixture.detectChanges();

    const planetCitiesComponent = setup.fixture.debugElement.query(By.directive(PlanetCitiesComponent)).componentInstance;
    html = planetCitiesComponent.hostElement.nativeElement.innerHTML;
    expect(html).not.toContain('DYNAMIC ROOT COMPONENT');
    expect(html).not.toContain('DYNAMIC HYPERLANES COMPONENT');
    expect(html).not.toContain('DYNAMIC STARS COMPONENT');
    expect(html).toContain('DYNAMIC PLANETS COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET CITIES COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET SPECIES COMPONENT');

    // Species has DynamicHooksInheritance.None, so should only render own config
    router.navigate(['planets', {outlets: {nestedOutlet: 'species'}} ]);
    tick();
    setup.fixture.detectChanges();

    const planetSpeciesComponent = setup.fixture.debugElement.query(By.directive(PlanetSpeciesComponent)).componentInstance;
    html = planetSpeciesComponent.hostElement.nativeElement.innerHTML;
    expect(html).not.toContain('DYNAMIC ROOT COMPONENT');
    expect(html).not.toContain('DYNAMIC HYPERLANES COMPONENT');
    expect(html).not.toContain('DYNAMIC STARS COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANETS COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
    expect(html).not.toContain('DYNAMIC PLANET CITIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET SPECIES COMPONENT');
  }));

  it('#should load and merge all child settings immediately in sync config', fakeAsync(() => {
    const setup = createTestingModuleSync();
    const allSettings = setup.testBed.inject(DYNAMICHOOKS_ALLSETTINGS);
    expect(Object.keys(allSettings).length).toBe(7);
    expect((allSettings[0].globalParsers![0] as SelectorHookParserConfig).component).toBe(DynamicHyperlanesComponent);
    expect((allSettings[1].globalParsers![0] as SelectorHookParserConfig).component).toBe(DynamicStarsComponent);
    expect((allSettings[2].globalParsers![0] as SelectorHookParserConfig).component).toBe(DynamicPlanetsComponent);
    expect((allSettings[3].globalParsers![0] as SelectorHookParserConfig).component).toBe(DynamicPlanetCountriesComponent);
    expect((allSettings[4].globalParsers![0] as SelectorHookParserConfig).component).toBe(DynamicPlanetCitiesComponent);
    expect((allSettings[5].globalParsers![0] as SelectorHookParserConfig).component).toBe(DynamicPlanetSpeciesComponent);
    expect((allSettings[6].globalParsers![0] as SelectorHookParserConfig).component).toBe(DynamicRootComponent);

    let html = setup.rootComp.hostElement.nativeElement.innerHTML;
    expect(html).toContain('DYNAMIC ROOT COMPONENT');
    expect(html).toContain('DYNAMIC HYPERLANES COMPONENT');
    expect(html).toContain('DYNAMIC STARS COMPONENT');
    expect(html).toContain('DYNAMIC PLANETS COMPONENT');
    expect(html).toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET SPECIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET CITIES COMPONENT');
  }));

  it('#should only have DynamicHooksInheritance.All work in sync config', fakeAsync(() => {
    const setup = createTestingModuleSync();
    const router = setup.testBed.inject(Router);
    const allSettings = setup.testBed.inject(DYNAMICHOOKS_ALLSETTINGS);
    const ancestorSettings = setup.testBed.inject(DYNAMICHOOKS_ANCESTORSETTINGS);

    router.navigate(['planets', {outlets: {nestedOutlet: 'countries'}} ]);
    tick(1000);
    setup.fixture.detectChanges();

    // When loading child settings synchronously, all providers are merged into the root injector, so the last ones loaded overwrites the previous ones
    // This has several implications
    const countriesComponent = setup.fixture.debugElement.query(By.directive(PlanetCountriesComponent)).componentInstance;
    let html = countriesComponent.hostElement.nativeElement.innerHTML;

    // Root moduleSettings are loaded last in test module. And b/c they're loaded last, they overwrite all other moduleSettings
    expect((allSettings[allSettings.length - 1].globalParsers![0] as SelectorHookParserConfig).component).toBe(DynamicRootComponent);
    expect((countriesComponent.moduleSettings.globalParsers[0] as SelectorHookParserConfig).component).toBe(DynamicRootComponent);

    // The same goes for ancestorSettings. There will only be a single ancestor settings object in the injector, and it will be that of the module which was loaded last (root in this case)
    expect(countriesComponent.ancestorSettings.length).toBe(1);
    expect(ancestorSettings.length).toBe(1);
    expect((countriesComponent.ancestorSettings[0].globalParsers[0] as SelectorHookParserConfig).component).toBe(DynamicRootComponent);
    expect((ancestorSettings[0].globalParsers![0] as SelectorHookParserConfig).component).toBe(DynamicRootComponent);

    // Since the last module settings overwrites all others, all components will use the same inheritance behaviour (DynamicHooksInheritance.All in the case of root settings)
    expect(html).toContain('DYNAMIC ROOT COMPONENT');
    expect(html).toContain('DYNAMIC HYPERLANES COMPONENT');
    expect(html).toContain('DYNAMIC STARS COMPONENT');
    expect(html).toContain('DYNAMIC PLANETS COMPONENT');
    expect(html).toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET SPECIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET CITIES COMPONENT');

    router.navigate(['planets', {outlets: {nestedOutlet: 'species'}} ]); // PlanetSpeciesComponent normally has DynamicHooksInheritance.None, but is overwritten here
    tick(1000);
    setup.fixture.detectChanges();
    const speciesComponent = setup.fixture.debugElement.query(By.directive(PlanetSpeciesComponent)).componentInstance;
    html = speciesComponent.hostElement.nativeElement.innerHTML;
    expect(html).toContain('DYNAMIC ROOT COMPONENT');
    expect(html).toContain('DYNAMIC HYPERLANES COMPONENT');
    expect(html).toContain('DYNAMIC STARS COMPONENT');
    expect(html).toContain('DYNAMIC PLANETS COMPONENT');
    expect(html).toContain('DYNAMIC PLANET COUNTRIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET SPECIES COMPONENT');
    expect(html).toContain('DYNAMIC PLANET CITIES COMPONENT');

    // Correspondingly, inheritance behaviour cannot be reliably selected on a per module basis when sync loading modules (and in the case of DynamicHooksInheritance.Linear, wouldn't even work at all)
    // B/c of this, this setting should be left alone so it defaults to the "All" behaviour, which still works in sync mode and ultimately works the same as defining all parsers/options in forRoot()
  }));
});

