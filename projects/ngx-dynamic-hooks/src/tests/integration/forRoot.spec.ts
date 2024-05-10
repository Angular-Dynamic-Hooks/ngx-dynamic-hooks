// Testing api resources
import { DYNAMICHOOKS_ALLSETTINGS, DynamicHooksGlobalSettings, PlatformBrowserService, SelectorHookParserConfig, outletOptionDefaults, provideDynamicHooks } from '../testing-api';

// Custom testing resources
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';
import { TestBed } from '@angular/core/testing';
import { MultiTagTestComponent } from '../resources/components/multiTagTest/multiTagTest.c';


describe('forRoot', () => {

  it('#should reset all settings when calling provideDynamicHooks', () => {
    // Run forRoot once
    TestBed.configureTestingModule({
      declarations: [
        SingleTagTestComponent
      ],
      providers: [
        provideDynamicHooks({
          globalParsers: [
            {component: SingleTagTestComponent}
          ]
        })
      ]
    });

    let allSettings = TestBed.inject(DYNAMICHOOKS_ALLSETTINGS);
    expect(allSettings.length).toBe(1);
    expect((allSettings[0].globalParsers![0] as SelectorHookParserConfig).component).toBe(SingleTagTestComponent);

    // Run forRoot again
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      declarations: [
        MultiTagTestComponent
      ],
      providers: [
        provideDynamicHooks({
          globalParsers: [
            {component: MultiTagTestComponent}
          ]
        })
      ]
    });

    allSettings = TestBed.inject(DYNAMICHOOKS_ALLSETTINGS);
    expect(allSettings.length).toBe(1);
    expect((allSettings[0].globalParsers![0] as SelectorHookParserConfig).component).toBe(MultiTagTestComponent);
  });

  it('#should set platformService provider to custom platformService if passed', () => {
    const CustomPlatformService = class {
    };

    const providers = provideDynamicHooks({}, CustomPlatformService as any);
    const platformServiceProvider = providers.find((p: any) => p.useClass === CustomPlatformService);
    expect(platformServiceProvider).not.toBeUndefined();
  });

  it('#should set platformService to PlatformBrowserService if custom platform not passed', () => {
    const providers = provideDynamicHooks({});
    const platformServiceProvider = providers.find((p: any) => p.useClass === PlatformBrowserService);
    expect(platformServiceProvider).not.toBeUndefined();
  });

});
