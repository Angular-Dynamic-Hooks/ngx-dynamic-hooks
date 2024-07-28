import { GenericWidgetController, Widget } from "../widgetBootstrap";

export class ArticleTocWidget implements Widget {
  static selector: string = '.article-toc-wrapper';
  public tocWrapperElement: HTMLElement|null = null;
  public articleElement: HTMLElement|null = null;
  public titleElements: NodeListOf<HTMLElement>|null = null;

  onMount(hostElement: Element, data: {[key: string]: any}, controller: GenericWidgetController) {
    this.tocWrapperElement = hostElement as HTMLElement;
    this.articleElement = document.querySelector('.article');
    this.titleElements = this.articleElement?.querySelectorAll('.article > h1, .article > h2, .article > h3, .article > h4') || null;
    
    if (this.articleElement && this.titleElements) {  
      this.createTocHtml();
      this.initTocScrollListener();
    }
  }

  private createTocHtml() {
    // Create toc html
    const tocElement = `
    <div class='toc'>
      <ul class="toc-list">
        ${ Array.from(this.titleElements!).map(titleElement => {
          return `
          <li id='toc-${ titleElement.id }' class='toc-entry'>
            <a class='toc-entry-link' href="${ location.href.split('#')[0] + '#' + titleElement.id }">
              <div class='toc-entry-slider'>
                <div class='toc-entry-slider-thumb'></div>
              </div>
              <div class='toc-entry-content ${ titleElement.tagName.toLowerCase() }'>${titleElement.textContent}</div>
            </a>
          </li>`
        }).join('') }
      </ul>
    </div>`;

    this.tocWrapperElement!.innerHTML = tocElement;
  }

  private initTocScrollListener() {
    const visibilityStates: Map<string, boolean> = new Map();
    for (const titleElement of this.titleElements!) {
      visibilityStates.set(titleElement.id, false);
    }
  
    const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        visibilityStates.set(entry.target.id, entry.isIntersecting);
      }
  
      const firstVisibleTitle = Array.from(visibilityStates).find(entry => entry[1] === true);
      if (firstVisibleTitle) {
        // Reset all
        this.tocWrapperElement!.querySelectorAll('.toc-entry').forEach(element => element.classList.remove('active'));
      
        // Set new title to active
        this.tocWrapperElement!.querySelector('#toc-' + firstVisibleTitle[0])!.classList.add('active');
      }
    }, {
      rootMargin: "0px",
      threshold: 1.0,
    });
  
    for (const titleElement of this.titleElements!) {
      observer.observe(titleElement);
    }
  }
}

