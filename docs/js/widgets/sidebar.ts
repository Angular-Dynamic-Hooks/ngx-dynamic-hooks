import { GenericWidgetController, Widget, WidgetController } from "../widgetBootstrap";

export class SidebarWidget implements Widget {
  static selector: string = '.sidebar-section.hasChildren';
  public section: HTMLElement|null = null;
  public toggleButtonElement: HTMLElement|null = null;
  public articleElement: HTMLElement|null = null;
  public titleElements: NodeListOf<HTMLElement>|null = null;

  onMount(hostElement: Element, data: {[key: string]: any}, controller: GenericWidgetController) {
    this.section = hostElement as HTMLElement;
    this.toggleButtonElement = this.section!.querySelector('.sidebar-title-toggle');
    this.articleElement = document.querySelector('.article');
    this.titleElements = this.articleElement?.querySelectorAll('h1, h2, h3, h4') || null;

    this.registerToggleButton();
    this.registerActiveSectionScrollListener();
  }

  private registerToggleButton() {      
    if (!this.toggleButtonElement) {
      return;
    }

    this.toggleButtonElement.addEventListener('click', () => {
      if (this.section!.classList.contains('toggled')) {
        this.section!.classList.remove('toggled');
      } else {
        this.section!.classList.add('toggled');
      }
    });
  }

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
}