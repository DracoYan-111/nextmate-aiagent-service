import { Controller, HttpCode, Post, Body, BadRequestException } from '@nestjs/common';
import { AgentTwitterService } from './agent-twitter.service';
import { ImageInformation, SendATweetDto } from './dto/agent-twitter.dto';

@Controller('agent-twitter')
export class AgentTwitterController {
  constructor(private readonly agentTwitterService: AgentTwitterService) {}

  @Post('send-tweet')
  @HttpCode(200)
  async sendATweet(@Body() body: SendATweetDto<ImageInformation>) {
    if (
      body.tweetType === '' ||
      body.tweetData === '' ||
      body.tweetUrl === ''
    ) {
      throw new BadRequestException(['sendATweet']);
    }

    return this.agentTwitterService.sendATweet(body);
  }
}
