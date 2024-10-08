import { EnvironmentInjector, EnvironmentProviders, NgZone, Provider, createEnvironmentInjector } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

import { HookParserEntry } from './services/settings/parserEntry';
import { ParseOptions } from './services/settings/options';
import { HookIndex, ParseResult } from './interfacesPublic';
import { DynamicHooksService } from './services/dynamicHooksService';

// Global state
// ----------

let sharedInjector: EnvironmentInjector|null = null;
let scopes: ProvidersScope[] = [];
let allParseResults: ParseResult[] = [];

const createInjector = async (providers: (Provider | EnvironmentProviders)[] = [], parent?: EnvironmentInjector) => {
  // If no parent, create new root injector, so passed providers will also be actual root providers
  return parent ? createEnvironmentInjector(providers, parent) : (await createApplication({providers})).injector;
}

/**
 * Destroys all scopes and components created by standalone mode
 */
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

/**
 * Creates an isolated scope with its own providers that the dynamically-created components will then have access to.
 * 
 * @param providers - A list of providers
 * @param parentScope - An optional parent scope created previously. Makes the parent providers also accessible to this scope.
 */
export const createProviders = (providers: (Provider | EnvironmentProviders)[] = [], parentScope?: ProvidersScope): ProvidersScope => {
  return new ProvidersScope(providers, parentScope);
}

/**
 * A scope with an internal list of providers. All dynamic components created by its `parse` method will have access to them.
 */
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

  constructor(private providers: (Provider | EnvironmentProviders)[] = [], private parentScope?: ProvidersScope) {
    scopes.push(this);
  }

  /**
  * Parses content and loads components for all found hooks in standalone mode
  * 
  * @param content - The content to parse
  * @param parsers - The parsers to use
  * @param context - An optional context object
  * @param options - An optional list of options
  * @param targetElement - An optional HTML element to use as the container for the loaded content.
  * @param targetHookIndex - An optional object to fill with the programmatic hook data. If none is provided, one is created and returned for you.
  * @param environmentInjector - An optional environmentInjector to use for the dynamically-loaded components. If none is provided, the default environmentInjector is used.
  */
  public async parse(
    content: any,
    parsers: HookParserEntry[],
    context: any = null,  
    options: ParseOptions|null = null,
    targetElement: HTMLElement|null = null,
    targetHookIndex: HookIndex = {},
    environmentInjector: EnvironmentInjector|null = null
  ): Promise<ParseResult> {
    this.checkIfDestroyed();

    return parse(content, parsers, context, options,  targetElement, targetHookIndex, environmentInjector || await this.resolveInjector())
    .then(parseResult => {
      this.parseResults.push(parseResult);
      return parseResult;
    });
  }

  /**
   * Returns the injector for this scope
   */
  public async resolveInjector() {
    this.checkIfDestroyed();

    if (!this.injector) {
      const parentInjector = this.parentScope ? await this.parentScope.resolveInjector() : undefined;
      this._injector = await createInjector(this.providers, parentInjector);
    }
  
    return this.injector!;
  }

  /**
   * Destroys this scope and all of its created components
   */
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

// parse
// ----------

/**
 * Parses content and loads components for all found hooks in standalone mode
 * 
 * @param content - The content to parse
 * @param parsers - The parsers to use
 * @param context - An optional context object
 * @param options - An optional list of options
 * @param targetElement - An optional HTML element to use as the container for the loaded content.
 * @param targetHookIndex - An optional object to fill with the programmatic hook data. If none is provided, one is created and returned for you.
 * @param environmentInjector - An optional environmentInjector to use for the dynamically-loaded components. If none is provided, the default environmentInjector is used.
 */
export const parse = async (
  content: any,
  parsers: HookParserEntry[],
  context: any = null,  
  options: ParseOptions|null = null,
  targetElement: HTMLElement|null = null,
  targetHookIndex: HookIndex = {},
  environmentInjector: EnvironmentInjector|null = null,
): Promise<ParseResult> => {

  // Reuse the same global injector for all independent parse calls
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

  // Needs to be run inside NgZone manually
  return environmentInjector.get(NgZone).run(() => {
    return firstValueFrom(dynHooksService
      .parse(
        content, 
        parsers,
        context, 
        options, 
        null, 
        null,
        targetElement, 
        targetHookIndex, 
        environmentInjector,
        null
      )
    ).then(parseResult => {
      allParseResults.push(parseResult);
      return parseResult;
    });
  });
}