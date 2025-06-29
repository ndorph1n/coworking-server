import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import { protect, protectOptional } from "../../middleware/authMiddleware.js";

jest.mock("jsonwebtoken");
jest.mock("../../models/User.js");

describe("authMiddleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    process.env.JWT_SECRET = "test-secret";
    jest.clearAllMocks();
  });

  describe("protect", () => {
    it("должен пропускать авторизованного пользователя", async () => {
      req.headers.authorization = "Bearer validtoken";
      const mockUser = { _id: "123", name: "Test", email: "test@test.com" };

      jwt.verify.mockReturnValue({ id: "123" });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await protect(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith("validtoken", "test-secret");
      expect(User.findById).toHaveBeenCalledWith("123");
      expect(req.user).toEqual(
        expect.objectContaining({
          _id: "123",
          name: "Test",
          email: "test@test.com",
        })
      );
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("должен вернуть 401, если пользователь не найден", async () => {
      req.headers.authorization = "Bearer validtoken";
      jwt.verify.mockReturnValue({ id: "123" });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Пользователь не найден",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("должен исключать пароль из объекта пользователя", async () => {
      req.headers.authorization = "Bearer validtoken";
      const mockUser = {
        _id: "123",
        password: "hashed-pass",
        name: "Test",
      };

      jwt.verify.mockReturnValue({ id: "123" });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ ...mockUser, password: undefined }),
      });

      await protect(req, res, next);

      expect(req.user).toEqual({
        _id: "123",
        name: "Test",
      });
      expect(req.user.password).toBeUndefined();
    });

    it("должен вернуть 401, если токен отсутствует", async () => {
      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Токен отсутствует, доступ запрещён",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("должен вернуть 401 при недопустимом токене", async () => {
      req.headers.authorization = "Bearer invalidtoken";
      jwt.verify.mockImplementation(() => {
        throw new Error("Недопустимый токен");
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Недопустимый токен",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("protectOptional", () => {
    it("должен устанавливать req.user для валидного токена", async () => {
      req.headers.authorization = "Bearer validtoken";
      const mockUser = { _id: "123", name: "Test" };

      jwt.verify.mockReturnValue({ id: "123" });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await protectOptional(req, res, next);

      expect(req.user).toEqual(
        expect.objectContaining({
          _id: "123",
          name: "Test",
        })
      );
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("должен исключать пароль из объекта пользователя", async () => {
      req.headers.authorization = "Bearer validtoken";
      const mockUser = {
        _id: "123",
        password: "hashed-pass",
        name: "Test",
      };

      jwt.verify.mockReturnValue({ id: "123" });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ ...mockUser, password: undefined }),
      });

      await protectOptional(req, res, next);

      expect(req.user).toEqual({
        _id: "123",
        name: "Test",
      });
      expect(req.user.password).toBeUndefined();
    });

    it("должен установить req.user = null при невалидном токене", async () => {
      req.headers.authorization = "Bearer invalidtoken";
      jwt.verify.mockImplementation(() => {
        throw new Error("Ошибка");
      });

      await protectOptional(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    it("должен ничего не делать, если токена нет", async () => {
      await protectOptional(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });
});
