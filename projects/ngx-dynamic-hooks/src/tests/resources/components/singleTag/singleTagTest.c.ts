import { Component, OnInit, AfterViewInit, OnDestroy, Input, OnChanges, ChangeDetectorRef, Output, EventEmitter, Inject, DoCheck, Optional, InjectionToken, EnvironmentInjector, Injector } from '@angular/core';
import { DynamicContentChild, OnDynamicData, OnDynamicChanges, OnDynamicMount } from '../../../testing-api';
import { RootTestService } from '../../services/rootTestService';
import { GENERICINJECTIONTOKEN } from '../../services/genericInjectionToken';
import { CommonModule } from '@angular/common';
import { AbstractTestComponent } from '../abstractTest.c';

export const SINGLETAGCOMPONENTSERVICE = new InjectionToken<any>('A service that is only provided directly on the SingleTagTestComponent');

@Component({
  selector: 'singletagtest',
  templateUrl: './singleTagTest.c.html',
  styleUrls: ['./singleTagTest.c.scss'],
  imports: [CommonModule],
  providers: [
    {provide: SINGLETAGCOMPONENTSERVICE, useValue: { name: 'SingleTagComponentService works!' } }
  ],
  standalone: true
})
export class SingleTagTestComponent extends AbstractTestComponent {

  constructor (
    cd: ChangeDetectorRef, 
    @Optional() rootTestService: RootTestService,
    @Optional() @Inject(GENERICINJECTIONTOKEN) genericInjectionValue: any,
    environmentInjector: EnvironmentInjector,
    injector: Injector,
    @Optional() @Inject(SINGLETAGCOMPONENTSERVICE) private singleTagComponentService: any,
  ) {
    super(cd, rootTestService, genericInjectionValue, environmentInjector, injector);
  }

}
