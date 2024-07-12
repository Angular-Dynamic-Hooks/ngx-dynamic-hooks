import { isDevMode, Injectable, Injector, reflectComponentType } from '@angular/core';
import { HookParser } from '../../interfacesPublic';
import { StringSelectorHookParser } from '../../parsers/selector/string/stringSelectorHookParser';
import { SelectorHookParserConfig } from '../../parsers/selector/selectorHookParserConfig';
import { SelectorHookParserConfigResolver } from '../../parsers/selector/selectorHookParserConfigResolver';
import { TagHookFinder } from '../../parsers/selector/string/tagHookFinder';
import { BindingsValueManager } from '../../parsers/selector/bindingsValueManager';
import { HookParserEntry } from './parserEntry';
import { ElementSelectorHookParser } from '../../parsers/selector/element/elementSelectorHookParser';
import { PlatformService } from '../platform/platformService';
import { AutoPlatformService } from '../platform/autoPlatformService';

/**
 * A helper class for resolving HookParserEntries
 */
@Injectable({
  providedIn: 'root'
})
export class ParserEntryResolver {

  constructor(private injector: Injector, private parserResolver: SelectorHookParserConfigResolver, private platformService: AutoPlatformService, private tagHookFinder: TagHookFinder, private bindingsValueManager: BindingsValueManager) {
  }

  /**
   * Takes a list of HookParserEntries and transforms them into a list of loaded HookParsers
   *
   * @param parserEntries - The list of HookParserEntries to process
   * @param injector - The injector to use for resolving parsers
   * @param blacklist - (optional) Which parsers to blacklist by name
   * @param whitelist - (optional) Which parsers to whitelist by name
   */
  resolve(parserEntries: HookParserEntry[], injector: Injector, blacklist?: string[]|null, whitelist?: string[]|null): HookParser[] {

    // Load all requested parsers
    const parsers: HookParser[] = [];
    for (const parser of parserEntries) {
      const resolvedParser = this.resolveEntry(parser, injector);
      if (resolvedParser) {
        parsers.push(resolvedParser);
      }
    }

    // Check parser functions
    const validParsers = this.validateParserFunctions(parsers);

    // Check parser names
    this.checkParserNames(validParsers);

    // If no need to filter, return resolved parsers
    if (!blacklist && !whitelist) {
        return validParsers;
    }

    // Check black/whitelist
    this.checkBlackAndWhitelist(validParsers, blacklist, whitelist);

    // Filter parsers
    const filteredParsers = [];
    for (const validParser of validParsers) {
      if (validParser.hasOwnProperty('name') && typeof validParser.name === 'string') {
        if (blacklist && blacklist.includes(validParser.name)) {
          continue;
        }
        if (whitelist && !whitelist.includes(validParser.name)) {
          continue;
        }
      }
      filteredParsers.push(validParser);
    }

    return filteredParsers;
  }

  /**
   * Figures out what kind of config object (out of all possible types) the HookParserEntry is and loads it appropriately.
   *
   * The potential types are:
   * - 1. a component class (shorthand for nr. 5)
   * - 2. a parser service
   * - 3. a parser class
   * - 4. a parser instance
   * - 5. an object literal to configure SelectorHookParser with
   *
   * @param parserEntry - The HookParserEntry to process
   * @param injector - The injector to use for resolving this parser
   */
  resolveEntry(parserEntry: HookParserEntry, injector: Injector): HookParser|null {
    // Check if class
    if (parserEntry.hasOwnProperty('prototype')) {
      // Check if component class
      const componentMeta = reflectComponentType(parserEntry as any);
      if (componentMeta) {
        return this.createSelectorHookParser({component: parserEntry as any});
      // Else must be parser class
      } else {
        // Check if service
        try {
          return injector.get(parserEntry);
        // Otherwise instantiate manually
        } catch (e) {
          return new (parserEntry as new(...args: any[]) => any)();
        }
      }
    }

    // Check if object
    else if (typeof parserEntry === 'object') {
      // Is instance
      if (parserEntry.constructor.name !== 'Object') {
        return parserEntry as HookParser;
      // Is object literal
      } else {
        try {
          return this.createSelectorHookParser(parserEntry as SelectorHookParserConfig);
        } catch (e: any)  {
          if (isDevMode()) {
            console.error('Invalid parser config - ' + e.message, parserEntry);
            return null;
          }
        }
      }
    }
    
    if (isDevMode()) {
      console.error('Invalid parser config - ', parserEntry);
    }
    return null;
  }

