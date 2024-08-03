// Testing api resources
import { parseHooks, observeElement, resetDynamicHooks, contentElementAttr } from '../testing-api';

// Custom testing resources
import { destroyAll } from '../../lib/standalone';
import { MultiTagTestComponent } from '../resources/components/multiTagTest/multiTagTest.c';
import { GenericMultiTagStringParser } from '../resources/parsers/genericMultiTagStringParser';
import { GenericSingleTagStringParser } from '../resources/parsers/genericSingleTagStringParser';
import { SingleTagTestComponent } from '../resources/components/singleTag/singleTagTest.c';


describe('Standalone helper', () => {

  beforeEach(() => {
    resetDynamicHooks();
    destroyAll();
  });

  // ----------------------------------------------------------------------------

  it('#should trigger observer when a single element is added', done => {
    const observedElement = document.createElement('div');
    const childElement = document.createElement('section');

    observeElement(observedElement, parentElement => {
      expect(parentElement).toBe(observedElement);
      done();
    });
    
    observedElement.appendChild(childElement);
  });

  it('#should trigger observer when multiple elements are added', done => {
    const observedElement = document.createElement('div');
    const childElement = document.createElement('section');
    const grandChildElement = document.createElement('h2');
    const someOtherElement = document.createElement('p');

    observeElement(observedElement, parentElement => {
      expect(parentElement).toBe(observedElement);
      done();
    });

    observedElement.appendChild(childElement);
    childElement.appendChild(grandChildElement);
    observedElement.appendChild(someOtherElement);
  });

  it('#should trigger observer with correct parent element as new elements are added', done => {
    const observedElement = document.createElement('div');
    const childElement = document.createElement('article');
    const firstDeepElement = document.createElement('section');
    const secondDeepElement = document.createElement('section');
    const firstDeepChildElement = document.createElement('h2');
    const secondDeepChildElement = document.createElement('b');
    const someOtherElement = document.createElement('p');

    let triggerCounter = 0;
    observeElement(observedElement, parentElement => {
      triggerCounter++;
      if (triggerCounter === 1) {
        expect(parentElement).toBe(observedElement);
      }
      if (triggerCounter === 2) {
        expect(parentElement).toBe(childElement);
        done();
      }
    });

    observedElement.appendChild(childElement);
    childElement.appendChild(firstDeepElement);
    childElement.appendChild(secondDeepElement);
    observedElement.appendChild(someOtherElement);

    setTimeout(() => {
      firstDeepElement.appendChild(firstDeepChildElement);
      secondDeepElement.appendChild(secondDeepChildElement);
    }, 1);
  });

  it('#should trigger observer when text nodes are added', done => {
    const observedElement = document.createElement('div');
    const textNode = document.createTextNode('asd');

    observeElement(observedElement, parentElement => {
      expect(parentElement).toBe(observedElement);
      done();
    });
    
    observedElement.appendChild(textNode);
  });

  it('#should not trigger observer when elements are removed', done => {
    const observedElement = document.createElement('div');
    const childElement = document.createElement('section');
    observedElement.appendChild(childElement);

    let triggered = false;
    observeElement(observedElement, parentElement => {
      triggered = true;
    });
    
    observedElement.removeChild(childElement);

    setTimeout(() => {
      expect(triggered).toBe(false);
      done();
    }, 1);
  });

  it('#should trigger observer just with added, not removed elements', done => {
    const observedElement = document.createElement('div');
    const addContainer = document.createElement('div');
    const removeContainer = document.createElement('div');
    const addElement = document.createElement('div');
    const removeElement = document.createElement('div');

    observedElement.appendChild(addContainer);
    observedElement.appendChild(removeContainer);
    removeContainer.appendChild(removeElement);

    observeElement(observedElement, parentElement => {
      expect(parentElement).toBe(addContainer);
      done();      
    });
    
    addContainer.appendChild(addElement);
    removeContainer.removeChild(removeElement);
  });

  it('#should not trigger observer when creating Angular components', done => {
    const div = document.createElement('div');
    div.innerHTML = `
      <p>Some generic paragraph</p>
      <multitagtest [genericInput]="'This is some input text!'"></multitagtest>      
    `;

    let triggered = false;
    observeElement(div, parentElement => {
      triggered = true;
    });
    
    parseHooks(div, [MultiTagTestComponent]).then(result => {
      expect(result.hookIndex[1].componentRef?.componentType).toBe(MultiTagTestComponent);
      expect(div.querySelector('.multitag-component')).not.toBe(null); 

      setTimeout(() => {
        expect(triggered).toBe(false);
        done();
      }, 1);
    });
  });

  it('#should not trigger observer when Angular components themselves create elements', done => {
    const div = document.createElement('div');
    div.innerHTML = `[singletag-string]`;

    let triggered = false;
    observeElement(div, parentElement => {
      triggered = true;
    });
    
    parseHooks(div, [GenericSingleTagStringParser]).then(result => {
      expect(result.hookIndex[1].componentRef?.componentType).toBe(SingleTagTestComponent);
      expect(div.querySelector('.singletag-component')).not.toBe(null);
      expect(div.querySelector('.singletag-nr')).toBe(null);

      // Set prop that causes change detection to render an element via ngIf
      const comp = result.hookIndex[1].componentRef?.instance as SingleTagTestComponent;
      comp.numberProp = 55;
      comp.cd.detectChanges();

      setTimeout(() => {
        expect(div.querySelector('.singletag-nr')).not.toBe(null);
        expect(triggered).toBe(false);
        done();
      }, 1);
    });
  });

  it('#should not trigger observer from elements that are children of an element currently being parsed', done => {
    const div = document.createElement('div');
    const childElement = document.createElement('h2');
    div.innerHTML = `<p>Some generic paragraph</p>`;
    
    // Add attr that marks content element as currently being parsed
    div.setAttribute(contentElementAttr, '1');

    let triggered = false;
    observeElement(div, parentElement => {
      triggered = true;
    });
    
    div.appendChild(childElement);
  
    setTimeout(() => {
      expect(triggered).toBe(false);
      done();
    }, 1);
  });

  
  it('#should be able to disconnect from the observer', done => {
    const observedElement = document.createElement('div');
    const childElement = document.createElement('section');

    let triggered = false;
    const observer = observeElement(observedElement, parentElement => {
      triggered = true;
    });
    
    observer.disconnect();
    observedElement.appendChild(childElement);

    setTimeout(() => {
      expect(triggered).toBe(false);
      done();
    }, 1);
  });


});
