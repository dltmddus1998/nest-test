import { Module } from '@nestjs/common';
import { TopologyTestController } from './topology-test.controller';
import { UserSecurityService } from './service/user-security.service';

@Module({
  imports: [],
  controllers: [TopologyTestController],
  providers: [UserSecurityService],
})
export class TopologyTestModule {}
