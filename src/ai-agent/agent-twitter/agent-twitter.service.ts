import { ImageInformation, SendATweetDto } from './dto/agent-twitter.dto';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Scraper } from 'agent-twitter-client';
import { ConfigService } from '@nestjs/config';
import { createCanvas, loadImage } from 'canvas';
import { Cookie } from 'tough-cookie';
import fetch from 'node-fetch';
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
  async sendATweet(body: SendATweetDto<ImageInformation>) {
    // 处理图片
    const mediaData = await this.imageProcess(body.imageData);

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
  private async imageProcess(imageData: ImageInformation) {
    // 生成图片
    const watermarks = [
      {
        id: '1742979401011',
        text: '@' + imageData.userName,
        color: '#fbf9f9',
        gradientColor: '#0000FF',
        useGradient: false,
        fontSize: 68,
        position: {
          x: 242.012832742728,
          y: 404,
        },
      },
      {
        id: '1742979409723',
        text: imageData.imageDataOne,
        color: '#fbf9f9',
        gradientColor: '#0000FF',
        useGradient: false,
        fontSize: 360,
        position: {
          x: 217.9932863493932,
          y: 798,
        },
      },
      {
        id: '1742979448517',
        text: imageData.imageDataTwo,
        color: '#fbf9f9',
        gradientColor: '#0000FF',
        useGradient: false,
        fontSize: 68,
        position: {
          x: 256.0242348055064,
          y: 956,
        },
      },
    ];
    const imageFileSync = await this.downloadImage(watermarks);

    return [{ data: imageFileSync, mediaType: 'image/png' }];
  }

  private async downloadImage(watermarks: any[]) {
    try {
      // 从URL获取图片
      const imageUrl =
        'https://cdn.nextmate.ai/image/webapp/common/x-event.png';
      const response = await fetch(imageUrl);
      const imageBuffer = await response.buffer();

      // 加载图片
      const image = await loadImage(imageBuffer);

      // 创建画布
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');

      // 绘制原始图片
      ctx.drawImage(image, 0, 0);

      // 绘制水印
      watermarks.forEach((watermark) => {
        // 设置字体
        ctx.font = `bold ${watermark.fontSize}px Inter`;

        const { x, y } = watermark.position;
        const textWidth = ctx.measureText(watermark.text).width;

        if (watermark.useGradient) {
          // 创建渐变
          const gradient = ctx.createLinearGradient(
            x,
            y - watermark.fontSize,
            x + textWidth,
            y,
          );
          gradient.addColorStop(0, watermark.color);
          gradient.addColorStop(1, watermark.gradientColor);
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = watermark.color;
        }

        // 绘制白色描边
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeText(watermark.text, x, y);

        // 填充文本
        ctx.fillText(watermark.text, x, y);
      });

      // 将画布转换为buffer
      const buffer = canvas.toBuffer('image/png');
      this.logger.log(`图片加载成功`);
      // // 保存文件
      // const fileName = 'watermarked-image.jpeg';
      // fs.writeFileSync(fileName, buffer);
      return buffer;
    } catch (error) {
      throw new Error(`图片处理失败:${error}`);
    }
  }
}
