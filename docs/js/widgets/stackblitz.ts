import { GenericWidgetController, Widget } from "../widgetBootstrap";

export class StackblitzWidget implements Widget {
  static selector: string = '.stackblitz';
  hostElement: HTMLElement|null = null;
  iframe: HTMLElement|null = null;
  isVisible: boolean = false;
  currentMode: 'desktop'|'mobile' = window.innerWidth <= 600 ? 'mobile' : 'desktop';
  baseUrl: string|undefined;
  desktopqp: string|undefined;
  mobileqp: string|undefined;

  onMount(hostElement: Element, data: {[key: string]: any}, controller: GenericWidgetController) {
    this.hostElement = hostElement as HTMLElement;
    this.baseUrl = data.baseurl;
    this.desktopqp = data.desktopqp;
    this.mobileqp = data.mobileqp;

    // Add load spinner
    const loadSpinner = document.createElement('div');
    loadSpinner.classList.add('load-spinner');
    this.hostElement.appendChild(loadSpinner);
  
    const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && !this.isVisible) {
        this.isVisible = true;
        this.refreshIframe();
      }
    }, {
      rootMargin: "0px",
      threshold: 1.0,
    });
    observer.observe(this.hostElement);

    window.addEventListener('resize', event => {
      const oldMode = this.currentMode;
      const newMode = window.innerWidth <= 600 ? 'mobile' : 'desktop';
      this.currentMode = newMode
      if (oldMode !== newMode) {
        this.refreshIframe();
      }
    });

    this.refreshIframe();
  }

  private refreshIframe() {
    if (!this.isVisible) {
      return;
    }

    if (!this.iframe) {
      this.iframe = document.createElement('iframe');
      this.hostElement?.appendChild(this.iframe);
    }

    const queryParams = this.currentMode === 'desktop' ? this.desktopqp : this.mobileqp;
    const url = `${this.baseUrl}${ queryParams ? '?' + queryParams : '' }`;
    this.iframe.setAttribute('src', url);
  }


}