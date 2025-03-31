import { createCanvas, loadImage } from 'canvas';
import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';
import * as fs from 'fs';

@Injectable()
export class ImageGenerationGuard {
  static async downloadImage(watermarks: any[]) {
    const logger = new Logger(ImageGenerationGuard.name);

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

      logger.log('Image processing completed');
      // 将画布转换为buffer
      const buffer = canvas.toBuffer('image/png');
    //   // 保存文件
    //   const fileName = 'watermarked-image.jpeg';
    //   fs.writeFileSync(fileName, buffer);
      return buffer;
    } catch (error) {
      throw new Error(`Image processing failed:${error}`);
    }
  }
}
