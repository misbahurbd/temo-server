import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { AuthService } from '../auth.service';

export interface SessionUser {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly displayName: string | null;
  readonly photo: string | null;
  readonly lastLoginAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string | null;
}

export interface SerializedUser {
  readonly id: string;
}

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly authService: AuthService) {
    super();
  }

  serializeUser(
    user: SessionUser,
    done: (err: Error | null, id?: SerializedUser) => void,
  ) {
    try {
      const payload: SerializedUser = {
        id: user.id,
      };
      done(null, payload);
    } catch (error) {
      done(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async deserializeUser(
    payload: SerializedUser,
    done: (err: Error | null, user?: SessionUser) => void,
  ) {
    try {
      const user = await this.authService.deserializeUser(payload);
      done(null, user || undefined);
    } catch (error) {
      done(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
