import { infoService } from "../../infoService";
import { GenericWidgetController, Widget } from "../../widgetBootstrap";
import { versionService } from "./versionService";

export class VersionWarningLinkWidget implements Widget {
  static selector: string = '.version-warning-link';
  linkElement: HTMLElement|null = null;

  onMount(hostElement: Element, data: {[key: string]: any}, controller: GenericWidgetController) {
    this.linkElement = hostElement as HTMLElement;

    this.addLink();
  }

  private async addLink() {
    const latestVersion = await versionService.getLatestVersion();
    const newestVersionUrl = await versionService.matchUrlForDocsVersion(location.pathname, latestVersion) || await versionService.generateDocsUrl(latestVersion);
    this.linkElement!.setAttribute('href', newestVersionUrl || newestVersionUrl);
  }

}



