import { infoService } from "../infoService";
import { GenericWidgetController, Widget } from "../widgetBootstrap";

export class DarkmodeWidget implements Widget {
  static selector: string = '.darkmode';
  containerElement: HTMLElement|null = null;
  toggleElement: HTMLElement|null = null;
  darkmodeIsActive: boolean = false;
  sunIcon = `${ infoService.baseUrl }/assets/images/sun.svg`;
  moonIcon = `${ infoService.baseUrl }/assets/images/halfmoon.svg`;
  

  onMount(hostElement: Element, data: {[key: string]: any}, controller: GenericWidgetController) {
    this.containerElement = hostElement as HTMLElement;

    if (this.containerElement) {
      this.createHtml();
      this.updateStatus();      
    }
  }

  private createHtml() {
    const toggleElement = `
    <img class="darkmode-icon" src="${ this.darkmodeIsActive ? this.moonIcon : this.sunIcon }">
    <div class='darkmode-toggle ${ this.darkmodeIsActive ? 'active' : ''}'>
      <div class='darkmode-toggle-slider'></div>
    </div>`;

    this.containerElement!.innerHTML = toggleElement;
    this.toggleElement = this.containerElement!.querySelector('.darkmode-toggle');
    
    this.toggleElement?.addEventListener('click', () => {
      this.setDarkmode(!this.darkmodeIsActive);
    });
  }

  private updateStatus() {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme && currentTheme === 'dark') {
      this.setDarkmode(true);
    } else {
      this.setDarkmode(false);
    }
  }

  private setDarkmode(active: boolean) {
    if (active) {
      document.documentElement.setAttribute("data-theme", 'dark');
      this.toggleElement!.classList.add('active');
      this.containerElement!.querySelector('.darkmode-icon')!.setAttribute('src', this.moonIcon);
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute("data-theme", 'light');
      this.toggleElement!.classList.remove('active');
      this.containerElement!.querySelector('.darkmode-icon')!.setAttribute('src', this.sunIcon);
      localStorage.setItem('theme', 'light');
    }

    this.darkmodeIsActive = active;
  }
}

