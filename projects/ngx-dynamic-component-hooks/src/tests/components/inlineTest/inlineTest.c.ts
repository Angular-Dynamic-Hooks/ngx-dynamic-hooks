import { Component, OnInit, AfterViewInit, OnDestroy, Input, OnChanges, ChangeDetectorRef, DoCheck } from '@angular/core';
import { DynamicContentChild, OnDynamicChanges, OnDynamicMount, OnDynamicData } from '../../testing-api';

@Component({
  selector: 'dynhooks-inlinetest',
  templateUrl: './inlinetest.c.html',
  styleUrls: ['./inlinetest.c.scss']
})
export class InlineTestComponent implements OnDynamicMount, OnDynamicChanges, DoCheck, OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() backgroundColor: string = '#25436c';
  @Input() nr: number;
  @Input() config: any;
  mountContext: any;
  mountContentChildren: Array<DynamicContentChild>;
  changesContext: any;
  changesContentChildren: Array<DynamicContentChild>;

  constructor (private cd: ChangeDetectorRef) {
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
