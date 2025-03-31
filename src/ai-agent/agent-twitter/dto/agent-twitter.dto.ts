import { IsNumber, IsObject, IsString } from 'class-validator';

export class SendATweetDto<T> {
  @IsString()
  tweetData: string; // 推文内容
  @IsString()
  tweetUrl: string; // 推文中链接
  @IsString()
  tweetType: string; // 播报类型

  @IsObject()
  data: T;
}

export class MultiplierEarning {
  @IsString()
  userName: string; // 用户名
  @IsNumber()
  multiplier: number; // 倍数
  @IsNumber()
  tokenAmount: number; // 代币数量
  @IsString()
  tokenSymbol: string; // 代币名称
  @IsNumber()
  usdAmount: number; // 美元数量
}

export class UsdEarning {
  @IsString()
  userName: string; // 用户名
  @IsNumber()
  tokenAmount: number; // 代币数量
  @IsString()
  tokenSymbol: string; // 代币名称
  @IsNumber()
  usdAmount: number; // 美元数量
}

export class EventEarning {
  @IsString()
  userName: string; // 用户名
  @IsNumber()
  rank: number; // 排名
  @IsNumber()
  tokenAmount: number; // 代币数量
  @IsString()
  tokenSymbol: string; // 代币名称
  @IsNumber()
  usdAmount: number; // 美元数量
}
