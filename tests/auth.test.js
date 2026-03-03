import { jest, describe, it, expect, afterEach } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";

// ── Mock config/db.js ──────────────────────────────────────────────────────
const mockConnectDB = jest.fn().mockResolvedValue(undefined);

jest.unstable_mockModule("../config/db.js", () => ({
  default: mockConnectDB,
  connectDB: mockConnectDB,
}));

// ── Mock User model ────────────────────────────────────────────────────────
const mockUserInstance = {
  _id: "64a1b2c3d4e5f6a7b8c9d0e1",
  id: "64a1b2c3d4e5f6a7b8c9d0e1",
  name: "Test User",
  email: "test@example.com",
  telephone_number: "0812345678",
  role: "user",
  getSignedJwtToken: jest.fn(() => "mock.jwt.token"),
  matchPassword: jest.fn(),
};

const mockUserModel = {
  create: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
};

jest.unstable_mockModule("../models/User.js", () => ({
  default: mockUserModel,
}));

// ── Mock Restaurant & Reservation (required by index.js routes) ────────────
jest.unstable_mockModule("../models/Restaurant.js", () => ({
  default: {
    find: jest.fn(() => ({
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    })),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn().mockResolvedValue(0),
  },
}));

jest.unstable_mockModule("../models/Reservation.js", () => ({
  default: {
    find: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteMany: jest.fn().mockResolvedValue({}),
  },
}));

// ── Import app AFTER mocks ─────────────────────────────────────────────────
const { default: app } = await import("../index.js");

// ── Helper: generate a real-looking JWT for protect middleware ─────────────
const makeToken = (id = mockUserInstance.id, secret = process.env.JWT_SECRET || "testsecret") =>
  jwt.sign({ id }, secret, { expiresIn: "1d" });

describe("Auth Routes", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── POST /api/auth/register ──────────────────────────────────────────────

  describe("POST /api/auth/register", () => {
    const validBody = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      telephone_number: "0812345678",
    };

    it("should return 201 and token on successful registration", async () => {
      mockUserModel.create.mockResolvedValue(mockUserInstance);

      const res = await request(app)
        .post("/api/auth/register")
        .send(validBody);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBe("mock.jwt.token");
    });

    it("should register as admin when correct adminSecret is provided", async () => {
      const adminInstance = {
        ...mockUserInstance,
        role: "admin",
        getSignedJwtToken: jest.fn(() => "admin.jwt.token"),
      };
      mockUserModel.create.mockResolvedValue(adminInstance);

      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...validBody, adminSecret: process.env.ADMIN_SECRET });

      expect(res.statusCode).toBe(201);
      expect(res.body.token).toBe("admin.jwt.token");
    });

    it("should return 400 when email already exists", async () => {
      mockUserModel.create.mockRejectedValue(new Error("duplicate key"));

      const res = await request(app)
        .post("/api/auth/register")
        .send(validBody);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 when required fields are missing", async () => {
      mockUserModel.create.mockRejectedValue(
        new Error("Please add a name")
      );

      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "test@example.com", password: "password123" });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/auth/login ─────────────────────────────────────────────────

  describe("POST /api/auth/login", () => {
    it("should return 200 and token on successful login", async () => {
      const userWithSelect = {
        ...mockUserInstance,
        matchPassword: jest.fn().mockResolvedValue(true),
        getSignedJwtToken: jest.fn(() => "mock.jwt.token"),
      };
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithSelect),
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "password123" });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBe("mock.jwt.token");
    });

    it("should return 400 when email or password missing", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com" });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/email and password/i);
    });

    it("should return 400 when user not found", async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "noexist@example.com", password: "password123" });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it("should return 400 when password does not match", async () => {
      const userWithSelect = {
        ...mockUserInstance,
        matchPassword: jest.fn().mockResolvedValue(false),
      };
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithSelect),
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "wrongpassword" });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it("should return 500 on unexpected DB error", async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error("DB crashed")),
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "password123" });

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/auth/logout ─────────────────────────────────────────────────

  describe("GET /api/auth/logout", () => {
    it("should return 200 and clear cookie", async () => {
      const token = makeToken();
      mockUserModel.findById.mockResolvedValue(mockUserInstance);

      const res = await request(app)
        .get("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // Cookie should be set to 'none' to clear it
      expect(res.headers["set-cookie"]).toBeDefined();
      expect(res.headers["set-cookie"][0]).toMatch(/token=none/);
    });

    it("should return 401 when no token provided", async () => {
      const res = await request(app).get("/api/auth/logout");

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/auth/me ─────────────────────────────────────────────────────

  describe("GET /api/auth/me", () => {
    it("should return 200 with current user data", async () => {
      const token = makeToken();
      mockUserModel.findById
        // First call: protect middleware
        .mockResolvedValueOnce(mockUserInstance)
        // Second call: getMe controller
        .mockResolvedValueOnce(mockUserInstance);

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Test User");
      expect(res.body.data.email).toBe("test@example.com");
    });

    it("should return 401 when no token provided", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 when token is invalid", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid.token.here");

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 500 when DB error on getMe", async () => {
      const token = makeToken();
      mockUserModel.findById
        // First call: protect middleware succeeds
        .mockResolvedValueOnce(mockUserInstance)
        // Second call: getMe controller fails
        .mockRejectedValueOnce(new Error("DB Error"));

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
