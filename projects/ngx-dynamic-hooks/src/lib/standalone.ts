import { firstValueFrom } from 'rxjs';

import { HookParserEntry } from './services/settings/parserEntry';
import { ParseOptions } from './services/settings/options';
import { HookIndex, ParseResult } from './interfacesPublic';
import { EnvironmentInjector, Provider, Type, createEnvironmentInjector } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { provideDynamicHooks } from './dynamicHooksProviders';
import { DynamicHooksService } from '../public-api';
import { PlatformService } from './services/platform/platformService';

// Global state
// ----------

interface StandaloneState {
  globalProviders: Provider[];
  platformService: Type<PlatformService>|null;
  globalInjector: EnvironmentInjector|null;
  scopedInjectors: Map<Symbol, EnvironmentInjector>;
}

const getDefaultState: () => StandaloneState = () => {
  return {
    globalProviders: [],
    platformService: null,
    globalInjector: null,
    scopedInjectors: new Map()
  }
}

let state: StandaloneState = getDefaultState();

// Providers
// ----------

export const provideGlobally = (providers: Provider[], platformService?: Type<PlatformService>) => {
  resetGlobalProviders();
  state.globalProviders = providers;
  state.platformService = platformService || null;
}

export const resetGlobalProviders = () => state = getDefaultState();

export interface ParseHooksScope {
  parseHooks: (...args: ParseHooksParams) => Promise<ParseResult>;
  resolveInjector: () => Promise<EnvironmentInjector>;
}

export const provideScope: (providers: Provider[], parentScope?: ParseHooksScope) => ParseHooksScope = (providers, parentScope) => {
  const key = Symbol('ScopedInjectorKey');
  const resolveInjector = async () => await resolveScopedInjector(key, providers, parentScope);

  return {
    parseHooks: async (content, parsers, context = null, options = null, targetElement = null, targetHookIndex = {}, environmentInjector = null) => {
      return parseHooks(content, parsers, context, options, targetElement, targetHookIndex, environmentInjector || await resolveInjector());
    },
    resolveInjector
  }  
}

// Injectors
// ----------

const resolveGlobalInjector = async () => {
  if (!state.globalInjector) {
    const app = await createApplication({
      providers: [
        ...state.globalProviders,
        provideDynamicHooks(undefined, state.platformService || undefined)
      ]
    });
    state.globalInjector = app.injector;
  }

  return state.globalInjector;
}

const resolveScopedInjector = async (key: Symbol, providers: Provider[], parentScope?: ParseHooksScope) => {
  if (!state.scopedInjectors.has(key)) {
    const parentInjector = parentScope ? await parentScope.resolveInjector() : await resolveGlobalInjector();
    state.scopedInjectors.set(key, createEnvironmentInjector(providers, parentInjector));
  }

  return state.scopedInjectors.get(key)!;
}

// ParseHooks
// ----------

type ParseHooksParams = Parameters<typeof parseHooks>;

export const parseHooks = async (
  content: any,
  parsers: HookParserEntry[],
  context: any = null,  
  options: ParseOptions|null = null,
  targetElement: HTMLElement|null = null,
  targetHookIndex: HookIndex = {},
  environmentInjector: EnvironmentInjector|null = null
): Promise<ParseResult> => {

  const injector = environmentInjector || await resolveGlobalInjector();
  const dynHooksService = injector.get(DynamicHooksService);

  return firstValueFrom(dynHooksService.parse(
    content, 
    context, 
    null, 
    null, 
    parsers, 
    options, 
    targetElement, 
    targetHookIndex, 
    injector, 
    null)
  );
}