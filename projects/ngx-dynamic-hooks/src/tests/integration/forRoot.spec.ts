// Testing api resources
import { DYNAMICHOOKS_ALLSETTINGS, DynamicHooksGlobalSettings, DynamicHooksModule, SelectorHookParserConfig, outletOptionDefaults } from '../testing-api';

// Custom testing resources
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';
import { TestBed } from '@angular/core/testing';
import { MultiTagTestComponent } from '../resources/components/multiTagTest/multiTagTest.c';


describe('forRoot', () => {

  // ----------------------------------------------------------------------------

  it('#should reset all settings when calling forRoot', () => {
    // Run forRoot once
    TestBed.configureTestingModule({
      imports: [
        DynamicHooksModule.forRoot({
          globalParsers: [
            {component: SingleTagTestComponent}
          ]
        })
      ],
      declarations: [
        SingleTagTestComponent
      ]
    });

    let allSettings = TestBed.inject(DYNAMICHOOKS_ALLSETTINGS);
    expect(allSettings.length).toBe(1);
    expect((allSettings[0].globalParsers![0] as SelectorHookParserConfig).component).toBe(SingleTagTestComponent);

    // Run forRoot again
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [
        DynamicHooksModule.forRoot({
          globalParsers: [
            {component: MultiTagTestComponent}
          ]
        })
      ],
      declarations: [
        MultiTagTestComponent
      ]
    });

    allSettings = TestBed.inject(DYNAMICHOOKS_ALLSETTINGS);
    expect(allSettings.length).toBe(1);
    expect((allSettings[0].globalParsers![0] as SelectorHookParserConfig).component).toBe(MultiTagTestComponent);
  });

});
