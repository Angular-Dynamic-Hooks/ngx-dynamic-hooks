export const loadArticleToc = () => {
  const articleElement = document.querySelector('.article');
  const tocWrapperElement = document.querySelector('.article-toc-wrapper');
  
  if (articleElement && tocWrapperElement) {
    const titleElements = articleElement.querySelectorAll('h1, h2, h3, h4');

    // Create toc html
    const tocElement = `
    <div class='toc'>
      <ul class="toc-list">
        ${ Array.from(titleElements).map(titleElement => {
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

    tocWrapperElement.innerHTML = tocElement;

    // Register visibility observer
    const visibilityStates: Map<string, boolean> = new Map();
    for (const titleElement of titleElements) {
      visibilityStates.set(titleElement.id, false);
    }

    const observer = new IntersectionObserver(onVisiblityChange, {
      rootMargin: "0px",
      threshold: 1.0,
    });

    for (const titleElement of titleElements) {
      observer.observe(titleElement);
    }

    function onVisiblityChange (entries: IntersectionObserverEntry[]) {
      for (const entry of entries) {
        visibilityStates.set(entry.target.id, entry.isIntersecting);
      }

      const firstVisibleTitle = Array.from(visibilityStates).find(entry => entry[1] === true);
      if (firstVisibleTitle) {
        // Reset all
        tocWrapperElement!.querySelectorAll('.toc-entry').forEach(element => element.classList.remove('active'));
      
        // Set new title to active
        // console.log(firstVisibleTitle[1].element)
        tocWrapperElement!.querySelector('#toc-' + firstVisibleTitle[0])!.classList.add('active');
      }
    }

  }
}