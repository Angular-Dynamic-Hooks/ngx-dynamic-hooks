import { InjectionToken } from "@angular/core";

export const CONTENT_STRING = new InjectionToken<any>('All of the settings registered in the whole app.');
export const contentString = `
  <app-dynamicroot></app-dynamicroot>
  <app-dynamichyperlanes></app-dynamichyperlanes>
  <app-dynamicstars></app-dynamicstars>
  <app-dynamicplanets></app-dynamicplanets>
  <app-dynamicplanetcountries></app-dynamicplanetcountries>
  <app-dynamicplanetcities></app-dynamicplanetcities>
  <app-dynamicplanetspecies></app-dynamicplanetspecies>
`;
