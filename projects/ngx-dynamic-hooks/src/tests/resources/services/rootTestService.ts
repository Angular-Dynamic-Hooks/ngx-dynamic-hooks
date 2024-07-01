import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RootTestService {
  someString: string = 'RootTestService works!';
  someObj: any = {test: 'Hello!'};

  constructor() {
  }


}