  /**
   * Depending on the config, load either string or element SelectorHookParser
   *
   * @param config - The selectorHookParserConfig
   */
  private createSelectorHookParser(config: SelectorHookParserConfig): HookParser {
    if (
      (config.hasOwnProperty('enclosing') && !config.enclosing) || 
      (config.hasOwnProperty('bracketStyle') && config.bracketStyle)
    ) {
      return new StringSelectorHookParser(config, this.parserResolver, this.tagHookFinder, this.bindingsValueManager);
    } else {
      return new ElementSelectorHookParser(config, this.parserResolver, this.platformService, this.bindingsValueManager);
    }    
  }

  /**
   * Makes sure that the parsers have all required functions
   *
   * @param parsers - The parsers in question
   */
  validateParserFunctions(parsers: HookParser[]): HookParser[] {
    const validParsers = [];
    for (const parser of parsers) {
      if (typeof parser.findHooks !== 'function' && typeof parser.findHookElements !== 'function') {
        console.error('Submitted parser neither implements "findHooks()" nor "findHookElements()". One is required. Removing from list of active parsers:', parser);
        continue;
      }
      if (typeof parser.loadComponent !== 'function') {
        console.error('Submitted parser does not implement "loadComponent()". Removing from list of active parsers:', parser);
        continue;
      }
      if (typeof parser.getBindings !== 'function') {
        console.error('Submitted parser does not implement "getBindings()". Removing from list of active parsers:', parser);
        continue;
      }
      validParsers.push(parser);
    }
    return validParsers;
  }

  /**
   * Makes sure that all parser names are unique
   *
   * @param parsers - The parsers in question
   */
  checkParserNames(parsers: HookParser[]): void {
    const parserNames: string[] = parsers.map(entry => entry.name).filter(entry => entry !== undefined) as string[];
    const previousNames: string[] = [];
    const alreadyWarnedNames: string[] = [];
    for (const parserName of parserNames) {
      if (previousNames.includes(parserName) && !alreadyWarnedNames.includes(parserName)) {
        if (isDevMode()) {
          console.warn('Parser name "' + parserName + '" is not unique and appears multiple times in the list of active parsers.');
          alreadyWarnedNames.push(parserName);
        }
      }
      previousNames.push(parserName);
    }
  }

  /**
   * A black/whitelist validation function for the benefit of the user. Outputs warnings in the console if something is off.
   *
   * @param parsers - The parsers in question
   * @param blacklist - The blacklist in question
   * @param whitelist - The whitelist in question
   */
  checkBlackAndWhitelist(parsers: HookParser[], blacklist?: string[]|null, whitelist?: string[]|null): void {
    const parserNames: string[] = parsers.map(entry => entry.name).filter(entry => entry !== undefined) as string[];
    if (blacklist) {
      for (const blacklistedParser of blacklist) {
        if (!parserNames.includes(blacklistedParser)) {
          if (isDevMode()) {
            console.warn('Blacklisted parser name "' + blacklistedParser + '" does not appear in the list of global parsers names. Make sure both spellings are identical.');
          }
        }
      }
    }
    if (whitelist) {
      for (const whitelistedParser of whitelist) {
        if (!parserNames.includes(whitelistedParser)) {
          if (isDevMode()) {
            console.warn('Whitelisted parser name "' + whitelistedParser + '" does not appear in the list of global parsers names. Make sure both spellings are identical.');
          }
        }
      }
    }
  }

}
