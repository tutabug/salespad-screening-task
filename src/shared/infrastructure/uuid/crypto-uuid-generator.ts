import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UuidGenerator } from './uuid-generator';

@Injectable()
export class CryptoUuidGenerator extends UuidGenerator {
  generate(): string {
    return randomUUID();
  }
}
