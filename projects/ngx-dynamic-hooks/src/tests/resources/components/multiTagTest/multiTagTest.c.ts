import { Component, OnInit, AfterViewInit, OnDestroy, Input, OnChanges, ChangeDetectorRef, DoCheck, Optional, Injector, inject, Output, EventEmitter, EnvironmentInjector, Inject, NgZone } from '@angular/core';
import { DynamicContentChild, OnDynamicChanges, OnDynamicMount, OnDynamicData } from '../../../testing-api';
import { RootTestService } from '../../services/rootTestService';
import { GENERICINJECTIONTOKEN } from '../../services/genericInjectionToken';
import { AbstractTestComponent } from '../abstractTest.c';


@Component({
  selector: 'multitagtest',
  templateUrl: './multiTagTest.c.html',
  styleUrls: ['./multiTagTest.c.scss'],
  standalone: true
})
export class MultiTagTestComponent extends AbstractTestComponent {
  constructor (
    cd: ChangeDetectorRef, 
    ngZone: NgZone,
    @Optional() rootTestService: RootTestService,
    @Optional() @Inject(GENERICINJECTIONTOKEN) genericInjectionValue: any,
    environmentInjector: EnvironmentInjector,
    injector: Injector
  ) {
    super(cd, ngZone, rootTestService, genericInjectionValue, environmentInjector, injector);
  }
}
