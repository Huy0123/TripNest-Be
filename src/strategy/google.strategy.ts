import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
    });
  }
  async validate(profile: any, done: VerifyCallback): Promise<any> {
    const { id, name, emails, photos } = profile;
    const user = {
      id: id,
      email: emails[0].value || '',
      firstName: name.givenName || '',
      lastName: name.familyName || '',
      picture: photos[0].value || '',
    };
    done(null, user);
  }
}
