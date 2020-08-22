import { isDevMode, Injectable, Injector } from '@angular/core';
import { HookParser } from '../../../interfacesPublic';
import { SelectorHookParser } from '../../../parsers/selector/selectorHookParser';
import { SelectorHookParserConfig } from '../../../parsers/selector/config/selectorHookParserConfig';
import { SelectorHookParserConfigResolver } from '../../../parsers/selector/config/selectorHookParserConfigResolver';
import { SelectorHookFinder } from '../../../parsers/selector/services/selectorHookFinder';
import { BindingStateManager } from '../../../parsers/selector/services/bindingStateManager';
import { HookParserEntry } from './parserEntry';

/**
 * A helper class for resolving HookParserEntries
 */
@Injectable()
export class ParserEntryResolver {

  constructor(private injector: Injector, private parserResolver: SelectorHookParserConfigResolver, private selectorFinder: SelectorHookFinder, private bindingStateManager: BindingStateManager) {
  }

  /**
   * Takes a list of HookParserEntries and transforms them into a list of loaded HookParsers
   *
   * @param parserEntries - The list of HookParserEntries to process
   * @param blacklist - (optional) Which parsers to blacklist by name
   * @param whitelist - (optional) Which parsers to whitelist by name
   */
  resolve(parserEntries: Array<HookParserEntry>, blacklist?: Array<string>, whitelist?: Array<string>): Array<HookParser> {

    // Load all requested parsers
    const parsers: Array<HookParser> = [];
    for (const parser of parserEntries) {
      parsers.push(this.resolveEntry(parser));
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
   * - a service
   * - a class
   * - an instance
   * - an object literal to configure SelectorHookParser with
   *
   * @param parserEntry - The HookParserEntry to process
   */
  resolveEntry(parserEntry: HookParserEntry): HookParser {
    // Check if class
    if (parserEntry.hasOwnProperty('prototype')) {
      // Check if service
      try {
        return this.injector.get(parserEntry);
      // Otherwise instantiate manually
      } catch (e) {
        return new (parserEntry as new(...args: any[]) => any)();
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
          return new SelectorHookParser(parserEntry as SelectorHookParserConfig, this.parserResolver, this.selectorFinder, this.bindingStateManager);
        } catch (e)  {
          if (isDevMode()) {
            console.error('Invalid parser config - ', parserEntry, '\n', e);
          }
        }
      }
    } else {
      if (isDevMode()) {
        console.error('Invalid parser config - ', parserEntry);
      }
    }
  }

  /**
   * Makes sure that the parsers have all required functions
   *
   * @param parsers - The parsers in question
   */
  validateParserFunctions(parsers: Array<HookParser>): Array<HookParser> {
    const validParsers = [];
    for (const parser of parsers) {
      if (typeof parser.findHooks !== 'function') {
        console.error('Submitted parser does not implement "findHooks()". Removing from list of active parsers:', parser);
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
  checkParserNames(parsers: Array<HookParser>): void {
    const parserNames = parsers.map(entry => entry.name).filter(entry => entry !== undefined);
    const previousNames = [];
    const alreadyWarnedNames = [];
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
  checkBlackAndWhitelist(parsers: Array<HookParser>, blacklist?: Array<string>, whitelist?: Array<string>): void {
    const parserNames = parsers.map(entry => entry.name).filter(entry => entry !== undefined);
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
