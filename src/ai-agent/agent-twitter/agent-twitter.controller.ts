import {
  Controller,
  HttpCode,
  Post,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AgentTwitterService } from './agent-twitter.service';
import {
  EventEarning,
  MultiplierEarning,
  SendATweetDto,
  UsdEarning,
} from './dto/agent-twitter.dto';
import { SendATwitterAuthGuard } from '../../auth/auth.guard';

@Controller('agent-twitter')
export class AgentTwitterController {
  constructor(private readonly agentTwitterService: AgentTwitterService) {}

  @Post('send-tweet')
  @UseGuards(SendATwitterAuthGuard)
  @HttpCode(200)
  async sendATweet(
    @Body() body: SendATweetDto<MultiplierEarning | UsdEarning | EventEarning>,
  ) {
    if (
      body.tweetType === 'MultiplierEarning' ||
      body.tweetType === 'UsdEarning' ||
      body.tweetType === 'EventEarning'
    ) {
      const result = await this.agentTwitterService.sendATweet(body);

      return {
        success: true,
        code: 'SUCCESS',
        msg: 'success',
        data: { state: result },
      };
    }
    throw new BadRequestException('Invalid tweet type');
  }
}
