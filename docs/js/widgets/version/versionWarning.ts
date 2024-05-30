import { infoService } from "../../infoService";
import { GenericWidgetController, Widget } from "../../widgetBootstrap";
import { versionService } from "./versionService";

export class VersionWarningWidget implements Widget {
  static selector: string = '#version-warning';
  hostElement: Element|null = null;
  linkElement: HTMLElement|null = null;
  currentVersion: number = versionService.extractDocsVersionFromUrl(location.pathname)!;

  onMount(hostElement: Element, data: {[key: string]: any}, controller: GenericWidgetController) {
    this.hostElement = hostElement;
    this.linkElement = document.querySelector('.version-warning-link')!;

    this.addLink();
  }

  private async addLink() {
    const currentVersion = versionService.extractDocsVersionFromUrl(location.pathname)!;

    // Get highest available version
    const infoJson = await infoService.getInfoJson();
    let highestVersion: number|null = currentVersion;
    for (const page of infoJson.pages) {
      const pageVersion = versionService.extractDocsVersionFromUrl(page.url);
      if (pageVersion && pageVersion > highestVersion) {
        highestVersion = pageVersion;
      }
    }
  
    if (highestVersion && this.linkElement) {
      const newestVersionUrl = await versionService.matchUrlForDocsVersion(location.pathname.split(infoService.baseUrl)[1], highestVersion);
      this.linkElement.setAttribute('href', newestVersionUrl);
    }
  }

}



