import { infoService } from "../../infoService";
import { GenericWidgetController, Widget } from "../../widgetBootstrap";
import { versionService } from "./versionService";

export class VersionLogoLinkWidget implements Widget {
  static selector: string = 'a.site-title';
  linkElement: HTMLElement|null = null;

  onMount(hostElement: Element, data: {[key: string]: any}, controller: GenericWidgetController) {
    this.linkElement = hostElement as HTMLElement;
    this.addLink();
  }

  private async addLink() {
    // Get highest available version
    const infoJson = await infoService.getInfoJson();
    let highestVersion: number|null = null;
    for (const page of infoJson.pages) {
      const pageVersion = versionService.extractDocsVersionFromUrl(page.url);
      if (pageVersion && (highestVersion == null || pageVersion > highestVersion)) {
        highestVersion = pageVersion;
      }
    }
  
    if (highestVersion) {
      const newestVersionUrl = await versionService.generateDocsUrl(highestVersion);
      this.linkElement!.setAttribute('href', newestVersionUrl);
    }
  }

}



