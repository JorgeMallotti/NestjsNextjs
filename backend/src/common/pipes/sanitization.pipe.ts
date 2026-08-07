import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { sanitizeObject } from '../utils/sanitizer';

/**
 * Global sanitization pipe — strips HTML/XML tags from all
 * incoming string values in POST/PATCH/PUT request bodies.
 *
 * Registered in main.ts as a global pipe so every mutation
 * endpoint is protected against stored XSS automatically.
 */
@Injectable()
export class SanitizationPipe implements PipeTransform {
  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    // Only sanitize body data (objects), not primitive params or query
    if (typeof value === 'object') {
      return sanitizeObject(value);
    }

    return value;
  }
}
