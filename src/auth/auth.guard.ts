import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class SendATwitterAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }
    if (
      authHeader !==
      '9hIcbi6F2BXCexELdbC849hRyE0A1zhHqagbLet3TttxdLiYebhXeIXjCjt7RenMtVUfIZuWha4uwOUI2MGCEGbmPSGuUtbml7EKvWcULFJDYoUCvUfmm1ow4bc7WVAApq222RsJVMgu2Mr12yW5V3JwjCVjRYB3js2JJiye646iw1d8UCxIjulntaRwbCngR8w8FyVB9LnElPOBN8glyEtgkJ0wj9YeZksDpkWPcEatbKqnOhvoCncWGm0mbPb07jvv'
    ) {
      throw new UnauthorizedException('Authorization header error');
    }
    return true;
  }
}
