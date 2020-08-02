import { Component, ViewChild, ViewChildren, OnInit, AfterViewInit, OnDestroy, Input, HostBinding, ElementRef, OnChanges, ChangeDetectorRef, QueryList, Output, EventEmitter, Inject, ContentChild, ContentChildren, DoCheck } from '@angular/core';
import { OnDynamicMount, OnDynamicChanges, OnDynamicData, DynamicContentChildren } from '../../../lib/interfacesPublic';
import { TestService } from '../../services/testService';


@Component({
  selector: 'dynhooks-multitagtest',
  templateUrl: './multiTagTest.c.html',
  styleUrls: ['./multiTagTest.c.scss']
})
export class MultiTagTestComponent implements OnDynamicMount, OnDynamicChanges, DoCheck, OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() backgroundColor: string = '#4493ff40';
  @Input() nr: number;
  @Input() fonts: Array<string>;
  mountContext: any;
  mountContentChildren: Array<DynamicContentChildren>;
  changesContext: any;
  changesContentChildren: Array<DynamicContentChildren>;

  constructor(private cd: ChangeDetectorRef, private testService: TestService) {
  }


  ngOnInit () {
    // console.log('textbox init');
  }

  ngOnChanges(changes) {
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

  onDynamicMount(data: OnDynamicData) {
    this.mountContext = data.context;
    this.mountContentChildren = data.contentChildren;
  }

  onDynamicChanges(data: OnDynamicData) {
    if (data.hasOwnProperty('context')) {
      this.changesContext = data.context;
    }
    if (data.hasOwnProperty('contentChildren')) {
      this.changesContentChildren = data.contentChildren;
    }
  }

}
