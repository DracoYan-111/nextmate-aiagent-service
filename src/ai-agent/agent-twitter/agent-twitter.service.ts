import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Scraper } from 'agent-twitter-client';
import { ConfigService } from '@nestjs/config';
import { Cookie } from 'tough-cookie';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { ImageInformation, SendATweetDto } from './dto/agent-twitter.dto';

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
  private twitterEmail: string;
  private proxURL: string;
  // 读取配置文件
  constructor(private configService: ConfigService) {
    this.scraper = new Scraper();
    this.twitterUsername = this.configService.get<string>('TWITTER_USERNAME')!;
    this.twitterPassword = this.configService.get<string>('TWITTER_PASSWORD')!;
    this.twitterEmail = this.configService.get<string>('TWITTER_EMAIL')!;
    this.proxURL = this.configService.get<string>('PROXY_URL')!;
  }

  // 在模块初始化时自动登录 Twitter
  async onModuleInit() {
    const cookiesLoaded = await this.loadCookies();
    if (!cookiesLoaded) {
      await this.login(); // 如果加载失败，则执行登录
    }
  }

   // 发送推文
   async sendATweet(body: SendATweetDto<ImageInformation>){
    // 处理图片
    const mediaData = this.imageProcess(body.imageData);
    // 处理文案
    const tweet = this.tweetProcess(body.tweetData, body.tweetUrl);
    
    // 发送推文
    const sendTweetResults = await this.scraper.sendTweet(
      tweet,
      undefined,
      mediaData,
    );
    if (sendTweetResults) {
      this.logger.log(`推文发送成功`);
      return sendTweetResults;
    }
    this.logger.error(`推文发送失败`);
    return sendTweetResults;
  }

  // 登录方法
  async login() {
    try {
      // Log in
      await this.scraper.login(
        this.twitterUsername,
        this.twitterPassword,
        this.twitterEmail,
      );
      const isLoggedIn = await this.scraper.isLoggedIn();
      if (!isLoggedIn) {
        this.logger.error('Twitter 登录失败');
      }
      // 登录成功后保存 cookies
      await this.saveCookies();
      this.logger.log(`Twitter 登录成功:${this.twitterUsername}`);
    } catch (error) {
      this.logger.error('Twitter 登录失败:', error);
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
  private tweetProcess(tweetData: string, tweetUrl: string): string {
    return tweetData + tweetUrl;
  }

  // 推文图片处理
  private imageProcess(imageData: ImageInformation) {
    // TODO:生成图片
    const uuid = `WechatIMG6072`; //uuidv4();
    const imageUrl = uuid + '.jpg';
    return [
      {
        data: fs.readFileSync(imageUrl),
        mediaType: 'image/jpeg',
      },
    ];
  }
}
