export const initSidebarToggle = () => {
  const sectionElementsWithChildren = document.querySelectorAll('.sidebar-section.hasChildren');
  
  if (sectionElementsWithChildren) {
    for (const sectionElement of Array.from(sectionElementsWithChildren)) {
      const toggleButtonElement = sectionElement.querySelector('.sidebar-title-toggle');
      
      toggleButtonElement?.addEventListener('click', () => {
        if (sectionElement?.classList.contains('toggled')) {
          sectionElement?.classList.remove('toggled');
        } else {
          sectionElement?.classList.add('toggled');
        }
      });
    }
    
  }
}

const initSidebarScrollListener = () => {
  const currentSectionWithChildren = document.querySelector('.sidebar .sidebar-section.hasChildren.active');
  const articleElement = document.querySelector('.article');

  if (currentSectionWithChildren && articleElement) {
    const titleElements = articleElement.querySelectorAll('h1, h2, h3, h4');

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
        const selector = `.sidebar-ul .sidebar-link[href='${ location.pathname.split('#')[0] + '#' + firstVisibleTitle[0] }']`;
        const activeChild = currentSectionWithChildren!.querySelector(selector);

        if (activeChild) {
          // Reset all
          currentSectionWithChildren!.querySelectorAll('.sidebar-ul .sidebar-link').forEach(element => element.closest('.sidebar-li')?.classList.remove('active'));
        
          // Set new title to active
          activeChild?.closest('.sidebar-li')?.classList.add('active');
        }
      }
    }
  }
}

export const initSidebar = () => {
  initSidebarToggle();
  initSidebarScrollListener();
}