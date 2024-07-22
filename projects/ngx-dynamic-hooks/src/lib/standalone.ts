import { firstValueFrom } from 'rxjs';

import { HookParserEntry } from './services/settings/parserEntry';
import { ParseOptions } from './services/settings/options';
import { HookIndex, ParseResult } from './interfacesPublic';
import { EnvironmentInjector, Injector, Provider, Type, createEnvironmentInjector } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { DynamicHooksService } from '../public-api';

// Global state
// ----------
let sharedInjector: EnvironmentInjector|null = null;
let scopes: ProvidersScope[] = [];
let allParseResults: ParseResult[] = [];

const createInjector = async (providers: Provider[] = [], parent?: EnvironmentInjector) => {
  // If no parent, create new root injector, so passed providers will also be actual root providers
  return parent ? createEnvironmentInjector(providers, parent) : (await createApplication({providers})).injector;
}

export const destroyAll = () => {
  // Destroy all scopes
  for (const scope of scopes) {
    scope.destroy();
  }

  // Then all remaining independent parseResults
  for (const parseResult of allParseResults) {
    parseResult.destroy();
  }

  sharedInjector = null;
  scopes = [];
  allParseResults = [];
}

// Providers scope
// ----------

export const createProviders: (providers?: Provider[], parentScope?: ProvidersScope) => ProvidersScope = (providers = [], parentScope) => {
  return new ProvidersScope(providers, parentScope);
}

export class ProvidersScope {
  private _injector: EnvironmentInjector|null = null;
  public get injector(): EnvironmentInjector|null { 
    return this._injector;
  };
  private _parseResults: ParseResult[] = [];
  public get parseResults(): ParseResult[] { 
    return this._parseResults;
  };
  private _isDestroyed: boolean = false;
  get isDestroyed(): boolean {
    return this._isDestroyed;
  };

  constructor(private providers: Provider[] = [], private parentScope?: ProvidersScope) {
    scopes.push(this);
  }

  public async parseHooks(
    content: any,
    parsers: HookParserEntry[],
    context: any = null,  
    options: ParseOptions|null = null,
    targetElement: HTMLElement|null = null,
    targetHookIndex: HookIndex = {},
    environmentInjector: EnvironmentInjector|null = null
  ): Promise<ParseResult> {
    this.checkIfDestroyed();

    return parseHooks(content, parsers, context, options,  targetElement, targetHookIndex, environmentInjector || await this.resolveInjector())
    .then(parseResult => {
      this.parseResults.push(parseResult);
      return parseResult;
    });
  }

  public async resolveInjector() {
    this.checkIfDestroyed();

    if (!this.injector) {
      const parentInjector = this.parentScope ? await this.parentScope.resolveInjector() : undefined;
      this._injector = await createInjector(this.providers, parentInjector);
    }
  
    return this.injector!;
  }

  public destroy(): void {
    this.checkIfDestroyed();

    for (const parseResult of this.parseResults) {
      parseResult.destroy();
      allParseResults = allParseResults.filter(entry => entry !== parseResult);
    }

    if (this.injector) {
      this.injector.destroy();
    }

    scopes = scopes.filter(scope => scope !== this);
    this._isDestroyed = true;
  }

  private checkIfDestroyed() {
    if (this.isDestroyed) {
      throw new Error('This scope has already been destroyed. It or its methods cannot be used any longer.');
    }
  }
}

// ParseHooks
// ----------

export const parseHooks = async (
  content: any,
  parsers: HookParserEntry[],
  context: any = null,  
  options: ParseOptions|null = null,
  targetElement: HTMLElement|null = null,
  targetHookIndex: HookIndex = {},
  environmentInjector: EnvironmentInjector|null = null,
): Promise<ParseResult> => {

  // Reuse the same global injector for all independent parseHooks calls
  if (!environmentInjector) {
    if (!sharedInjector) {
      sharedInjector = await createInjector();
    }
    environmentInjector = sharedInjector;
  }

  // In standalone mode, emit HTML events from outputs by default
  if (!options) {
    options = {}
  }
  if (!options.hasOwnProperty('triggerDOMEvents')) {
    options.triggerDOMEvents = true;
  }

  const dynHooksService = environmentInjector.get(DynamicHooksService);

  return firstValueFrom(dynHooksService
    .parse(
      content, 
      context, 
      null, 
      null, 
      parsers, 
      options, 
      targetElement, 
      targetHookIndex, 
      environmentInjector,
      null
    )
  ).then(parseResult => {
    allParseResults.push(parseResult);
    return parseResult;
  });
}