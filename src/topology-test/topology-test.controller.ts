import { Controller, Get, Post } from '@nestjs/common';
import { UserSecurityService } from './service/user-security.service';
import { RegionService } from './service/region.service';

@Controller('topology')
export class TopologyTestController {
  constructor(
    private readonly userSeucirytService: UserSecurityService,
    private readonly regionService: RegionService,
  ) {}

  @Get('user-security')
  getUserSecurity(): any {
    return this.userSeucirytService.updateUserSecurityTemplate();
  }

  @Get('region')
  getRegion() {
    return this.regionService.updateRegionTemplate();
  }
}
