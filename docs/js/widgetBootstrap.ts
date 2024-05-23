export interface Widget {
  onMount: (hostElement: Element, data: {[key: string]: any}, controller: WidgetController<any>) => void;
}

// Needed to specify the class, not instance when typing
export interface WidgetConstructor {
  new(): Widget;
  selector: string; // Requires this static property
}

export interface LoadedWidget<T extends WidgetConstructor> {
  class: T;
  instance: InstanceType<T>;
  hostElement: Element;
}

export interface WidgetController<T extends WidgetConstructor> {
  registeredWidgets: T[];
  loadedWidgets: {[key: string]: LoadedWidget<T>[]};
  load: (container: Element) => void;
  context: any;
}

export type GenericWidgetController = WidgetController<any>;

export function bootstrapWidgets<T extends WidgetConstructor> (container: Element, widgets: T[], context: any = {}): WidgetController<T> {
  const loadedFlag = 'wgt-loaded';
  const controller: WidgetController<T> = {registeredWidgets: widgets, loadedWidgets: {}, load: () => {}, context: context};
  controller.load = container => {
    for (const widget of widgets) {
      const selector = widget.selector;
      const anchorsWithData = findWidgetAnchorsAndData(container, selector + ':not(.' + loadedFlag + ')');
    
      for (const anchorWithData of anchorsWithData) {
        const {anchor, data} = anchorWithData;
        
        if (!anchor.classList.contains(loadedFlag)) {
          anchor.classList.add(loadedFlag);
          const widgetName = widget.name.toLowerCase();

          if (!controller.loadedWidgets.hasOwnProperty(widgetName)) {
            controller.loadedWidgets[widgetName] = [];
          }

          const instance = new widget();

          controller.loadedWidgets[widgetName].push({
            class: widget,
            instance: instance as InstanceType<typeof widget>,
            hostElement: anchor
          });

          instance.onMount(anchor, data, controller);
        }
      }
    }
  }

  // Initial load of all widgets
  controller.load(container);

  return controller;
}

/**
 * General-purpose function to find widget anchors and data
 * @param {*} element - The element to search
 * @param {string} selector - A selector to use for querying and finding the widget anchors
 * @return {Array} - An array of objects, each consisting of the widget anchor as well as its parsed data attributes
 */
function findWidgetAnchorsAndData(container: Element, selector: string): {anchor: Element, data: any}[] {
    const result: {anchor: Element, data: any}[] = [];

    // Check container itself
    if (container.matches(selector)) {
        result.push({
            anchor: container, 
            data: container.hasOwnProperty('dataset') ? processDataAttrs((container as HTMLElement).dataset) : {}
        });
    }

    // Check element children
    const anchors = container.querySelectorAll(selector);
    for (const anchor of anchors) {
        result.push({
            anchor: anchor, 
            data: anchor.hasOwnProperty('dataset') ? processDataAttrs((anchor as HTMLElement).dataset) : {}
        });
    }

    return result;
}

function processDataAttrs(data: DOMStringMap) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === '' || value === undefined) {
        result[key] = null;
      } else if (!isNaN(value as any)) {
        result[key] = parseFloat(value);
      } else {
        result[key] = value;
      }
    }
    return result;
}