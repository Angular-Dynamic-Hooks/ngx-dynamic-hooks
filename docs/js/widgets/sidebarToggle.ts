import { GenericWidgetController, Widget } from "../widgetBootstrap";

export class SidebarToggleWidget implements Widget {
  static selector: string = '.sidebar';
  sidebarElement: HTMLElement|null = null;
  toggleButtonElement: HTMLElement|null = null;
  wrapperElement: HTMLElement|null = null;
  sidebarIsToggled: boolean = false;

  onMount(hostElement: Element, data: {[key: string]: any}, controller: GenericWidgetController) {
    this.sidebarElement = hostElement as HTMLElement;
    this.toggleButtonElement = document.querySelector('#sidebar-toggle');
    this.wrapperElement = document.querySelector('#wrapper');

    this.registerToggleFunctionality();
  }

  private registerToggleFunctionality() {      
    if (!this.toggleButtonElement || !this.wrapperElement) {
      return;
    }

    this.toggleButtonElement.addEventListener('click', () => {
      if (this.sidebarIsToggled) {
        this.hideSidebar();
      } else {
        this.showSidebar();
      }
    });

    document.addEventListener('click', event => {
      if (!this.toggleButtonElement!.contains(event.target as Node) && !this.sidebarElement!.contains(event.target as Node)) {
        this.hideSidebar();
      }
    });

    window.addEventListener('resize', event => {
      if (this.sidebarIsToggled && window.innerWidth >= 1024) {
        this.hideSidebar();
      }
    });
  }

  private showSidebar() {
    this.sidebarIsToggled = true;
    this.sidebarElement!.classList.add('toggled');
    this.wrapperElement!.classList.add('locked');
  }

  private hideSidebar() {
    this.sidebarIsToggled = false;
    this.sidebarElement!.classList.remove('toggled');
    this.wrapperElement!.classList.remove('locked');
  }

  /*
  private registerActiveSectionScrollListener() {
    if (!this.section!.classList.contains('active') || !this.titleElements) {
      return;
    }

    const visibilityStates: Map<string, boolean> = new Map();
    for (const titleElement of this.titleElements) {
      visibilityStates.set(titleElement.id, false);
    }

    const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        visibilityStates.set(entry.target.id, entry.isIntersecting);
      }

      const firstVisibleTitle = Array.from(visibilityStates).find(entry => entry[1] === true);
      if (firstVisibleTitle) {
        const selector = `.sidebar-ul .sidebar-link[href='${ location.pathname.split('#')[0] + '#' + firstVisibleTitle[0] }']`;
        const activeChild = this.section!.querySelector(selector);

        if (activeChild) {
          // Reset all
          this.section!.querySelectorAll('.sidebar-ul .sidebar-link').forEach(element => element.closest('.sidebar-li')?.classList.remove('active'));
        
          // Set new title to active
          activeChild?.closest('.sidebar-li')?.classList.add('active');
        }
      }
    }, {
      rootMargin: "0px",
      threshold: 1.0,
    });

    for (const titleElement of this.titleElements) {
      observer.observe(titleElement);
    }
  }

  */
}