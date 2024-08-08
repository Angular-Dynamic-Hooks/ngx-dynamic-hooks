import { GenericWidgetController, Widget } from "../../widgetBootstrap";

export class LandingMenuWidget implements Widget {
  static selector: string = '.l-header';
  headerElement: HTMLElement|null = null;

  onMount(hostElement: Element, data: {[key: string]: any}, controller: GenericWidgetController) {
    this.headerElement = (hostElement as HTMLElement);
    this.checkScrollPos();

    document.addEventListener('scroll', event => {
      this.checkScrollPos();
    })
  }

  checkScrollPos() {
    const scrollPos = document.scrollingElement!.scrollTop;

    if (scrollPos > 0 && !this.headerElement!.classList.contains('opaque')) {
      this.headerElement!.classList.add('opaque');
    } else if (scrollPos === 0 && this.headerElement!.classList.contains('opaque')) {
      this.headerElement!.classList.remove('opaque');
    }
  }
}