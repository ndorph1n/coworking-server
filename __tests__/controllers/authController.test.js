import { registerUser, loginUser } from "../../controllers/authController.js";
import User from "../../models/User.js";
import jwt from "jsonwebtoken";

jest.mock("../../models/User.js");
jest.mock("jsonwebtoken");

describe("authController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    it("должен успешно зарегистрировать пользователя", async () => {
      const req = {
        body: {
          email: "test@example.com",
          password: "123456",
          firstName: "John",
          lastName: "Doe",
          phone: "+70000000000",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: "123",
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        role: "user",
      });
      jwt.sign.mockReturnValue("token");

      await registerUser(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: "123",
          email: req.body.email,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          phone: req.body.phone,
          role: "user",
          token: "token",
        })
      );
    });

    it("должен вернуть ошибку, если email уже зарегистрирован", async () => {
      const req = {
        body: {
          email: "exists@example.com",
          password: "123",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      User.findOne.mockResolvedValue({ email: req.body.email });

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Пользователь с таким email уже существует",
      });
    });
  });

  describe("loginUser", () => {
    it("должен успешно авторизовать пользователя", async () => {
      const req = {
        body: {
          email: "test@example.com",
          password: "123456",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockUser = {
        _id: "123",
        email: req.body.email,
        firstName: "John",
        lastName: "Doe",
        phone: "+70000000000",
        role: "user",
        matchPassword: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue("token");

      await loginUser(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(mockUser.matchPassword).toHaveBeenCalledWith(req.body.password);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: "token",
          email: mockUser.email,
          role: mockUser.role,
        })
      );
    });

    it("должен вернуть ошибку, если email не найден", async () => {
      const req = {
        body: {
          email: "notfound@example.com",
          password: "123",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      User.findOne.mockResolvedValue(null);

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Неверный email или пароль",
      });
    });

    it("должен вернуть ошибку, если пароль неверный", async () => {
      const req = {
        body: {
          email: "test@example.com",
          password: "wrong",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockUser = {
        email: req.body.email,
        matchPassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne.mockResolvedValue(mockUser);

      await loginUser(req, res);

      expect(mockUser.matchPassword).toHaveBeenCalledWith(req.body.password);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Неверный email или пароль",
      });
    });
  });
});
