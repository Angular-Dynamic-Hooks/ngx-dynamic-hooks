// Testing api resources
import { ComponentCreator, DynamicHooksComponent, DynamicHooksService, HookComponentData, HookValue, ParseResult, provideDynamicHooks } from '../testing-api';

// Custom testing resources
import { defaultBeforeEach } from './shared';
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';
import { Component, EnvironmentInjector, Injector, NgModule, createEnvironmentInjector } from '@angular/core';
import { Route, Router, RouterModule, RouterOutlet } from '@angular/router';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GENERICINJECTIONTOKEN } from '../resources/services/genericInjectionToken';
import { By } from '@angular/platform-browser';
import { GenericSingleTagStringParser } from '../resources/parsers/genericSingleTagStringParser';


describe('Injectors logic', () => {
  let testBed;
  let fixture: any;
  let comp: DynamicHooksComponent;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // ----------------------------------------------------------------------------

  it('#should use the injectors from DynamicHooksComponent by default. If not specified on manual use, fallback to root injectors', fakeAsync(() => {
    const testText = '[singletag-string]';

    // Create testing scaffolding: A root module with a lazily loaded child module
    // This is to create a separate (child module) environment injector, so the one injected into DynamicHooksComponent is different to the root one
    // We can then better test for when which of them is used
    @Component({
      selector: 'app-root',
      imports: [DynamicHooksComponent, RouterOutlet],
      template: `<div class="root">
        Root component loaded!
        <router-outlet></router-outlet>
      </div>`,
      standalone: true
    })
    class RootComponent {
      constructor() {}
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([
          { path: 'lazyRoute', loadChildren: () => new Promise(resolve => resolve(lazyRoute)) },
        ])
      ],
      providers: [
        provideDynamicHooks({parsers: [GenericSingleTagStringParser]})
      ]
    });

    @Component({
      selector: 'app-lazychild',
      imports: [DynamicHooksComponent],
      template: `<div class="lazyChild">
        Lazy child component loaded!
        <ngx-dynamic-hooks></ngx-dynamic-hooks>
      </div>`,
      standalone: true
    })
    class LazyChildComponent {
      constructor() {}
    }

    const lazyRoute: Route[] = [
      { path: '', component: LazyChildComponent, providers: [
        {provide: GENERICINJECTIONTOKEN, useValue: { name: 'ChildModuleService works!' } }
      ] }
    ];

    // Create app
    const fixture = TestBed.createComponent(RootComponent);
    const router = TestBed.inject(Router);
    const dynamicHooksService = TestBed.inject(DynamicHooksService);
    const componentCreator = TestBed.inject(ComponentCreator);
    spyOn(componentCreator, 'createComponent').and.callThrough();

    // Load lazy route
    router.navigate(['lazyRoute']);
    tick(1000);
    fixture.detectChanges();

    // Get DynHooksComponent from that lazy route
    const dynamicHooksComponent = fixture.debugElement.query(By.directive(DynamicHooksComponent)).componentInstance as DynamicHooksComponent;

    // Collect various injectors
    const rootModuleEnvInjector = TestBed.inject(EnvironmentInjector);
    const rootModuleInjector = TestBed.inject(Injector);
    const dynHooksEnvInjector = dynamicHooksComponent['environmentInjector'];
    const dynHooksInjector = dynamicHooksComponent['injector'];

    // Init DynHooksComponent normally. ComponentCreator should then use DynHooksComponent injectors.
    dynamicHooksComponent.content = testText;
    dynamicHooksComponent.ngOnChanges({content: true} as any);
    let latestArgs = (componentCreator.createComponent as any)['calls'].mostRecent().args;
    let latestUsedEnvInjector = latestArgs[6];
    let latestUsedInjector = latestArgs[7];

    expect(latestUsedEnvInjector).toEqual(dynHooksEnvInjector);
    expect(latestUsedInjector).toEqual(dynHooksInjector);

    // Test again directly via DynHooksService without passing injectors. ComponentCreator should then use root injectors.
    dynamicHooksService.parse(testText).subscribe((parseResult: ParseResult) => {
      let latestArgs = (componentCreator.createComponent as any)['calls'].mostRecent().args;
      let latestUsedEnvInjector = latestArgs[6];
      let latestUsedInjector = latestArgs[7];

      expect(latestUsedEnvInjector).toEqual(rootModuleEnvInjector);
      expect(latestUsedInjector).toEqual(rootModuleInjector);
    });
  }));

  it('#should use custom injectors if passed by parser', () => {
    const configureParser = function (injector: Injector|null = null, envInjector: EnvironmentInjector|null = null) {
      const compData: HookComponentData = {
        component: SingleTagTestComponent
      };
      if (injector) {
        compData.injector = injector;
      }
      if (envInjector) {
        compData.environmentInjector = envInjector;
      }

      let genericSingleTagParser = TestBed.inject(GenericSingleTagStringParser);
      genericSingleTagParser.onLoadComponent = (hookId: number, hookValue: HookValue, context: any, childNodes: Array<Element>) => compData;
    }

    const testText = `[singletag-string]`;

    comp.content = testText;
    comp.ngOnChanges({content: true} as any);
    
    // Should not be found as not provided anywhere
    expect(comp.hookIndex[1].componentRef!.instance.genericInjectionValue).toBeNull();

    // Set custom injector
    const customInjector = Injector.create({
      providers: [{provide: GENERICINJECTIONTOKEN, useValue: { name: 'injector test value' } }]
    });
    configureParser(customInjector);
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    // Should now be found
    expect(comp.hookIndex[1].componentRef!.instance.genericInjectionValue).toEqual({ name: 'injector test value' });

    // Should also work for custom env injector
    const customEnvInjector = createEnvironmentInjector(
      [{provide: GENERICINJECTIONTOKEN, useValue: { name: 'env injector test value' } }],
      TestBed.inject(EnvironmentInjector),
      'MyCustomEnvInjector'
    );
    configureParser(null, customEnvInjector);
    comp.content = testText;
    comp.ngOnChanges({content: true} as any);

    expect(comp.hookIndex[1].componentRef!.instance.genericInjectionValue).toEqual({ name: 'env injector test value' });
  });

});
