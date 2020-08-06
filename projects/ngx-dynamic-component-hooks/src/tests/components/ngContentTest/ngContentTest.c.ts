import { Component, OnInit, AfterViewInit, OnDestroy, OnChanges, ChangeDetectorRef, DoCheck } from '@angular/core';
import { DynamicContentChildren, OnDynamicChanges, OnDynamicMount, OnDynamicData } from '../../testing-api';
import { TestService } from '../../services/testService';


@Component({
  selector: 'dynhooks-ngcontenttest',
  templateUrl: './ngContentTest.c.html',
  styleUrls: ['./ngContentTest.c.scss']
})
export class NgContentTestComponent implements OnDynamicMount, OnDynamicChanges, DoCheck, OnInit, OnChanges, AfterViewInit, OnDestroy {
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
