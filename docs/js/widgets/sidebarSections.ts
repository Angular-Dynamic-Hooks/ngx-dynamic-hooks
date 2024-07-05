import { GenericWidgetController, Widget } from "../widgetBootstrap";

export class SidebarSectionsWidget implements Widget {
  static selector: string = '.sidebar-section.hasChildren';
  public section: HTMLElement|null = null;
  public toggleButtonElement: HTMLElement|null = null;
  public articleElement: HTMLElement|null = null;
  public sidebarTitleElements: NodeListOf<HTMLElement>|null = null;
  public articleTitleElements: NodeListOf<HTMLElement>|null = null;

  onMount(hostElement: Element, data: {[key: string]: any}, controller: GenericWidgetController) {
    this.section = hostElement as HTMLElement;
    this.toggleButtonElement = this.section!.querySelector('.sidebar-title-toggle');
    this.articleElement = document.querySelector('.article');
    this.sidebarTitleElements = this.section.querySelectorAll('.sidebar-ul .sidebar-link') || null;
    this.articleTitleElements = this.articleElement?.querySelectorAll('.article > h1, .article > h2, .article > h3, .article > h4') || null;

    this.registerToggleButton();

    if (hostElement.classList.contains('active')) {
      this.registerActiveSectionScrollListener();
    }
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
    if (!this.articleTitleElements || !this.sidebarTitleElements) {
      return;
    }

    const visibilityStates: {element: Element, link: string; visible: boolean}[] = [];
    for (const sidebarTitleElement of this.sidebarTitleElements!) {
      if (sidebarTitleElement.hasAttribute('href')) {
        visibilityStates.push({
          element: sidebarTitleElement,
          link: sidebarTitleElement.getAttribute('href')!, 
          visible: false
        });
      }
    }

    const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        const anchorLink = `${ location.pathname.split('#')[0] + '#' + entry.target.id }`;
        const sidebarTitleState = visibilityStates.find(state => state.link === anchorLink);
        if (sidebarTitleState) {
          sidebarTitleState.visible = entry.isIntersecting;
        }
      }

      console.log(visibilityStates);

      const firstVisibleTitleState = visibilityStates.find(state => state.visible);
      if (firstVisibleTitleState) {
          // Reset all
          visibilityStates.forEach(state => state.element.closest('.sidebar-li')?.classList.remove('active'));
        
          // Set new title to active
          firstVisibleTitleState.element.closest('.sidebar-li')?.classList.add('active');
      }
    }, {
      rootMargin: "0px",
      threshold: 1.0,
    });

    for (const titleElement of this.articleTitleElements) {
      observer.observe(titleElement);
    }
  }
}