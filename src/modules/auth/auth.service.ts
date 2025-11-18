import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { SerializedUser, SessionUser } from './serializers/session.serializer';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const existingUser = await this.usersService.findByEmail(
        registerDto.email,
      );
      if (existingUser) {
        throw new ConflictException('User already exists');
      }

      const hashedPassword = await this.hashPassword(registerDto.password);
      const user = await this.usersService.createUser({
        ...registerDto,
        displayName:
          `${registerDto.firstName.trim()} ${registerDto.lastName.trim()}`.trim(),
        password: hashedPassword,
      });
      return user;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive || user.isDeleted) {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await this.verifyPassword(user.password, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const result = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        photo: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: result.id,
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
      displayName: result.displayName,
      photo: result.photo,
      lastLoginAt: result.lastLoginAt?.toISOString() || null,
      createdAt: result.createdAt?.toISOString(),
      updatedAt: result.updatedAt?.toISOString() || null,
    };
  }

  async buildSerializedUserPayload(userId: string): Promise<SerializedUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
      select: {
        id: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
    };
  }

  async deserializeUser(payload: SerializedUser): Promise<SessionUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        photo: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      photo: user.photo,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString() || null,
    };
  }

  async hashPassword(password: string) {
    const hashedPassword = await argon2.hash(password);
    return hashedPassword;
  }

  async verifyPassword(hashedPassword: string, password: string) {
    const isValid = await argon2.verify(hashedPassword, password);
    return isValid;
  }
}
