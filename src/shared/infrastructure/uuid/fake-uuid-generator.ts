import { Injectable } from '@nestjs/common';
import { UuidGenerator } from './uuid-generator';

@Injectable()
export class FakeUuidGenerator extends UuidGenerator {
  private counter = 0;

  generate(): string {
    const hex = this.counter.toString(16).padStart(12, '0');
    this.counter = (this.counter + 1) % 0x1000000000000;
    return `00000000-0000-0000-0000-${hex}`;
  }

  reset(): void {
    this.counter = 0;
  }
}
