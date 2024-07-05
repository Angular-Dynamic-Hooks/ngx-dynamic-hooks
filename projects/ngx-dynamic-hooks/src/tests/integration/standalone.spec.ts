// Testing api resources
import { AutoPlatformService, PlatformService, anchorElementTag, parseHooks, provideDynamicHooks, resetDynamicHooks } from '../testing-api';

// Custom testing resources
import { Injector } from '@angular/core';
import { MultiTagTestComponent } from '../resources/components/multiTagTest/multiTagTest.c';
import { WhateverTestComponent } from '../resources/components/whateverTest/whateverTest.c';
import { createProviders, destroyAll } from '../../lib/standalone';
import { createApplication } from '@angular/platform-browser';
import { RootTestService } from '../resources/services/rootTestService';

const getService = (injector: Injector, token: any) => {
  try {
    return injector.get(token);
  } catch (e) {
    return undefined;
  }
}

describe('Standalone usage', () => {

  beforeEach(() => {
    resetDynamicHooks();
    destroyAll();
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

    class CustomInjectorService { content = 'Custom injector service works!' };
    const app = await createApplication({
      providers: [
        CustomInjectorService
      ]
    });
    const customInjector = app.injector;

    // Test independently
    const resultOne = await parseHooks(testText, parsers, context);
    const originalRootTestService = getService(resultOne.usedEnvironmentInjector, RootTestService);
    originalRootTestService.someString = 'This was modified!';
    expect(originalRootTestService.someString).toBe('This was modified!');
    expect(getService(resultOne.usedEnvironmentInjector, CustomInjectorService)).toBeUndefined();

    // When using custom injector, should create separate instance of RootTestService with default values
    const resultTwo = await parseHooks(testText, parsers, context, null, null, {}, customInjector);
    expect(getService(resultTwo.usedEnvironmentInjector, RootTestService)).not.toBe(originalRootTestService);
    expect(getService(resultTwo.usedEnvironmentInjector, RootTestService).someString).toBe('RootTestService works!');
    expect(getService(resultTwo.usedEnvironmentInjector, CustomInjectorService)).not.toBeUndefined();
    expect(getService(resultTwo.usedEnvironmentInjector, CustomInjectorService).content).toBe('Custom injector service works!');

    // Test with scope
    class ScopeService { content = 'Scope service works!' };
    const scope = createProviders([ScopeService]);

    const scopeResultOne = await scope.parseHooks(testText, parsers, context);
    expect(getService(scopeResultOne.usedEnvironmentInjector, ScopeService)).not.toBeUndefined();
    expect(getService(scopeResultOne.usedEnvironmentInjector, ScopeService).content).toBe('Scope service works!');
    expect(getService(scopeResultOne.usedEnvironmentInjector, CustomInjectorService)).toBeUndefined();

    // When using custom injector in scope, should block out scope injector
    const scopeResultTwo = await scope.parseHooks(testText, parsers, context, null, null, {}, customInjector);
    expect(getService(scopeResultTwo.usedEnvironmentInjector, ScopeService)).toBeUndefined();
    expect(getService(scopeResultTwo.usedEnvironmentInjector, CustomInjectorService)).not.toBeUndefined();
    expect(getService(scopeResultTwo.usedEnvironmentInjector, CustomInjectorService).content).toBe('Custom injector service works!');
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
    const scope = createProviders([
      provideDynamicHooks([], UserPlatformService)
    ]);

    const result = await scope.parseHooks(testText, parsers, context);

    // Make sure AutoPlatformService used UserPlatformService method
    const autoPlatformService = result.usedEnvironmentInjector.get(AutoPlatformService);
    const tagName = autoPlatformService.getTagName(document.createElement('div'));
    expect(tagName).toBe('TESTTAGNAME');
  });

  it('#should load scoped providers', async () => {
    const testText = `<multitagtest></multitagtest>`;
    const context = {};
    const parsers = [MultiTagTestComponent];

    class ExampleService { content = 'Example service works!' };
    const scope = createProviders([ExampleService]);

    const result = await scope.parseHooks(testText, parsers, context);
    const component: MultiTagTestComponent = result.hookIndex[1].componentRef?.instance as MultiTagTestComponent;
    expect(component.injector.get(ExampleService).content).toBe('Example service works!');
  });

  it('#should load multiple levels of scoped providers', async () => {
    const testText = `<multitagtest></multitagtest>`;
    const context = {};
    const parsers = [MultiTagTestComponent];

    class FirstScopeService { content = 'First scope service works!' };
    const firstChildScope = createProviders([FirstScopeService]);

    class SecondScopeService { content = 'Second scope service works!' };
    const secondChildScope = createProviders([SecondScopeService], firstChildScope);

    class ThirdScopeService { content = 'Third scope service works!' };
    const thirdChildScope = createProviders([ThirdScopeService], secondChildScope);
    
    class ApartScopeService { content = 'Apart scope service works!' };
    const apartChildScope = createProviders([ApartScopeService]);

    const get = (injector: Injector, token: any) => {
      try {
        return injector.get(token);
      } catch (e) {
        return undefined;
      }
    }

    // Load all components
    const firstChildScopeResult = await firstChildScope.parseHooks(testText, parsers, context);
    const firstChildScopeComponent: MultiTagTestComponent = firstChildScopeResult.hookIndex[1].componentRef?.instance as MultiTagTestComponent;

    const secondChildScopeResult = await secondChildScope.parseHooks(testText, parsers, context);
    const secondChildScopeComponent: MultiTagTestComponent = secondChildScopeResult.hookIndex[1].componentRef?.instance as MultiTagTestComponent;

    const thirdChildScopeResult = await thirdChildScope.parseHooks(testText, parsers, context);
    const thirdChildScopeComponent: MultiTagTestComponent = thirdChildScopeResult.hookIndex[1].componentRef?.instance as MultiTagTestComponent;

    const apartChildScopeResult = await apartChildScope.parseHooks(testText, parsers, context);
    const apartChildScopeComponent: MultiTagTestComponent = apartChildScopeResult.hookIndex[1].componentRef?.instance as MultiTagTestComponent;

    // Each component should only have access to its expected scopes
    expect(get(firstChildScopeComponent.injector, FirstScopeService).content).toBe('First scope service works!');
    expect(get(firstChildScopeComponent.injector, SecondScopeService)).toBeUndefined();
    expect(get(firstChildScopeComponent.injector, ThirdScopeService)).toBeUndefined();
    expect(get(firstChildScopeComponent.injector, ApartScopeService)).toBeUndefined();

    expect(get(secondChildScopeComponent.injector, FirstScopeService).content).toBe('First scope service works!');
    expect(get(secondChildScopeComponent.injector, SecondScopeService).content).toBe('Second scope service works!');
    expect(get(secondChildScopeComponent.injector, ThirdScopeService)).toBeUndefined();
    expect(get(secondChildScopeComponent.injector, ApartScopeService)).toBeUndefined();

    expect(get(thirdChildScopeComponent.injector, FirstScopeService).content).toBe('First scope service works!');
    expect(get(thirdChildScopeComponent.injector, SecondScopeService).content).toBe('Second scope service works!');
    expect(get(thirdChildScopeComponent.injector, ThirdScopeService).content).toBe('Third scope service works!');
    expect(get(thirdChildScopeComponent.injector, ApartScopeService)).toBeUndefined();

    expect(get(apartChildScopeComponent.injector, FirstScopeService)).toBeUndefined();
    expect(get(apartChildScopeComponent.injector, SecondScopeService)).toBeUndefined();
    expect(get(apartChildScopeComponent.injector, ThirdScopeService)).toBeUndefined();
    expect(get(apartChildScopeComponent.injector, ApartScopeService).content).toBe('Apart scope service works!');
  });

  it('#should share and reuse a global injector across multiple parseHooks uses', async () => {
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
    const scope = createProviders([ScopedService]);

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
  
  it('#should have destroyAll destroy the shared global injector for multiple parseHooks uses', async () => {
    const testText = `<multitagtest></multitagtest>`;
    const context = {};
    const parsers = [MultiTagTestComponent];

    // Initial parse. Modify providers.
    const parseOneResult = await parseHooks(testText, parsers, context);
    const parseOneComponent: MultiTagTestComponent = parseOneResult.hookIndex[1].componentRef?.instance as MultiTagTestComponent;
    const parseOneRootTestService = parseOneComponent.rootTestService;
    parseOneRootTestService.someString = 'RootTestService has been modified!';

    // Reset!
    destroyAll();

    // Second parse. Should freshly recreate global injector, so everything should be defaults again.
    const parseTwoResult = await parseHooks(testText, parsers, context);
    const parseTwoComponent: MultiTagTestComponent = parseTwoResult.hookIndex[1].componentRef?.instance as MultiTagTestComponent;
    const parseTwoRootTestService = parseTwoComponent.rootTestService;
    expect(parseTwoRootTestService).not.toBe(parseOneRootTestService);
    expect(parseTwoRootTestService.someString).toBe('RootTestService works!');
  });

  it('#should have destroyAll destroy all created scopes', async () => {
    const testText = `<multitagtest></multitagtest>`;
    const context = {};
    const parsers = [MultiTagTestComponent];

    // Initial parse.
    const scopeOne = createProviders();
    const scopeOneResultA = await scopeOne.parseHooks(testText, parsers, context);
    const scopeOneResultB = await scopeOne.parseHooks(testText, parsers, context);
    const spyOneA = spyOn(scopeOneResultA, 'destroy').and.callThrough();
    const spyOneB = spyOn(scopeOneResultB, 'destroy').and.callThrough();

    const scopeTwo = createProviders();
    const scopeTwoResult = await scopeTwo.parseHooks(testText, parsers, context);
    const spyTwo = spyOn(scopeTwoResult, 'destroy').and.callThrough();

    const scopeTwoChild = createProviders([], scopeTwo);
    const scopeTwoChildResult = await scopeTwoChild.parseHooks(testText, parsers, context);
    const spyThree = spyOn(scopeTwoChildResult, 'destroy').and.callThrough();

    // Reset!
    destroyAll();

    expect(scopeOne.isDestroyed).toBe(true);
    expect(scopeTwo.isDestroyed).toBe(true);
    expect(scopeTwoChild.isDestroyed).toBe(true);
    expect((scopeOne['injector']! as any).destroyed).toBe(true);
    expect((scopeTwo['injector']! as any).destroyed).toBe(true);
    expect((scopeTwoChild['injector']! as any).destroyed).toBe(true);
    expect(spyOneA.calls.all().length).toBe(1);
    expect(spyOneB.calls.all().length).toBe(1);
    expect(spyTwo.calls.all().length).toBe(1);
    expect(spyThree.calls.all().length).toBe(1);
  });

  it('#should be able to destroy individual scopes', async () => {
    const testText = `<multitagtest></multitagtest>`;
    const context = {};
    const parsers = [MultiTagTestComponent];

    const scope = createProviders();
    const scopeResultA = await scope.parseHooks(testText, parsers, context);
    const scopeResultB = await scope.parseHooks(testText, parsers, context);
    const spyA = spyOn(scopeResultA, 'destroy').and.callThrough();
    const spyB = spyOn(scopeResultB, 'destroy').and.callThrough();

    scope.destroy();
  
    expect(scope.isDestroyed).toBe(true);
    expect((scope['injector']! as any).destroyed).toBe(true);
    expect(spyA.calls.all().length).toBe(1);
    expect(spyB.calls.all().length).toBe(1);
  });

  it('#should habe a destroyed scope put out helpful errors when trying to parse again', async () => {
    const testText = `<multitagtest></multitagtest>`;
    const context = {};
    const parsers = [MultiTagTestComponent];

    const scope = createProviders();
    const scopeResult = await scope.parseHooks(testText, parsers, context);

    scope.destroy();

    const expectedError = 'This scope has already been destroyed. It or its methods cannot be used any longer.';

    await expectAsync(scope.parseHooks(testText, parsers, context)).toBeRejectedWithError(expectedError);
    await expectAsync(scope.resolveInjector()).toBeRejectedWithError(expectedError);
    await expect(() => scope.destroy()).toThrowError(expectedError);
  });

});
