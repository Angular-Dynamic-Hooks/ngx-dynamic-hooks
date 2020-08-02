import { Component, ViewChild, ViewChildren, OnInit, AfterViewInit, OnDestroy, Input, HostBinding, ElementRef, OnChanges, ChangeDetectorRef, QueryList, Output, EventEmitter, Inject, DoCheck, ChangeDetectionStrategy, Optional } from '@angular/core';
import { DynamicContentChildren, OnDynamicData, OnDynamicChanges, OnDynamicMount } from '../../../lib/interfacesPublic';
import { TestService, TESTSERVICETOKEN } from '../../services/testService';


@Component({
  selector: 'dynhooks-singletagtest',
  templateUrl: './singleTagTest.c.html',
  styleUrls: ['./singleTagTest.c.scss']
})
export class SingleTagTestComponent implements OnDynamicMount, OnDynamicChanges, DoCheck, OnInit, OnChanges, AfterViewInit, OnDestroy {
  nonInputProperty: string = 'this is the default value';
  @Input('stringPropAlias') stringProp: any;
  @Input() numberProp: any;
  @Input() booleanProp: boolean;
  @Input() nullProp;
  @Input() undefinedProp;
  @Input() simpleObject: any;
  @Input() simpleArray: any;
  @Input() variable: string;
  @Input() variableLookalike: string;
  @Input() variableInObject: any;
  @Input() variableInArray: Array<any>;
  @Input() contextWithoutAnything: any;
  @Input() nestedFunctions: any;
  @Input() nestedFunctionsInBrackets: Array<any>;
  @Input() everythingTogether: Array<any>;
  nonOutputEventEmitter: EventEmitter<number> = new EventEmitter();
  @Output('componentClickedAlias') componentClicked: EventEmitter<number> = new EventEmitter();
  @Output('eventTriggeredAlias') eventTriggered: EventEmitter<number> = new EventEmitter();
  @Output() httpResponseReceived: EventEmitter<number> = new EventEmitter();
  mountContext: any;
  mountContentChildren: Array<DynamicContentChildren>;
  changesContext: any;
  changesContentChildren: Array<DynamicContentChildren>;


  constructor (private cd: ChangeDetectorRef, private testService: TestService, @Optional() @Inject(TESTSERVICETOKEN) private fakeTestService: any) {
  }

  ngDoCheck() {
  }

  ngOnInit () {
  }

  ngOnChanges(changes) {
    // console.log(changes);
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
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
