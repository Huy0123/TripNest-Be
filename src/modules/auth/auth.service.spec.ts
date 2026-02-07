import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: any;
  let mockJwtService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      createOrUpdateGoogleUser: jest.fn(),
      register: jest.fn(),
      verifyAccount: jest.fn(),
      sendVerificationAccount: jest.fn(),
    };
    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock_token'),
    };
    mockConfigService = {
      get: jest.fn((key) => {
        if (key === 'JWT_EXPIRES_IN') return '15m';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return user info if valid', async () => {
      const mockUser = { id: 1, email: 'test@test.com', password: 'hash' };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@test.com', 'pass');
      expect(result).toHaveProperty('id', 1);
      expect(result).not.toHaveProperty('password');
    });

    it('should return null if invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const result = await service.validateUser('test@test.com', 'pass');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should login and return tokens', async () => {
      const mockUser = { id: 1, email: 'test@test.com', isActive: true };
      const res = {
        cookie: jest.fn(),
      } as unknown as Response;

      const result = await service.login(mockUser, res);

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'mock_token', expect.any(Object));
      expect(result).toHaveProperty('accessToken', 'mock_token');
      expect(result.success).toBe(true);
    });

    it('should send verification if not active', async () => {
      const mockUser = { id: 1, email: 'test@test.com', isActive: false };
      const res = {
        cookie: jest.fn(),
      } as unknown as Response;

      const result = await service.login(mockUser, res);

      expect(mockUsersService.sendVerificationAccount).toHaveBeenCalledWith('test@test.com');
      expect(result.success).toBe(false);
    });
  });

  describe('register', () => {
    it('should call usersService.register', async () => {
      await service.register({} as any);
      expect(mockUsersService.register).toHaveBeenCalled();
    });
  });
});
