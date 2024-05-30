import { infoService } from "../../infoService";

export class VersionService {
  baseUrl = (window as any).baseUrl;

  constructor() {
  }

  /**
   * Generates the docs url for the specified version and path
   */
  generateDocsUrl(version: number, docsPath: string = ''): string {
    return versionService.baseUrl + '/documentation/v' + version + '/' + docsPath;
  }

  /**
   * Extracts the version of the specified url
   */
  extractDocsVersionFromUrl(url: string): number|null {
    if (!url.includes('/documentation/v')) {
      return null;
    }
    return parseInt(url.split('/documentation/')[1].split('/')[0].replace(/\D/g,''));
  }
  
  /**
   * Transforms a full docs url to the equivalent of a different version (irrespective if the page actually exists or not)
   */
  transformUrlForDocsVersion(url: string, version: number) {
    return url.replace(/documentation\/.*\//, "documentation/v" + version + "/");
  }

  /**
   * Transform a full docs url to the equivalent of a different version and returns it only if the page actually exists.
   * Otherwise, returns the index page for the different version.
   */
  async matchUrlForDocsVersion(url: string, version: number): Promise<string> {
    // Get current url adjusted for selected version
    const targetUrl = versionService.transformUrlForDocsVersion(location.pathname.split(infoService.baseUrl)[1], version);

    // Try to find it in list of existing docs pages
    const infoJson = await infoService.getInfoJson();
    let matchingUrl: string|null = null;
    for (const page of infoJson.pages) {
      if (page.url.replace('.html', '') === targetUrl) {
        matchingUrl = page.url.replace('.html', '');
        break;
      }
    }

    // Return if found. Otherwise return index page of other docs version.
    return matchingUrl ? (infoService.baseUrl + matchingUrl) : versionService.generateDocsUrl(version);
  }
}

export const versionService = new VersionService();