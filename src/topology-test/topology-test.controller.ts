import { Controller, Get, Post } from '@nestjs/common';
import { UserSecurityService } from './service/user-security.service';

@Controller('topology')
export class TopologyTestController {
  constructor(private readonly userSeucirytService: UserSecurityService) {}

  @Get('user-security')
  getUserSecurity(): any {
    return this.userSeucirytService.updateUserSecurityTemplate();
  }
}
