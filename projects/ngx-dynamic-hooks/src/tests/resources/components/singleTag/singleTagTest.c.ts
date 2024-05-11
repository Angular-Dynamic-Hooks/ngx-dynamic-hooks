import { Component, OnInit, AfterViewInit, OnDestroy, Input, OnChanges, ChangeDetectorRef, Output, EventEmitter, Inject, DoCheck, Optional, InjectionToken } from '@angular/core';
import { DynamicContentChild, OnDynamicData, OnDynamicChanges, OnDynamicMount } from '../../../testing-api';
import { RootTestService } from '../../services/rootTestService';
import { GENERICINJECTIONTOKEN } from '../../services/genericInjectionToken';

export const SINGLETAGCOMPONENTSERVICE = new InjectionToken<any>('A service that is only provided directly on the SingleTagTestComponent');

@Component({
  selector: 'dynhooks-singletagtest',
  templateUrl: './singleTagTest.c.html',
  styleUrls: ['./singleTagTest.c.scss'],
  providers: [
    {provide: SINGLETAGCOMPONENTSERVICE, useValue: { name: 'SingleTagComponentService works!' } }
  ]
})
export class SingleTagTestComponent implements OnDynamicMount, OnDynamicChanges, DoCheck, OnInit, OnChanges, AfterViewInit, OnDestroy {
  nonInputProperty: string = 'this is the default value';
  @Input() inputWithoutBrackets!: string;
  @Input() emptyInputWithoutBrackets!: string;
  @Input() emptyInput!: string;
  @Input() emptyStringInput!: string;
  @Input() _weird5Input$Name13!: string;
  @Input('stringPropAlias') stringProp: any;
  @Input('data-somevalue') dataSomeValue!: string;
  @Input() numberProp: any;
  @Input() booleanProp!: boolean;
  @Input() nullProp: any;
  @Input() undefinedProp: any;
  @Input() simpleObject: any;
  @Input() simpleArray: any;
  @Input() variable!: string;
  @Input() variableLookalike!: string;
  @Input() variableInObject: any;
  @Input() variableInArray!: Array<any>;
  @Input() contextWithoutAnything: any;
  @Input() nestedFunctions: any;
  @Input() nestedFunctionsInBrackets!: Array<any>;
  @Input() everythingTogether!: Array<any>;
  nonOutputEventEmitter: EventEmitter<number> = new EventEmitter();
  @Output('componentClickedAlias') componentClicked: EventEmitter<number> = new EventEmitter();
  @Output('eventTriggeredAlias') eventTriggered: EventEmitter<number> = new EventEmitter();
  @Output() httpResponseReceived: EventEmitter<number> = new EventEmitter();
  @Output() onDestroyEmitter: EventEmitter<string> = new EventEmitter();
  ngOnInitTriggered: boolean = false;
  ngOnChangesTriggered: boolean = false;
  mountContext: any;
  mountContentChildren!: Array<DynamicContentChild>;
  changesContext: any;
  changesContentChildren!: Array<DynamicContentChild>;


  constructor (
    public cd: ChangeDetectorRef, 
    public rootTestService: RootTestService,
    @Optional() @Inject(SINGLETAGCOMPONENTSERVICE) private singleTagComponentService: any,
    @Optional() @Inject(GENERICINJECTIONTOKEN) private genericInjectionValue: any
  ) {
    console.log(rootTestService);
    console.log(genericInjectionValue);
    console.log(singleTagComponentService);
  }

  ngDoCheck() {
  }

  ngOnInit () {
    this.ngOnInitTriggered = true;
  }

  ngOnChanges(changes: any) {
    this.ngOnChangesTriggered = true;
    // console.log(changes);
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.onDestroyEmitter.emit('Event triggered from onDestroy!');
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
