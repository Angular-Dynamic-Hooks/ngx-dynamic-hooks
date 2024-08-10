import { infoService } from "../../infoService";

export class VersionService {
  baseUrl = (window as any).baseUrl;

  constructor() {
  }

  async getAvailableVersions() {
    const infoJson = await infoService.getInfoJson();
    const versions: number[] = [];

    for (const page of infoJson.pages) {
      if (page.url.startsWith('/documentation/')) {
        const versionNr = versionService.getDocsVersionFromUrl(page.url)!;
        if (versionNr && !versions.includes(versionNr)) {
          versions.push(versionNr);
        }
      }
    }

    // Sort
    versions.sort();

    // Add the current version as +1 of the highest found version
    versions.push(versions[versions.length - 1] + 1);

    return versions;    
  }

  async getLatestVersion() {
    const allVersions = await this.getAvailableVersions();
    return allVersions[allVersions.length - 1];
  }

  /**
   * Extracts the version of the specified url
   */
  getDocsVersionFromUrl(url: string): number|null {
    const match = url.match(/\/documentation\/v(\d)\//);
    if (match) {
      return parseInt(match[1]);
    } else {
      return null;
    }
  }

  /**
   * Generates the docs url for the specified version and path
   */
  async generateDocsUrl(version: number, docsPath: string = ''): Promise<string> {
    const latestVersion = await this.getLatestVersion();
    return this.baseUrl + '/documentation/' + (latestVersion === version ? '' : `v${version}/`) + docsPath;
  }
  
  /**
   * Transforms a full docs url to the equivalent of a different version (irrespective if the page actually exists or not)
   */
  async transformUrlForDocsVersion(url: string, version: number): Promise<string|null> {
    // Extracts the version-agnostic path from the url as the first capture group
    const match = url.match(/\/documentation(?:$|(?:\/v\d\/)|\/)(.*)/);
    if (match) {
      return await this.generateDocsUrl(version, match[1]);
    } else {
      return null;
    }
  }

  /**
   * Transform a full docs url to the equivalent of a different version and returns it only if the page actually exists.
   * Otherwise, returns the index page for the different version.
   */
  async matchUrlForDocsVersion(url: string, version: number): Promise<string|null> {
    // Get current url adjusted for selected version
    let targetUrl = await versionService.transformUrlForDocsVersion(url, version);

    if (!targetUrl) { return null; }

    // Try to find it in list of existing docs pages
    const infoJson = await infoService.getInfoJson();
    let matchingUrl: string|null = null;
    for (const page of infoJson.pages) {
      const testUrl = infoService.baseUrl + page.url.replace('.html', '');
      if (testUrl === targetUrl) {
        matchingUrl = testUrl;
        break;
      }
    }

    // Return if found. Otherwise return index page of other docs version.
    return matchingUrl || versionService.generateDocsUrl(version);
  }
}

export const versionService = new VersionService();