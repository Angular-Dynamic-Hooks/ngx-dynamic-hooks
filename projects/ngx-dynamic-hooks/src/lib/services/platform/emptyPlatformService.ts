import { Injectable } from '@angular/core';
import { PlatformService } from './platformService';

/**
 * Placeholder implementation for when user has not provided a custom PlatformService
 */
@Injectable()
export class EmptyPlatformService implements PlatformService {
}