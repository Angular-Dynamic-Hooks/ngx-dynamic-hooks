import { isDevMode, Injectable, Injector } from '@angular/core';
import { HookParser } from '../../../interfacesPublic';
import { GenericSelectorParser } from '../../../parsers/genericSelector/genericSelectorParser';
import { GenericSelectorFinder } from '../../../parsers/genericSelector/services/genericSelectorFinder';
import { BindingStateManager } from '../../../parsers/genericSelector/services/bindingStateManager';
import { ParserConfigResolver } from '../../../parsers/genericSelector/config/parserConfigResolver';
import { HookParserEntry } from './parserEntry';
import { GenericSelectorParserConfig } from '../../../parsers/genericSelector/config/parserConfig';

@Injectable()
export class ParserEntryResolver {

  constructor(private injector: Injector, private parserConfigResolver: ParserConfigResolver, private genericSelectorFinder: GenericSelectorFinder, private bindingStateManager: BindingStateManager) {
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

    // If no need to filter, return resolved parsers
    if (!blacklist && !whitelist) {
        return parsers;
    }

    // Check black/whitelist
    this.validateBlackAndWhitelist(parsers, blacklist, whitelist);

    // Filter parsers
    const filteredParsers = [];
    for (const parser of parsers) {
      if (parser.hasOwnProperty('name') && typeof parser.name === 'string') {
        if (blacklist && blacklist.includes(parser.name)) {
          continue;
        }
        if (whitelist && !whitelist.includes(parser.name)) {
          continue;
        }
      }
      filteredParsers.push(parser);
    }

    return filteredParsers;
  }

  /**
   * Figures out what kind of config object (out of all possible ones) the HookParserEntry is and loads it appropriately.
   *
   * The potential types are:
   * - a service
   * - a class
   * - an instance
   * - an object literal to configure GenericSelectorParser with
   *
   * @param parserEntry - THe HookParserEntry to process
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
          return new GenericSelectorParser(parserEntry as GenericSelectorParserConfig, this.parserConfigResolver, this.genericSelectorFinder, this.bindingStateManager);
        } catch (e)  {
          if (isDevMode()) {
            console.error('DynCompHooks: Invalid parser config - ', parserEntry, '\n', e);
          }
        }
      }
    } else {
      if (isDevMode()) {
        console.error('DynCompHooks: Invalid parser config - ', parserEntry);
      }
    }
  }

  /**
   * A black/whitelist validation function for the benefit of the user. Outputs warnings in the console if something is off.
   *
   * @param parsers - The parsers in question
   * @param blacklist - The blacklist in question
   * @param whitelist - The whitelist in question
   */
  validateBlackAndWhitelist(parsers: Array<HookParser>, blacklist?: Array<string>, whitelist?: Array<string>): void {
    const globalParserNames = parsers.map(entry => entry.name).filter(entry => entry !== undefined);
    if (blacklist) {
      for (const blacklistedParser of blacklist) {
        if (!globalParserNames.includes(blacklistedParser)) {
          if (isDevMode()) {
            console.warn('DynCompHooks: Blacklisted parser name "' + blacklistedParser + '" does not appear in the list of global parsers names. Make sure both spellings are identical.');
          }
        }
      }
    }
    if (whitelist) {
      for (const whitelistedParser of whitelist) {
        if (!globalParserNames.includes(whitelistedParser)) {
          if (isDevMode()) {
            console.warn('DynCompHooks: Whitelisted parser name "' + whitelistedParser + '" does not appear in the list of global parsers names. Make sure both spellings are identical.');
          }
        }
      }
    }
  }

}
