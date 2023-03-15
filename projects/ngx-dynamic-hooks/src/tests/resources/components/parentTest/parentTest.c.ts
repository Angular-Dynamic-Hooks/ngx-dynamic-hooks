import { Component, OnInit, AfterViewInit, OnDestroy, Input, OnChanges, ChangeDetectorRef, DoCheck, Optional, Inject, InjectionToken, ViewChild } from '@angular/core';
import { DynamicContentChild, OnDynamicChanges, OnDynamicMount, OnDynamicData } from '../../../testing-api';
import { ChildTestComponent } from './childTest/childTest.c';

export const BLUBBSERVICETOKEN = new InjectionToken<any>('the token for the blubb service');

@Component({
  selector: 'dynhooks-parenttest',
  templateUrl: './parentTest.c.html',
  styleUrls: ['./parentTest.c.scss'],
  providers: [{provide: BLUBBSERVICETOKEN, useValue: { name: 'blubb' } }]
})
export class ParentTestComponent implements DoCheck, OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild(ChildTestComponent) childTestComponent: any;

  constructor(private cd: ChangeDetectorRef, @Optional() @Inject(BLUBBSERVICETOKEN) private blubbService: any) {
    console.log('PARENT_TEST', this.blubbService);
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
