import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { AgentToolsService } from './tools/agent-tools.service';

@Module({
  controllers: [AgentController],
  providers: [AgentService, AgentToolsService],
  exports: [AgentService, AgentToolsService],
})
export class AgentModule {}
