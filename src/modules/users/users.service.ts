import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
      return user;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async createUser(
    userData: Prisma.UserCreateInput,
  ): Promise<Prisma.UserGetPayload<{ omit: { password: true } }>> {
    try {
      const user = await this.prisma.user.create({
        data: userData,
        omit: { password: true },
      });
      return user;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
