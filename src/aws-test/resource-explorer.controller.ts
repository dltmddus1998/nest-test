import { Controller, Get, Post } from '@nestjs/common';
import { ResourceExplorerService } from './resoure-explorer.service';

@Controller('resource-explorer')
export class ResourceExplorerController {
  constructor(private resourceExplorerService: ResourceExplorerService) {}

  @Get('compute')
  getComputeInfo(): any {
    return this.resourceExplorerService.exploreComputeInfo();
  }
}
