import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { LocalAuthGuard } from './guards/local.guard';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';

interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiSuccessResponse({
    type: RegisterResponseDto,
    status: 201,
    description: 'User registered successfully',
  })
  @Post('register')
  async register(
    @Req() req: Request & { user: SessionUser },
    @Body() registerDto: RegisterDto,
  ) {
    const user = await this.authService.register(registerDto);

    await this.loginWithSession(req, user);

    return {
      message: 'User registered successfully',
      data: user,
    };
  }

  @ApiOperation({ summary: 'Login a user' })
  @ApiSuccessResponse({
    status: 200,
    description: 'User logged in successfully',
    type: LoginResponseDto,
  })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Body() _loginDto: LoginDto,
    @Req() req: Request & { user: SessionUser },
  ) {
    await this.loginWithSession(req, req.user);
    return {
      message: 'User logged in successfully',
      data: req.user,
    };
  }

  @ApiOperation({ summary: 'Logout a user and destroy session' })
  @ApiSuccessResponse({
    status: 200,
    description: 'User logged out successfully',
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @Post('logout')
  async logout(@Req() req: Request & { user: SessionUser }) {
    await this.logoutFromSession(req);

    return {
      message: 'User logged out successfully',
    };
  }

  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'Current user',
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @Get('me')
  me(@Req() req: Request & { user: SessionUser }) {
    return req.user;
  }

  private async loginWithSession(
    req: Request & {
      session: { regenerate: (cb: (err: Error | null) => void) => void };
      logIn: (user: SessionUser, cb: (err: Error | null) => void) => void;
    },
    user: SessionUser,
  ): Promise<SessionUser> {
    return new Promise<SessionUser>((resolve, reject) => {
      req.session.regenerate((regenErr: Error | null) => {
        if (regenErr) {
          reject(
            new InternalServerErrorException('Failed to start secure session'),
          );
          return;
        }

        req.logIn(user, (loginErr: Error | null) => {
          if (loginErr) {
            reject(
              new InternalServerErrorException('Failed to create session'),
            );
            return;
          }

          resolve(user);
        });
      });
    });
  }

  private async logoutFromSession(
    req: Request & {
      logout: (cb: (err: Error | null) => void) => void;
      session: { destroy: (cb: (err: Error | null) => void) => void };
    },
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      req.logout((error: Error | null) => {
        if (error) {
          reject(new InternalServerErrorException('Failed to logout'));
          return;
        }
        resolve();
      });
    });

    await new Promise<void>((resolve, reject) => {
      req.session.destroy((error: Error | null) => {
        if (error) {
          reject(new InternalServerErrorException('Failed to destroy session'));
          return;
        }
        resolve();
      });
    });
  }
}
