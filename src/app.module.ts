import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentTwitterModule } from './ai-agent/agent-twitter/agent-twitter.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AgentTwitterModule,
    ConfigModule.forRoot( {
      isGlobal: true, // 设置为全局模块
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
