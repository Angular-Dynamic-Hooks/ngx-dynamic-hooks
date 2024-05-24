export interface InfoJson {
  pages: {title: string, url: string}[];
}

export class InfoService {
  baseUrl = (window as any).baseUrl;
  private infoJson: InfoJson|null = null
  private infoJsonPromise: Promise<InfoJson>|null = null;

  constructor() {
  }

  async getInfoJson(): Promise<InfoJson> {
    if (!this.infoJson) {
      if (!this.infoJsonPromise) {
        this.infoJsonPromise = fetch(this.baseUrl + '/assets/info.json').then(response => response.json()).then(json => { this.infoJson = json; return json; });
      }
        
      return await this.infoJsonPromise;
    }

    return this.infoJson!;
  }
}

export const infoService = new InfoService();