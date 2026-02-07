import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      verifyAccount: jest.fn(),
      handleRefreshToken: jest.fn(),
      googleLogin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const dto = { email: 't@t.com' } as RegisterDto;
      mockAuthService.register.mockResolvedValue({ id: 1 });
      const result = await controller.create(dto);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const req = { user: { id: 1 } };
      const res = {};
      await controller.login(req as any, res as any);
      expect(mockAuthService.login).toHaveBeenCalledWith({ id: 1 }, res);
    });
  });

  describe('verifyAccount', () => {
    it('should call authService.verifyAccount', async () => {
      const body = { email: 't@t.com', otp: '123456' };
      await controller.verifyAccount(body);
      expect(mockAuthService.verifyAccount).toHaveBeenCalledWith('t@t.com', '123456');
    });
  });

  describe('googleAuthRedirect', () => {
    it('should call authService.googleLogin', async () => {
      const req = { user: { id: 1 } };
      const res = {};
      await controller.googleAuthRedirect(req, res as any);
      expect(mockAuthService.googleLogin).toHaveBeenCalledWith({ id: 1 }, res);
    });
  });

  describe('refreshToken', () => {
    it('should call authService.handleRefreshToken', async () => {
      const req = { user: { id: 1 } };
      const res = {};
      await controller.refreshToken(req as any, res as any);
      expect(mockAuthService.handleRefreshToken).toHaveBeenCalledWith({ id: 1 }, res);
    });
  });
});
