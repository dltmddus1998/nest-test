import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TopologyTestModule } from './topology-test/topology-test.module';
import { ResourceExplorerModule } from './aws-test/resource-explorer.module';

@Module({
  imports: [
    TopologyTestModule,
    ResourceExplorerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: [`.env`],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
