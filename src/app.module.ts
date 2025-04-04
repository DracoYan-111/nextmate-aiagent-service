import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentTwitterModule } from './ai-agent/agent-twitter/agent-twitter.module';
import { ConfigModule } from '@nestjs/config';
import * as fs from 'fs';
import path from 'path';

function loadJsonFiles() {
  const configPath = process.env.CONFIG_FILES || './config.json,./confidential.json';
  const files = configPath.split(',').map(f => f.trim());
  const config = {};

  for (const file of files) {
    const absPath = path.resolve(file);
    if (fs.existsSync(absPath)) {
      Object.assign(config, JSON.parse(fs.readFileSync(absPath, 'utf-8')));
    } else {
      console.warn(`[Config Warning] File not found: ${absPath}`);
    }
  }

  return () => config;
}
@Module({
  imports: [
    AgentTwitterModule,
    ConfigModule.forRoot( {
      isGlobal: true, // 设置为全局模块
      load: [loadJsonFiles()],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
