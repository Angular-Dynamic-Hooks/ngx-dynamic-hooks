import { Component, OnInit, AfterViewInit, OnDestroy, Input, OnChanges, ChangeDetectorRef, Output, EventEmitter, Inject, DoCheck, Optional, InjectionToken, EnvironmentInjector, Injector, NgZone } from '@angular/core';
import { DynamicContentChild, OnDynamicData, OnDynamicChanges, OnDynamicMount } from '../../testing-api';
import { RootTestService } from '../services/rootTestService';
import { GENERICINJECTIONTOKEN } from '../services/genericInjectionToken';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'singletagtest',
  template: '',
  imports: [CommonModule],
  standalone: true
})
export class AbstractTestComponent implements OnDynamicMount, OnDynamicChanges, DoCheck, OnInit, OnChanges, AfterViewInit, OnDestroy {
  nonInputProperty: string = 'this is the default value';
  @Input() genericInput: any;
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
  @Output() genericOutput: EventEmitter<number> = new EventEmitter();
  @Output() genericOtherOutput: EventEmitter<number> = new EventEmitter();
  @Output('componentClickedAlias') componentClicked: EventEmitter<number> = new EventEmitter();
  @Output('eventTriggeredAlias') eventTriggered: EventEmitter<number> = new EventEmitter();
  @Output() onDestroyEmitter: EventEmitter<string> = new EventEmitter();
  doCheckTriggers: number = 0;
  ngOnInitTriggered: boolean = false;
  ngOnChangesTriggered: boolean = false;
  latestNgOnChangesData: any;
  mountContext: any;
  mountContentChildren!: Array<DynamicContentChild>;
  changesContext: any;
  changesContentChildren!: Array<DynamicContentChild>;

  constructor (
    public cd: ChangeDetectorRef, 
    public ngZone: NgZone,
    @Optional() public rootTestService: RootTestService,
    @Optional() @Inject(GENERICINJECTIONTOKEN) public genericInjectionValue: any,
    public environmentInjector: EnvironmentInjector,
    public injector: Injector
  ) {
    //console.log(environmentInjector);
    //console.log(rootTestService);
    //console.log(genericInjectionValue);
    //console.log(singleTagComponentService);
  }

  ngDoCheck() {
    this.doCheckTriggers++;
  }

  ngOnInit () {
    this.ngOnInitTriggered = true;
  }

  ngOnChanges(changes: any) {
    this.ngOnChangesTriggered = true;
    this.latestNgOnChangesData = changes;
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
