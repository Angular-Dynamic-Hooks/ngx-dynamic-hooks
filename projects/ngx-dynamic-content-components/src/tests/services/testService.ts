import { Injectable, InjectionToken } from '@angular/core';

export const TESTSERVICETOKEN = new InjectionToken<any>('some test service');

@Injectable()
export class TestService {
  someString = 'The TestService has loaded!';

  constructor() {
  }


}
