import { createCanvas, loadImage, registerFont } from 'canvas';
import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class UnitConversion {
  static unitCalculation(percentStr: string): string {
    const percentage = parseFloat(percentStr);
    const absValue = Math.abs(percentage);

    let value: number;
    let unit = '';

    if (absValue >= 1e9) {
      value = percentage / 1e9;
      unit = 'B';
    } else if (absValue >= 1e6) {
      value = percentage / 1e6;
      unit = 'M';
    } else if (absValue >= 1e3) {
      value = percentage / 1e3;
      unit = 'K';
    } else {
      value = percentage;
    }

    // 保留最多两位小数，去掉多余 0
    const formatted = parseFloat(value.toFixed(2)).toString();

    if (formatted === '0') {
      return percentage.toFixed(8).toString();
    }
    return `${formatted}${unit}`;
  }
}
