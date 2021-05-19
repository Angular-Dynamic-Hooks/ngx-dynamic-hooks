import { Component, OnInit, AfterViewInit, OnDestroy, OnChanges, ChangeDetectorRef, DoCheck } from '@angular/core';
import { DynamicContentChild, OnDynamicChanges, OnDynamicMount, OnDynamicData } from '../../testing-api';
import { TestService } from '../../services/testService';


@Component({
  selector: 'dynhooks-ngcontenttest',
  templateUrl: './ngContentTest.c.html',
  styleUrls: ['./ngContentTest.c.scss']
})
export class NgContentTestComponent implements OnDynamicMount, OnDynamicChanges {
  mountContext: any;
  mountContentChildren!: Array<DynamicContentChild>;
  changesContext: any;
  changesContentChildren!: Array<DynamicContentChild>;

  constructor(private cd: ChangeDetectorRef, private testService: TestService) {
  }

  onDynamicMount(data: OnDynamicData) {
    this.mountContext = data.context;
    this.mountContentChildren = (data as any).contentChildren;
  }

  onDynamicChanges(data: OnDynamicData) {
    if (data.hasOwnProperty('context')) {
      this.changesContext = data.context;
    }
    if (data.hasOwnProperty('contentChildren')) {
      this.changesContentChildren = (data as any).contentChildren;
    }
  }

}
