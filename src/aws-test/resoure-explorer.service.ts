import { Injectable } from '@nestjs/common';
import { Explorer } from './explore';

@Injectable()
export class ResourceExplorerService {
  constructor(private readonly explorer: Explorer) {}
  async exploreComputeInfo() {
    // return await this.explorer.test();
  }
}
