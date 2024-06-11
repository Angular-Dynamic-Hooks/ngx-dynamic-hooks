// Custom testing resources
import { defaultBeforeEach } from '../shared';
import { TestBedStatic } from '@angular/core/testing';
import { DynamicHooksComponent, DynamicHooksService } from '../../testing-api';

describe('Parser element hooks', () => {
  let testBed: TestBedStatic;
  let fixture: any;
  let comp: DynamicHooksComponent;
  let context: any;

  beforeEach(() => {
    ({testBed, fixture, comp, context} = defaultBeforeEach());
  });

  // ----------------------------------------------------------------------------

  it('should do something', () => {

  });

});
