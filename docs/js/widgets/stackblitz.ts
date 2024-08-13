import { infoService } from "../infoService";
import { GenericWidgetController, Widget } from "../widgetBootstrap";

export class StackblitzWidget implements Widget {
  static selector: string = '.stackblitz';
  hostElement: HTMLElement|null = null;
  imageElement: HTMLElement|null = null;
  buttonsElement: HTMLElement|null = null;;
  iframeElement: HTMLElement|null = null;
  embedQueryParams: string = "embed=1&hideNavigation=1";
  url: string|undefined;  
  fileQueryParam: string|undefined;
  image: string|undefined;
  // isVisible: boolean = true;
  // currentMode: 'desktop'|'mobile' = window.innerWidth <= 600 ? 'mobile' : 'desktop';
  // desktopqp: string|undefined;
  // mobileqp: string|undefined;


  onMount(hostElement: Element, data: {[key: string]: any}, controller: GenericWidgetController) {
    this.hostElement = hostElement as HTMLElement;
    this.url = data.url;
    this.fileQueryParam = data.filequeryparam;
    this.image = data.image;

    this.init(); 
  }

  private init() {
    // Add background image
    this.imageElement = document.createElement('img');
    this.imageElement.classList.add('stackblitz-placeholder');
    this.imageElement.setAttribute('src', this.image || `${ infoService.baseUrl }/assets/images/stackblitz/default.jpg`);
    this.hostElement?.appendChild(this.imageElement);

    // Add buttons
    this.buttonsElement = document.createElement('div');
    this.buttonsElement.classList.add('stackblitz-buttons');
    this.hostElement?.appendChild(this.buttonsElement);

    const newTabButton = document.createElement('a');
    newTabButton.classList.add('stackblitz-button');
    newTabButton.classList.add('stackblitz-button-newtab');
    newTabButton.setAttribute('href', `${ this.url }${ this.fileQueryParam ? '?' + this.fileQueryParam : '' }`);
    newTabButton.setAttribute('target', '_blank');
    newTabButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="#1389FD" viewBox="0 0 32 32" width="1em" height="1em"><path d="M5.853 18.647h8.735L9.45 31l16.697-17.647h-8.735L22.55 1z"></path></svg>
      Open Stackblitz
    `;
    this.buttonsElement.appendChild(newTabButton);

    const embedButton = document.createElement('button');
    embedButton.classList.add('stackblitz-button');
    embedButton.classList.add('stackblitz-button-embed');
    embedButton.textContent = 'Load embed';
    embedButton.addEventListener('click', event => this.loadEmbed());    
    this.buttonsElement.appendChild(embedButton);
  }

  private loadEmbed() {
    this.imageElement?.remove();
    this.buttonsElement?.remove();
  
    this.iframeElement = document.createElement('iframe');
    this.iframeElement.classList.add('stackblitz-iframe');
    this.hostElement?.appendChild(this.iframeElement);

    const url = `${ this.url }?${this.embedQueryParams}${ this.fileQueryParam ? '&' + this.fileQueryParam : '' }`;
    this.iframeElement.setAttribute('src', url);
  }


/**
 * No longer needed. Replced observer logic in favor of manual confirmation to load
 *
  private init() {
    // Delay checking visibility until dom stable
    setTimeout(() => {
      this.initObserver();
    }, 50);

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

  private initObserver() {
    const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && !this.isVisible) {
        this.isVisible = true;
        this.refreshIframe();
      }
    }, {
      rootMargin: "0px",
      threshold: 1.0,
    });
    observer.observe(this.hostElement!);
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


  */

}