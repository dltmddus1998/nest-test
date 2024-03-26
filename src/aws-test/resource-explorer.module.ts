import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { ResourceExplorerService } from './resoure-explorer.service';
import { ResourceExplorerController } from './resource-explorer.controller';
import { Explorer } from './explore';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: ['.env'],
    }),
  ],
  // controllers: [ResourceExplorerController],
  // providers: [ResourceExplorerService, Explorer],
})
export class ResourceExplorerModule {}
