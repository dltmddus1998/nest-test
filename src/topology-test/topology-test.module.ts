import { Module } from '@nestjs/common';
import { TopologyTestController } from './topology-test.controller';
import { UserSecurityService } from './service/user-security.service';
import { RegionService } from './service/region.service';

@Module({
  imports: [],
  controllers: [TopologyTestController],
  providers: [UserSecurityService, RegionService],
})
export class TopologyTestModule {}
