import { Injectable, SecurityContext } from '@angular/core';
import { HookIndex } from '../../interfacesPublic';
import { DomSanitizer } from '@angular/platform-browser';
import { AutoPlatformService } from '../platform/autoPlatformService';

/**
 * A utility service that sanitizes an Element and all of its children while exluding found hook elements
 */
@Injectable({
  providedIn: 'root'
})
export class ContentSanitizer {

  constructor(private domSanitizer: DomSanitizer, private platformService: AutoPlatformService) {}

  sanitize(content: Element, hookIndex: HookIndex, token: string): Element {
    for (const hook of Object.values(hookIndex)) {
      let anchorElement = this.platformService.querySelectorAll(content, '[parsetoken="' + token + '"][hookid="' + hook.id.toString() + '"]')?.[0];
      if (anchorElement) {
        anchorElement = anchorElement[0];
        console.log(hook, anchorElement);
      }
    }
    
    const innerHTML = content.innerHTML;
    const sanitizedInnerHtml = this.domSanitizer.sanitize(SecurityContext.HTML, innerHTML);
    content.innerHTML = sanitizedInnerHtml || '';

    return content;
  }

}
