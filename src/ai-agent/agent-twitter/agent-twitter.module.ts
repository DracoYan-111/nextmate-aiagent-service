import { Module } from '@nestjs/common';
import { AgentTwitterController } from './agent-twitter.controller';
import { AgentTwitterService } from './agent-twitter.service';

@Module({
  controllers: [AgentTwitterController],
  providers: [AgentTwitterService]
})
export class AgentTwitterModule {}
