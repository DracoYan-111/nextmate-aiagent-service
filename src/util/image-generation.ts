import { createCanvas, loadImage, registerFont } from 'canvas';
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
      var nametTextWidth: number = 0;

      // 绘制水印
      watermarks.forEach((watermark) => {
        if (
          watermark.id === '1742979409723' ||
          watermark.id === '1742979401011'
        ) {
          // 注册加粗字体
          registerFont('fonts/Inter-Bold.ttf', {
            family: 'InterBold',
            weight: 'bold', // 声明字体是 bold
          });
          ctx.font = `bold ${watermark.fontSize}px InterBold`;
        } else {
          // 注册默认字体
          registerFont('fonts/InterVariable.ttf', {
            family: 'InterVariable',
            weight: 'bold', // 声明字体是 bold
          });
          ctx.font = `bold ${watermark.fontSize}px InterVariable`;
        }

        // 记录name长度
        if (watermark.id === '1742979401011') {
          nametTextWidth = ctx.measureText(watermark.text).width;
        }

        var x: number;
        var y: number;
        var textWidth: number;
        if (watermark.id === '174297944') {
          // 如果后缀内容存在则重制后缀位置
          x = watermark.position.x;
          x += nametTextWidth + 70;
          y = watermark.position.y;

          textWidth = ctx.measureText(watermark.text).width;
        } else {
          // 默认位置
          x = watermark.position.x;
          y = watermark.position.y;
          textWidth = ctx.measureText(watermark.text).width;
        }

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
      // // 保存文件
      // const fileName = 'watermarked-image.jpeg';
      // fs.writeFileSync(fileName, buffer);
      return buffer;
    } catch (error) {
      throw new Error(`Image processing failed:${error}`);
    }
  }
}
