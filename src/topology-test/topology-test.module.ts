import { Module } from '@nestjs/common';
import { TopologyTestController } from './topology-test.controller';
import { UserSecurityService } from './service/user-security.service';
import { RegionService } from './service/region.service';
import { SubnetRoutesService } from './service/subnet-routes.service';

@Module({
  imports: [],
  controllers: [TopologyTestController],
  providers: [UserSecurityService, RegionService, SubnetRoutesService],
})
export class TopologyTestModule {}
