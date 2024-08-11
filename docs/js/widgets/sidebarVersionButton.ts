import { GenericWidgetController, Widget } from "../widgetBootstrap";

export class SidebarVersionButtonWidget implements Widget {
  static selector: string = '.sidebar .npmversion';
  linkElement: HTMLElement|null = null;
  lsKey = 'latestVersion';

  onMount(hostElement: Element, data: {[key: string]: any}, controller: GenericWidgetController) {
    this.linkElement = hostElement as HTMLElement;

    this.init();
  }

  private async init() {
    let latestVersion;

    if (typeof(Storage) !== "undefined") {
      const lsValue = window.localStorage.getItem(this.lsKey);
      if (lsValue) {
        const cached = JSON.parse(lsValue);
        const oneHour = 60 * 60 * 1000; // ms
        if ((new Date()).getTime() - cached.timestamp < oneHour) {
          latestVersion = cached.value;
        }
      }
    } 
    
    // If not fetched yet or cached version stale, fetch new
    if (!latestVersion) {
      latestVersion = await this.updateLatestVersion();
    }

    this.linkElement!.querySelector('.npmversion-text')!.textContent = latestVersion;  
  }

  private async updateLatestVersion(): Promise<string> {
    const result = await fetch('https://registry.npmjs.org/ngx-dynamic-hooks');
    const json = await result.json();
    const latestVersion: string = json['dist-tags'].latest;

    if (typeof(Storage) !== "undefined") {
      window.localStorage.setItem(this.lsKey, JSON.stringify({
        timestamp: (new Date).getTime(),
        value: latestVersion
      }));
    }

    return latestVersion;
  }

}