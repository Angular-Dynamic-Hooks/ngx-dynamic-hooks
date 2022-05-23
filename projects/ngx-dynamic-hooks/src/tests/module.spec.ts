import { DynamicHooksModule, PlatformBrowserService } from './testing-api';

describe('DynamicHooks module', () => {
  it('#should set platformService provider to custom platformService if passed', () => {
    const CustomPlatformService = class {
    };

    const module = DynamicHooksModule.forRoot({}, CustomPlatformService as any);
    const platformServiceProvider = module.providers?.find((p: any) => p.useClass === CustomPlatformService);
    expect(platformServiceProvider).not.toBeUndefined();
  });

  it('#should set platformService to PlatformBrowserService if custom platform not passed', () => {
    const module = DynamicHooksModule.forRoot({});
    const platformServiceProvider = module.providers?.find((p: any) => p.useClass === PlatformBrowserService);
    expect(platformServiceProvider).not.toBeUndefined();
  });
});
