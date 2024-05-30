import { infoService } from "../../infoService";
import { GenericWidgetController, Widget } from "../../widgetBootstrap";
import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
import { versionService } from "./versionService";

export class VersionSelectWidget implements Widget {
  static selector: string = '.version-select';
  hostElement: Element|null = null;
  displayElement: HTMLElement|null = null;
  dropdownContainerElement: HTMLElement|null = null;
  dropdownElement: HTMLElement|null = null;
  // const tooltipArrow = (subMenuWrapper.querySelector('.tooltip-arrow') as HTMLElement);
  // Figure out version of current page (removes letters, keeps numbers)
  currentVersion: number = versionService.extractDocsVersionFromUrl(location.pathname)!;
  dropdownIsOpen: boolean = false;
  autoUpdateCleanup: (() => void)|null= null;

  onMount(hostElement: Element, data: {[key: string]: any}, controller: GenericWidgetController) {
    this.hostElement = hostElement;
    this.createSelectHtml();
    this.registerDropdown();
  }

  private createSelectHtml() {
    // Create toc html
    const selectElement = `
      <div class='version-select-container'>
        <div class='version-select-display'>
          <span class="version-select-display-label">Version</span>
          <span class="version-select-display-version">${ this.currentVersion }.x</span>
          <img class="version-select-display-arrow" src="${ infoService.baseUrl }/assets/images/narrow_arrow_down.png">
        </div>
        <div class='version-select-dropdown-container'>
          <div class='version-select-dropdown'></div>
        </div>
      </div>
    `;

    this.hostElement!.innerHTML = selectElement;
    this.displayElement = document.querySelector('.version-select-display')!;
    this.dropdownContainerElement = document.querySelector('.version-select-dropdown-container')!;
    this.dropdownElement = document.querySelector('.version-select-dropdown')!;
  }

  private async registerDropdown() {
    // Figure out available versions
    const infoJson = await infoService.getInfoJson();
    const versions: number[] = [];
    for (const page of infoJson.pages) {
      if (page.url.startsWith('/documentation/')) {
        const versionNr = versionService.extractDocsVersionFromUrl(page.url)!;
        if (!versions.includes(versionNr)) {
          versions.push(versionNr);
        }
      }
    }

    // Add versions as dropdown options
    this.dropdownElement!.innerHTML = `${ versions.map(versionNr => `
      <span class='version-select-dropdown-entry${ versionNr === this.currentVersion ? ' current' : '' }' data-version='${ versionNr }'>Version ${ versionNr }.x</span>
    `).join('') }`;


    // Register click listeners
    this.displayElement!.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      if (!this.dropdownIsOpen) {
        this.showDropdown();
      } else {
        this.hideDropdown();
      }
    });

    document.addEventListener('click', event => {
      if (!this.hostElement!.contains(event.target as Element)) {
        this.hideDropdown();
      }
    });

    const entries = document.querySelectorAll('.version-select-dropdown-entry')!;
    for (const entry of entries) {
      entry.addEventListener('click', event => {
        this.onVersionSelect(parseInt((event.target as HTMLElement).dataset.version!)); 
      });
    }
  }

  private showDropdown() {
    this.dropdownIsOpen = true;
    this.dropdownContainerElement!.style.opacity = '1';
    this.dropdownContainerElement!.style.pointerEvents = 'all';
    this.dropdownElement!.style.top = '0px';

    // Set initial position
    this.updateDropdownPosition();

    // Automatically runs callback on resize or scroll events. Used to update position.
    this.autoUpdateCleanup = autoUpdate(
      this.hostElement!,
      this.dropdownContainerElement!,
      () => {
        if (this.dropdownIsOpen) {
          this.updateDropdownPosition();
        }
      }
    );
  }

  private updateDropdownPosition() {
    computePosition(this.hostElement!, this.dropdownContainerElement!, {
      placement: 'bottom-start',
      middleware: [
        offset(10),                         // Spacing between reference element and floating element
        flip(),                             // Flips the placement to the other side if no room
        shift({padding: 5}),                // Shifts the position along specified placement if no room
        // arrow({element: tooltipArrow})   // Gives us positioning info about where exactly to put the tooltip arrow
      ]
    }).then(({x, y, placement, middlewareData}) => {
      Object.assign(this.dropdownContainerElement!.style, {
        left: `${x}px`,
        top: `${y}px`,
      });

      // Positioning the tooltip arrow
      /*
      const oppositeSide = {
        top: 'bottom',
        right: 'left',
        bottom: 'top',
        left: 'right',
      }[placement.split('-')[0]] as string;

      const arrowX = middlewareData.arrow?.x;
      const arrowY = middlewareData.arrow?.y;
      Object.assign(tooltipArrow.style, {
        left: arrowX != null ? `${arrowX}px` : '',
        top: arrowY != null ? `${arrowY}px` : '',
        right: '',
        bottom: '',
        [oppositeSide]: '-4px',
      });
      */
    });
  }

  private hideDropdown() {
    this.dropdownIsOpen = false;
    this.dropdownContainerElement!.style.opacity = '0';
    this.dropdownContainerElement!.style.pointerEvents = 'none';
    this.dropdownElement!.style.top = '5px';

    if (this.autoUpdateCleanup) {
      this.autoUpdateCleanup();
      this.autoUpdateCleanup = null;
    }
  }

  private async onVersionSelect(version: number) {
    if (version === this.currentVersion) {
      return;
    }

    // Navigate to equivalent url of different version, if possible
    location.pathname = await versionService.matchUrlForDocsVersion(location.pathname.split(infoService.baseUrl)[1], version);
  }
}



