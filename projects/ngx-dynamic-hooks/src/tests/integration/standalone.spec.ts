// Testing api resources
import { AutoPlatformService, PlatformService, anchorElementTag, parseHooks, provideDynamicHooks, resetDynamicHooks } from '../testing-api';

// Custom testing resources
import { Injector } from '@angular/core';
import { MultiTagTestComponent } from '../resources/components/multiTagTest/multiTagTest.c';
import { WhateverTestComponent } from '../resources/components/whateverTest/whateverTest.c';
import { provideGlobally, provideScope, resetGlobalProviders } from '../../lib/standalone';
import { createApplication } from '@angular/platform-browser';

describe('Standalone usage', () => {

  beforeEach(() => {
    resetDynamicHooks();
    resetGlobalProviders();
  });

  // ----------------------------------------------------------------------------

  it('#should use the content and parsers params correctly', async () => {
    // Test both string hook and element hook with inputs
    const testText = `
      <p>Some generic paragraph</p>
      [whatevertest [config]="{someProp: 123}"]
      <multitagtest [genericInput]="'This is some input text!'"></multitagtest>      
    `;
    const context = {};
    const parsers = [
      MultiTagTestComponent,
      {
        component: WhateverTestComponent,
        bracketStyle: {opening: '[', closing: ']'},
        enclosing: false
      }
    ];

    const result = await parseHooks(testText, parsers, context);
    const hookIndex = result.hookIndex;
    const element = result.element;

    expect(Object.keys(hookIndex).length).toBe(2);
    expect(hookIndex[1].componentRef!.instance.constructor.name).toBe('WhateverTestComponent');
    expect(hookIndex[1].componentRef!.instance.config).toEqual({someProp: 123});
    expect(hookIndex[2].componentRef!.instance.constructor.name).toBe('MultiTagTestComponent');
    expect(hookIndex[2].componentRef!.instance.genericInput).toBe('This is some input text!');
    
    expect(element.children[0].tagName).toBe('P');
    expect(element.children[0].textContent).toBe('Some generic paragraph');
    expect(element.children[1].tagName).toBe(anchorElementTag.toUpperCase());
    expect(element.children[1].children[0].classList.contains('whatever-component')).toBeTrue();
    expect(element.children[2].tagName).toBe('MULTITAGTEST');
    expect(element.children[2].children[0].classList.contains('multitag-component')).toBeTrue();
  });
  
  it('#should use the context param correctly', async () => {
    const testText = `<multitagtest></multitagtest>`;
    const context = {someProp: 'hello there!'};
    const parsers = [MultiTagTestComponent];

    const result = await parseHooks(testText, parsers, context);

    expect(result.context).toBe(context);
  });

  it('#should use the options param correctly', async () => {
    const testText = `<multitagtest>With some dubious <span id="someId">element</span><script>console.log('and a script tag');</script></multitagtest>`;
    const context = {};
    const parsers = [MultiTagTestComponent];

    const resultOne = await parseHooks(testText, parsers, context, {sanitize: true});

    expect(resultOne.element.innerHTML).not.toContain('<script>');
    const spanElOne = resultOne.element.querySelector('span');
    expect(spanElOne!.getAttribute('id')).toBeNull();    
    expect(spanElOne!.innerHTML).toContain('element');

    const resultTwo = await parseHooks(testText, parsers, context, {sanitize: false});

    expect(resultTwo.element.innerHTML).toContain('<script>');
    const spanElTwo = resultTwo.element.querySelector('span');
    expect(spanElTwo!.getAttribute('id')).not.toBeNull();
    expect(spanElTwo!.innerHTML).toContain('element');
  });

  it('#should use the targetElement param correctly', async () => {
    const testText = `<multitagtest></multitagtest>`;
    const context = {};
    const parsers = [MultiTagTestComponent];

    const div = document.createElement('div');

    const result = await parseHooks(testText, parsers, context, null, div);

    expect(result.element).toBe(div);
  });
  
  it('#should use the targetHookIndex param correctly', async () => {
    const testText = `<multitagtest></multitagtest>`;
    const context = {};
    const parsers = [MultiTagTestComponent];

    const hookIndex = {};

    const result = await parseHooks(testText, parsers, context, null, null, hookIndex);

    expect(result.hookIndex).toBe(hookIndex);
  });

  it('#should use the environmentInjector param correctly', async () => {
    const testText = `<multitagtest></multitagtest>`;
    const context = {};
    const parsers = [MultiTagTestComponent];

    class CustomService { content = 'Custom service works!' };
    const app = await createApplication({
      providers: [
        provideDynamicHooks({}),
        CustomService
      ]
    });
    const customInjector = app.injector;

    // Test with parseHooks
    class GlobalService { content = 'Global service works!' };
    provideGlobally([GlobalService]);

    const result = await parseHooks(testText, parsers, context, null, null, {}, customInjector);
    expect(result.usedEnvironmentInjector).toBe(customInjector);
    expect(result.usedEnvironmentInjector.get(CustomService).content).toBe('Custom service works!');

    // Global providers should be overwritten and not available
    let globalService;
    try  {
      globalService = result.usedEnvironmentInjector.get(GlobalService);
    } catch (e) {}
    expect(globalService).toBeUndefined();

    // Test with scope.parseHooks
    class ScopeService { content = 'A service that is provided in a scope.' };
    const scope = provideScope([ScopeService]);

    const scopedResult = await scope.parseHooks(testText, parsers, context, null, null, {}, customInjector);
    expect(scopedResult.usedEnvironmentInjector).toBe(customInjector);
    expect(scopedResult.usedEnvironmentInjector.get(CustomService).content).toBe('Custom service works!');

    // Scope providers should be overwritten and not available
    let scopeService;
    try  {
      scopeService = scopedResult.usedEnvironmentInjector.get(ScopeService);
    } catch (e) {}
    expect(scopeService).toBeUndefined();
  });

  it('#should load a custom platformService', async () => {
    const testText = `<multitagtest></multitagtest>`;
    const context = {};
    const parsers = [MultiTagTestComponent];

    class UserPlatformService implements PlatformService {
      getTagName(element: any) {
        return 'TESTTAGNAME';
      }  
    }
    provideGlobally([], UserPlatformService);

    const result = await parseHooks(testText, parsers, context);

    // Make sure AutoPlatformService used UserPlatformService method
    const autoPlatformService = result.usedEnvironmentInjector.get(AutoPlatformService);
    const tagName = autoPlatformService.getTagName(document.createElement('div'));
    expect(tagName).toBe('TESTTAGNAME');
  });

  it('#should load global providers', async () => {
    const testText = `<multitagtest></multitagtest>`;
    const context = {};
    const parsers = [MultiTagTestComponent];

    class GlobalService { content = 'Global service works!' };
    provideGlobally([GlobalService]);

    const result = await parseHooks(testText, parsers, context);
    const component: MultiTagTestComponent = result.hookIndex[1].componentRef?.instance as MultiTagTestComponent;
    expect(component.injector.get(GlobalService).content).toBe('Global service works!');
  });

  it('#should load (multiple levels of) scoped providers', async () => {
    const testText = `<multitagtest></multitagtest>`;
    const context = {};
    const parsers = [MultiTagTestComponent];

    class GlobalService { content = 'Global service works!' };
    provideGlobally([GlobalService]);

    class FirstScopeService { content = 'First scope service works!' };
    const firstScope = provideScope([FirstScopeService]);

    class SecondScopeService { content = 'Second scope service works!' };
    const secondScope = provideScope([SecondScopeService], firstScope);

    class ThirdScopeService { content = 'Third scope service works!' };
    const thirdScope = provideScope([ThirdScopeService], secondScope);
    
    class ApartScopeService { content = 'Apart scope service works!' };
    const apartScope = provideScope([ApartScopeService]);

    const get = (injector: Injector, token: any) => {
      try {
        return injector.get(token);
      } catch (e) {
        return undefined;
      }
    }

    // Load all components
    const noScopeResult = await parseHooks(testText, parsers, context);
    const noScopeComponent: MultiTagTestComponent = noScopeResult.hookIndex[1].componentRef?.instance as MultiTagTestComponent;

    const firstScopeResult = await firstScope.parseHooks(testText, parsers, context);
    const firstScopeComponent: MultiTagTestComponent = firstScopeResult.hookIndex[1].componentRef?.instance as MultiTagTestComponent;

    const secondScopeResult = await secondScope.parseHooks(testText, parsers, context);
    const secondScopeComponent: MultiTagTestComponent = secondScopeResult.hookIndex[1].componentRef?.instance as MultiTagTestComponent;

    const thirdScopeResult = await thirdScope.parseHooks(testText, parsers, context);
    const thirdScopeComponent: MultiTagTestComponent = thirdScopeResult.hookIndex[1].componentRef?.instance as MultiTagTestComponent;

    const apartScopeResult = await apartScope.parseHooks(testText, parsers, context);
    const apartScopeComponent: MultiTagTestComponent = apartScopeResult.hookIndex[1].componentRef?.instance as MultiTagTestComponent;

    // Each component should only have access to its expected scopes
    expect(get(noScopeComponent.injector, GlobalService).content).toBe('Global service works!');
    expect(get(noScopeComponent.injector, FirstScopeService)).toBeUndefined();
    expect(get(noScopeComponent.injector, SecondScopeService)).toBeUndefined();
    expect(get(noScopeComponent.injector, ThirdScopeService)).toBeUndefined();
    expect(get(noScopeComponent.injector, ApartScopeService)).toBeUndefined();

    expect(get(firstScopeComponent.injector, GlobalService).content).toBe('Global service works!');
    expect(get(firstScopeComponent.injector, FirstScopeService).content).toBe('First scope service works!');
    expect(get(firstScopeComponent.injector, SecondScopeService)).toBeUndefined();
    expect(get(firstScopeComponent.injector, ThirdScopeService)).toBeUndefined();
    expect(get(firstScopeComponent.injector, ApartScopeService)).toBeUndefined();

    expect(get(secondScopeComponent.injector, GlobalService).content).toBe('Global service works!');
    expect(get(secondScopeComponent.injector, FirstScopeService).content).toBe('First scope service works!');
    expect(get(secondScopeComponent.injector, SecondScopeService).content).toBe('Second scope service works!');
    expect(get(secondScopeComponent.injector, ThirdScopeService)).toBeUndefined();
    expect(get(secondScopeComponent.injector, ApartScopeService)).toBeUndefined();

    expect(get(thirdScopeComponent.injector, GlobalService).content).toBe('Global service works!');
    expect(get(thirdScopeComponent.injector, FirstScopeService).content).toBe('First scope service works!');
    expect(get(thirdScopeComponent.injector, SecondScopeService).content).toBe('Second scope service works!');
    expect(get(thirdScopeComponent.injector, ThirdScopeService).content).toBe('Third scope service works!');
    expect(get(thirdScopeComponent.injector, ApartScopeService)).toBeUndefined();

    expect(get(apartScopeComponent.injector, GlobalService).content).toBe('Global service works!');
    expect(get(apartScopeComponent.injector, FirstScopeService)).toBeUndefined();
    expect(get(apartScopeComponent.injector, SecondScopeService)).toBeUndefined();
    expect(get(apartScopeComponent.injector, ThirdScopeService)).toBeUndefined();
    expect(get(apartScopeComponent.injector, ApartScopeService).content).toBe('Apart scope service works!');
  });

  it('#should share and reuse the global injector across multiple parseHooks uses', async () => {
    const testText = `<multitagtest></multitagtest>`;
    const context = {};
    const parsers = [MultiTagTestComponent];

    // First parse
    const resultOne = await parseHooks(testText, parsers, context);
    const resultOneInjector = resultOne.usedEnvironmentInjector;
    const resultOneService = (resultOne.hookIndex[1].componentRef?.instance as MultiTagTestComponent).rootTestService;

    // Second parse
    const resultTwo = await parseHooks(testText, parsers, context);
    const resultTwoInjector = resultTwo.usedEnvironmentInjector;
    const resultTwoService = (resultTwo.hookIndex[1].componentRef?.instance as MultiTagTestComponent).rootTestService;

    expect(resultTwoInjector).toBe(resultOneInjector);
    expect(resultTwoService as any).not.toBe(null);
    expect(resultTwoService).toBe(resultOneService);
  });

  it('#should share and reuse scoped injectors across multiple scope.parseHooks uses', async () => {
    const testText = `<multitagtest></multitagtest>`;
    const context = {};
    const parsers = [MultiTagTestComponent];

    class ScopedService { content = 'A service that is provided in a scope.' }
    const scope = provideScope([ScopedService]);

    // First parse
    const resultOne = await scope.parseHooks(testText, parsers, context);
    const resultOneInjector = resultOne.usedEnvironmentInjector;
    const resultOneService = resultOneInjector.get(ScopedService);

    // Second parse
    const resultTwo = await scope.parseHooks(testText, parsers, context);
    const resultTwoInjector = resultTwo.usedEnvironmentInjector;
    const resultTwoService = resultTwoInjector.get(ScopedService);

    expect(resultTwoInjector).toBe(resultOneInjector);
    expect(resultTwoService).toBe(resultOneService);
  });
  
  it('#should be able to reset all resolved injectors', async () => {
    const testText = `<multitagtest></multitagtest>`;
    const context = {};
    const parsers = [MultiTagTestComponent];

    // Initial parse. Modify providers.
    const result = await parseHooks(testText, parsers, context);
    const component: MultiTagTestComponent = result.hookIndex[1].componentRef?.instance as MultiTagTestComponent;
    const rootTestService = component.rootTestService;
    rootTestService.someString = 'RootTestService has been modified!';

    // Initial scoped parse. Modify providers.
    class ScopeTestService {
      content: string = 'Scope service works!';
    }
    const scope = provideScope([ScopeTestService]);
    const scopedResult = await scope.parseHooks(testText, parsers, context);
    const scopedComponent = (scopedResult.hookIndex[1].componentRef?.instance as MultiTagTestComponent);
    const scopedService = scopedComponent.injector.get(ScopeTestService);
    scopedService.content = 'Scoped service was modified!';

    // Reset!
    resetGlobalProviders();

    // Second parse. Should freshly re-resolve injectors/providers, so everything should be defaults again.
    const resetResult = await parseHooks(testText, parsers, context);
    const secondParseComponent: MultiTagTestComponent = resetResult.hookIndex[1].componentRef?.instance as MultiTagTestComponent;
    expect(secondParseComponent.rootTestService).not.toBe(rootTestService);
    expect(secondParseComponent.rootTestService.someString).toBe('RootTestService works!');

    // Second scoped parse
    const resetScopedResult = await scope.parseHooks(testText, parsers, context);
    const resetScopedService = (resetScopedResult.hookIndex[1].componentRef?.instance as MultiTagTestComponent).injector.get(ScopeTestService);
    expect(resetScopedService).not.toBe(scopedService);
    expect(resetScopedService.content).toBe('Scope service works!');
  });

  it('#should reset when providing global providers again', async () => {
    const testText = `<multitagtest></multitagtest>`;
    const context = {};
    const parsers = [MultiTagTestComponent];

    class FirstService {}
    provideGlobally([FirstService]);
    const firstResult = await parseHooks(testText, parsers, context);
    const firstComponent: MultiTagTestComponent = firstResult.hookIndex[1].componentRef?.instance as MultiTagTestComponent;
    expect(firstComponent.injector.get(FirstService)).not.toBeUndefined();

    // Reset via provideGlobally
    class SecondService {}
    provideGlobally([SecondService]);
    const secondResult = await parseHooks(testText, parsers, context);
    const secondComponent: MultiTagTestComponent = secondResult.hookIndex[1].componentRef?.instance as MultiTagTestComponent;
    let firstService;
    try {
      firstService = secondComponent.injector.get(FirstService);
    } catch (e) {}

    // First service should be gone, second service should exist
    expect(firstService).toBeUndefined();
    expect(secondComponent.injector.get(SecondService)).not.toBeUndefined();
  });

});
