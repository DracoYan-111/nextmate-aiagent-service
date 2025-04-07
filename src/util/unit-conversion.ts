import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UnitConversion {
  static unitCalculation(percentStr: string): string {
    const percentage = parseFloat(percentStr);
    const absValue = Math.abs(percentage);

    let value: number;
    let unit = '';

    if (absValue >= 1e9) {
      value = percentage / 1e9;
      unit = 'b';
    } else if (absValue >= 1e6) {
      value = percentage / 1e6;
      unit = 'm';
    } else if (absValue >= 1e3) {
      value = percentage / 1e3;
      unit = 'k';
    } else {
      value = percentage;
    }

    // 保留最多两位小数，去掉多余 0
    const formatted = parseFloat(value.toFixed(2)).toString();

    if (formatted === '0') {
      const str = percentage.toFixed(8).toString();
      console.log(str)
      const result = str
        .replace(/(\.\d*?[1-9])0+$/g, '$1')
        .replace(/\.0+$/, '');

      return result;
    }
    return `${formatted}${unit}`;
  }
}
