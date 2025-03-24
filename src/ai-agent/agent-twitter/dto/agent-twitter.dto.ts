import { IsObject, IsString } from 'class-validator';

export class SendATweetDto<T> {
  @IsString()
  tweetData: string; // 推文内容
  @IsString()
  tweetUrl: string; // 推文中链接
  @IsString()
  tweetType: string; // 播报类型

  @IsObject()
  imageData: T;
}

export class ImageInformation {
  @IsString()
  userName: string; // 用户名
  @IsString()
  imageDataOne: string; // 图片数据1
  @IsString()
  imageDataTwo: string; // 图片数据2
  @IsString()
  imageDataThree: string; // 图片数据3
}
