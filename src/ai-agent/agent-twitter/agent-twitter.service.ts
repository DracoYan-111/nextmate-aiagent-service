import {
  EventEarning,
  MultiplierEarning,
  SendATweetDto,
  UsdEarning,
} from './dto/agent-twitter.dto';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Scraper } from 'agent-twitter-client';
import { ConfigService } from '@nestjs/config';
import { Cookie } from 'tough-cookie';
import { ImageGenerationGuard } from 'src/util/image-generation';
import { Agent } from 'alith';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AgentTwitterService implements OnModuleInit {
  private readonly cookiesFilePath = path.join(
    __dirname,
    'twitter-cookies.json',
  );
  private readonly logger = new Logger(AgentTwitterService.name);
  private scraper: Scraper;
  private twitterUsername: string;
  private twitterPassword: string;
  private aiApiKey: string;
  private aiModel: string;
  private aiBaseUrl: string;

  // 读取配置文件
  constructor(private configService: ConfigService) {
    this.scraper = new Scraper();
    this.twitterUsername = this.configService.get<string>('TWITTER_USERNAME')!;
    this.twitterPassword = this.configService.get<string>('TWITTER_PASSWORD')!;
    this.aiApiKey = this.configService.get<string>('AI_API_KEY')!;
    this.aiModel = this.configService.get<string>('AI_MODEL')!;
    this.aiBaseUrl = this.configService.get<string>('AI_BASE_URL')!;
  }

  // 在模块初始化时自动登录 Twitter
  async onModuleInit() {
    const cookiesLoaded = await this.loadCookies();
    if (!cookiesLoaded) {
      await this.login(); // 如果加载失败，则执行登录
    }
  }

  // 发送推文
  async sendATweet(
    body: SendATweetDto<MultiplierEarning | UsdEarning | EventEarning>,
  ) {
    // 处理图片
    const mediaData = await this.imageProcess(body.data);

    // 处理文案
    const tweet = this.tweetProcess(body.tweetData, body.tweetUrl);

    // 发送前确定登录状态
    const isloggedIn = await this.scraper.isLoggedIn();
    if (!isloggedIn) {
      await this.login();
    }
    // 发送推文
    const sendTweetResults = await this.scraper.sendTweet(
      tweet,
      undefined, // 回复的推文 ID
      mediaData,
    );

    if (sendTweetResults.status === 200) {
      this.logger.log(`推文发送成功`);
      return true;
    }
    return false;
  }

  // 登录方法
  async login() {
    try {
      // Log in
      await this.scraper.login(this.twitterUsername, this.twitterPassword);

      // 登录成功后保存 cookies
      await this.saveCookies();
      const user = await this.scraper.me();
      this.logger.log(`Twitter 登录成功:${user?.username}`);
    } catch (error) {
      throw new Error('Twitter 登录失败:', error);
    }
  }

  // 保存 cookies 到本地文件
  private async saveCookies() {
    const cookies = await this.scraper.getCookies();

    try {
      fs.writeFileSync(
        this.cookiesFilePath,
        JSON.stringify(cookies, null, 2),
        'utf-8',
      );
      this.logger.log(`Cookies 保存成功`);
    } catch (error) {
      this.logger.error(`Cookies 保存失败:${error}`);
    }
  }

  // 从本地文件加载 cookies
  private async loadCookies(): Promise<boolean> {
    if (fs.existsSync(this.cookiesFilePath)) {
      const cookiesData = fs.readFileSync(this.cookiesFilePath, 'utf-8');
      const cookiesJSONParse: Cookie[] = JSON.parse(cookiesData);
      const cookies = cookiesJSONParse.map(
        (cookie) => `${Cookie.fromJSON(cookie)}`,
      );
      await this.scraper.setCookies(cookies);
      this.logger.log(`Cookies 已加载`);
      return true;
    }
    this.logger.log(`Cookies 加载失败`);
    return false;
  }

  // 推文处理
  private tweetProcess(originalTweet: string, tweetUrl: string): string {
    // 生成推文
    try {
      const agent = new Agent({
        name: 'Nextmate AI Agent',
        model: this.aiModel, // or `deepseek-chat` for DeepSeek V3
        apiKey: this.aiApiKey, // 生产环境中换成通过配置文件获取，包括model、apikey、baseurl等信息
        baseUrl: this.aiBaseUrl,
        preamble:
          'You are a AI Agent of our platform to help the user perform smart operations.',
      });

      // 原始推文
      const prompt =
        '对于下面这段文案进行润色并生成合适的推文，上下文背景是用户在我们的预测市场平台活动上获得了奖金，活动链接是：' +
        tweetUrl +
        '，我们的官方Twitter账号要发推文进行奖赏播报，优化后的推文要求：\n1、长度符合Twitter的tweet要求 \n2、用户不需要@ \n3、推文内容要引人入胜，吸引用户点击推文里的活动链接 \n4、推文内容使用英文 \n5、推文内容一定要包含#predictionMarket \n6、优化后的内容放在<<< >>>中， 要优化的文案内容是：\n' +
        originalTweet;
      const polished_tweet = agent.prompt(prompt);
      if (!polished_tweet) {
        throw new Error('推文处理失败');
      }

      const matches = [...polished_tweet.matchAll(/<<<(.*?)>>>/gs)];
      const results = matches.map((match) => match[1].trim());

      return results[0];
    } catch (error) {
      throw new Error('推文处理失败:', error);
    }
  }

  // 推文图片处理
  private async imageProcess(
    imageData: MultiplierEarning | UsdEarning | EventEarning,
  ) {
    // 基础属性
    const watermarks: any[] = [
      {
        id: '1742979401011',
        text: `@${imageData.userName}`,
        color: '#ffffff',
        gradientColor: '#0000FF',
        useGradient: false,
        fontSize: 96,
        position: { x: 170, y: 439 },
      },
    ];

    if ('multiplier' in imageData) {
      watermarks.push(
        {
          id: '1742979409723',
          text: `+${imageData.multiplier.toString()}%`,
          color: '#EBD7FF',
          gradientColor: '#0000FF',
          useGradient: false,
          fontSize: 369,
          position: { x: 170, y: 830 },
        },
        {
          id: '1742979448517',
          text: `${imageData.tokenAmount.toString()} ${imageData.tokenSymbol} ($${imageData.usdAmount.toString()})`,
          color: '#EBD7FF',
          gradientColor: '#0000FF',
          useGradient: false,
          fontSize: 112,
          position: { x: 170, y: 1027 },
        },
      );
    } else if ('rank' in imageData) {
      watermarks.push(
        {
          id: '1742979401834',
          text: `ranks`,
          color: '#ffffff',
          gradientColor: '#0000FF',
          useGradient: false,
          fontSize: 80,
          position: { x: 170, y: 610 },
        },
        {
          id: '1742979409723',
          text: `#${imageData.rank.toString()}`,
          color: '#EBD7FF',
          gradientColor: '#0000FF',
          useGradient: false,
          fontSize: 100,
          position: { x: 407, y: 610 },
        },
        {
          id: '1742979447342',
          text: `, potentially winning`,
          color: '#ffffff',
          gradientColor: '#0000FF',
          useGradient: false,
          fontSize: 80,
          position: { x: 541, y: 604 },
        },
        {
          id: '1742979448517',
          text: `$${imageData.usdAmount.toString()}`,
          color: '#EBD7FF',
          gradientColor: '#0000FF',
          useGradient: false,
          fontSize: 369,
          position: { x: 170, y: 975 },
        },
        {
          id: '1742979447462',
          text: `(${imageData.tokenAmount.toString()} ${imageData.tokenSymbol})`,
          color: '#EBD7FF',
          gradientColor: '#0000FF',
          useGradient: false,
          fontSize: 112,
          position: { x: 170, y: 1141 },
        },
      );
    } else {
      watermarks.push(
        {
          id: '174297944',
          text: `win`,
          color: '#ffffff',
          gradientColor: '#0000FF',
          useGradient: false,
          fontSize: 75,
          position: { x: 670, y: 439 },
        },
        {
          id: '1742979409723',
          text: `$${imageData.usdAmount.toString()}`,
          color: '#EBD7FF',
          gradientColor: '#0000FF',
          useGradient: false,
          fontSize: 369,
          position: { x: 170, y: 833 },
        },
        {
          id: '1742979448517',
          text: `(${imageData.tokenAmount.toString()} ${imageData.tokenSymbol})`,
          color: '#EBD7FF',
          gradientColor: '#0000FF',
          useGradient: false,
          fontSize: 112,
          position: { x: 170, y: 1019 },
        },
      );
    }

    const imageFileSync = await ImageGenerationGuard.downloadImage(watermarks);

    return [{ data: imageFileSync, mediaType: 'image/png' }];
  }
}
