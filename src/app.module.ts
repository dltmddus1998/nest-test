import { Module } from '@nestjs/common';
import { TopologyTestModule } from './topology-test/topology-test.module';

@Module({
  imports: [TopologyTestModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
