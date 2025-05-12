import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return 'Solana API is running!';
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('analyze')
  async analyzeWithAI(@UploadedFile() file: Express.Multer.File) {
    return this.appService.analyzeWithAI(file);
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('register')
  async register(@UploadedFile() file: Express.Multer.File) {
    return await this.appService.registerHash(file);
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('verify')
  async verifyHash(
    @Body('account') account: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.appService.verifyHash(account, file);
  }
}
