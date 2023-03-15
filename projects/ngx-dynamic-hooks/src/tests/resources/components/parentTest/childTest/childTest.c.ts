import { Component, OnInit, AfterViewInit, OnDestroy, Input, OnChanges, ChangeDetectorRef, DoCheck, Optional, Inject, InjectionToken } from '@angular/core';
import { DynamicContentChild, OnDynamicChanges, OnDynamicMount, OnDynamicData } from '../../../../testing-api';
import { BLUBBSERVICETOKEN } from '../parentTest.c';

@Component({
  selector: 'dynhooks-childtest',
  templateUrl: './childTest.c.html',
  styleUrls: ['./childTest.c.scss'],
})
export class ChildTestComponent implements DoCheck, OnInit, OnChanges, AfterViewInit, OnDestroy {

  constructor(private cd: ChangeDetectorRef, @Optional() @Inject(BLUBBSERVICETOKEN) private blubbService: any) {
    console.log('CHILD_TEST', this.blubbService);
  }


  ngOnInit () {
    // console.log('textbox init');
  }

  ngOnChanges(changes: any) {
    // console.log('textbox changes');
  }

  ngDoCheck() {
    // console.log('textbox doCheck');
  }

  ngAfterViewInit() {
    // console.log('textbox afterviewinit');
  }

  ngOnDestroy() {
    // console.log('textbox destroy');
  }

}
