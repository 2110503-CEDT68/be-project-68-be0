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
  role: "user",
};

const mockAdminInstance = {
  _id: "64a1b2c3d4e5f6a7b8c9d0e9",
  id: "64a1b2c3d4e5f6a7b8c9d0e9",
  name: "Admin User",
  email: "admin@example.com",
  role: "admin",
};

const mockUserModel = {
  findById: jest.fn(),
};

jest.unstable_mockModule("../models/User.js", () => ({
  default: mockUserModel,
}));

// ── Mock Restaurant model ──────────────────────────────────────────────────
const mockRestaurantInstance = {
  _id: "64a1b2c3d4e5f6a7b8c9d0e2",
  name: "Test Restaurant",
  address: "123 Test St",
  open_time: "08:00",
  close_time: "20:00",
};

const mockRestaurantModel = {
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
};

jest.unstable_mockModule("../models/Restaurant.js", () => ({
  default: mockRestaurantModel,
}));

// ── Mock Reservation model ─────────────────────────────────────────────────
const mockReservationInstance = {
  _id: "64a1b2c3d4e5f6a7b8c9d0e3",
  user: {
    _id: "64a1b2c3d4e5f6a7b8c9d0e1",
    name: "Test User",
    email: "test@example.com",
  },
  restaurant_id: {
    _id: "64a1b2c3d4e5f6a7b8c9d0e2",
    name: "Test Restaurant",
    address: "123 Test St",
  },
  restaurant_name: "Test Restaurant",
  reservation_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  quantity: 2,
  deleteOne: jest.fn().mockResolvedValue({}),
};

const mockReservationModel = {
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  deleteMany: jest.fn().mockResolvedValue({}),
};

jest.unstable_mockModule("../models/Reservation.js", () => ({
  default: mockReservationModel,
}));

// ── Import app AFTER mocks ─────────────────────────────────────────────────
const { default: app } = await import("../index.js");

// ── Helpers ────────────────────────────────────────────────────────────────
const makeToken = (id, secret = process.env.JWT_SECRET || "testsecret") =>
  jwt.sign({ id }, secret, { expiresIn: "1d" });

const USER_TOKEN = makeToken(mockUserInstance.id);
const ADMIN_TOKEN = makeToken(mockAdminInstance.id);

// Future date at 12:00 UTC (within 08:00–20:00 UTC open window)
const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  d.setUTCHours(12, 0, 0, 0);
  return d.toISOString();
};

// Future date outside open hours (02:00 UTC — before 08:00)
const futureDateOutsideHours = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  d.setUTCHours(2, 0, 0, 0);
  return d.toISOString();
};

const RESTAURANT_ID = mockRestaurantInstance._id;
const RESERVATION_ID = mockReservationInstance._id;

// ── Helper: build a proper populate chain mock ─────────────────────────────
// Reservation.findById(...).populate(...).populate(...) resolves to `value`
const makePopulateChain = (resolvedValue) => {
  const chain = {
    populate: jest.fn(),
  };
  // first .populate() returns the chain again
  // second .populate() returns a promise resolving to value
  chain.populate
    .mockReturnValueOnce(chain)
    .mockResolvedValueOnce(resolvedValue);
  return chain;
};

// Reservation.find({}).populate(...).populate(...) resolves to `value`
const makeFindPopulateChain = (resolvedValue) => {
  const chain = {
    populate: jest.fn(),
  };
  chain.populate
    .mockReturnValueOnce(chain)
    .mockResolvedValueOnce(resolvedValue);
  return chain;
};

describe("Reservation Routes", () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockReservationInstance.deleteOne.mockResolvedValue({});
  });

  // ── GET /api/reservations ──────────────────────────────────────────────

  describe("GET /api/reservations", () => {
    it("should return 200 with user's own reservations only", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockReservationModel.find.mockReturnValue(
        makeFindPopulateChain([mockReservationInstance]),
      );

      const res = await request(app)
        .get("/api/reservations")
        .set("Authorization", `Bearer ${USER_TOKEN}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeDefined();
    });

    it("should return 200 with all reservations for admin", async () => {
      mockUserModel.findById.mockResolvedValue(mockAdminInstance);
      mockReservationModel.find.mockReturnValue(
        makeFindPopulateChain([mockReservationInstance]),
      );

      const res = await request(app)
        .get("/api/reservations")
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 401 when no token provided", async () => {
      const res = await request(app).get("/api/reservations");

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 500 on DB error", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      const chain = { populate: jest.fn() };
      chain.populate
        .mockReturnValueOnce(chain)
        .mockRejectedValueOnce(new Error("DB Error"));
      mockReservationModel.find.mockReturnValue(chain);

      const res = await request(app)
        .get("/api/reservations")
        .set("Authorization", `Bearer ${USER_TOKEN}`);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/reservations/:id ──────────────────────────────────────────

  describe("GET /api/reservations/:id", () => {
    it("should return 200 with reservation data for owner", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockReservationModel.findById.mockReturnValue(
        makePopulateChain(mockReservationInstance),
      );

      const res = await request(app)
        .get(`/api/reservations/${RESERVATION_ID}`)
        .set("Authorization", `Bearer ${USER_TOKEN}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(RESERVATION_ID);
    });

    it("should return 200 for admin viewing any reservation", async () => {
      mockUserModel.findById.mockResolvedValue(mockAdminInstance);
      mockReservationModel.findById.mockReturnValue(
        makePopulateChain(mockReservationInstance),
      );

      const res = await request(app)
        .get(`/api/reservations/${RESERVATION_ID}`)
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 404 when reservation not found", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockReservationModel.findById.mockReturnValue(makePopulateChain(null));

      const res = await request(app)
        .get(`/api/reservations/000000000000000000000000`)
        .set("Authorization", `Bearer ${USER_TOKEN}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 when user tries to view another user's reservation", async () => {
      const otherUserReservation = {
        ...mockReservationInstance,
        user: {
          _id: "aaaabbbbccccdddd00001111",
          name: "Other",
          email: "other@example.com",
        },
      };
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockReservationModel.findById.mockReturnValue(
        makePopulateChain(otherUserReservation),
      );

      const res = await request(app)
        .get(`/api/reservations/${RESERVATION_ID}`)
        .set("Authorization", `Bearer ${USER_TOKEN}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 when no token provided", async () => {
      const res = await request(app).get(`/api/reservations/${RESERVATION_ID}`);

      expect(res.statusCode).toBe(401);
    });

    it("should return 500 on DB error", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      const chain = { populate: jest.fn() };
      chain.populate
        .mockReturnValueOnce(chain)
        .mockRejectedValueOnce(new Error("DB Error"));
      mockReservationModel.findById.mockReturnValue(chain);

      const res = await request(app)
        .get(`/api/reservations/${RESERVATION_ID}`)
        .set("Authorization", `Bearer ${USER_TOKEN}`);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/restaurants/:restaurantId/reservations ──────────────────

  describe("POST /api/restaurants/:restaurantId/reservations", () => {
    it("should return 201 on successful reservation", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockRestaurantModel.findById.mockResolvedValue(mockRestaurantInstance);
      mockReservationModel.find.mockResolvedValue([]); // 0 existing reservations
      mockReservationModel.findOne.mockResolvedValue(null); // no duplicate
      mockReservationModel.create.mockResolvedValue(mockReservationInstance);

      const res = await request(app)
        .post(`/api/restaurants/${RESTAURANT_ID}/reservations`)
        .set("Authorization", `Bearer ${USER_TOKEN}`)
        .send({ reservation_date: futureDate(), quantity: 2 });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(RESERVATION_ID);
    });

    it("should return 400 when reservation_date is missing", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);

      const res = await request(app)
        .post(`/api/restaurants/${RESTAURANT_ID}/reservations`)
        .set("Authorization", `Bearer ${USER_TOKEN}`)
        .send({ quantity: 2 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/reservation_date/i);
    });

    it("should return 400 when reservation_date is in the past", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);

      const res = await request(app)
        .post(`/api/restaurants/${RESTAURANT_ID}/reservations`)
        .set("Authorization", `Bearer ${USER_TOKEN}`)
        .send({ reservation_date: "2020-01-01T12:00:00Z", quantity: 2 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/future/i);
    });

    it("should return 400 when reservation_date format is invalid", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);

      const res = await request(app)
        .post(`/api/restaurants/${RESTAURANT_ID}/reservations`)
        .set("Authorization", `Bearer ${USER_TOKEN}`)
        .send({ reservation_date: "not-a-date", quantity: 2 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it("should return 404 when restaurant not found", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockRestaurantModel.findById.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/restaurants/000000000000000000000000/reservations`)
        .set("Authorization", `Bearer ${USER_TOKEN}`)
        .send({ reservation_date: futureDate(), quantity: 2 });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 when reservation time is outside open hours", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockRestaurantModel.findById.mockResolvedValue(mockRestaurantInstance);

      const res = await request(app)
        .post(`/api/restaurants/${RESTAURANT_ID}/reservations`)
        .set("Authorization", `Bearer ${USER_TOKEN}`)
        .send({ reservation_date: futureDateOutsideHours(), quantity: 2 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/open from/i);
    });

    it("should return 400 when user already has 3 reservations", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockRestaurantModel.findById.mockResolvedValue(mockRestaurantInstance);
      mockReservationModel.find.mockResolvedValue([{}, {}, {}]); // 3 existing

      const res = await request(app)
        .post(`/api/restaurants/${RESTAURANT_ID}/reservations`)
        .set("Authorization", `Bearer ${USER_TOKEN}`)
        .send({ reservation_date: futureDate(), quantity: 2 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already made 3/i);
    });

    it("should allow admin to exceed 3 reservation limit", async () => {
      mockUserModel.findById.mockResolvedValue(mockAdminInstance);
      mockRestaurantModel.findById.mockResolvedValue(mockRestaurantInstance);
      mockReservationModel.find.mockResolvedValue([{}, {}, {}]); // already 3
      mockReservationModel.findOne.mockResolvedValue(null);
      mockReservationModel.create.mockResolvedValue(mockReservationInstance);

      const res = await request(app)
        .post(`/api/restaurants/${RESTAURANT_ID}/reservations`)
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
        .send({ reservation_date: futureDate(), quantity: 4 });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should return 400 on duplicate reservation on same day at same restaurant", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockRestaurantModel.findById.mockResolvedValue(mockRestaurantInstance);
      mockReservationModel.find.mockResolvedValue([]); // under limit
      mockReservationModel.findOne.mockResolvedValue(mockReservationInstance); // duplicate

      const res = await request(app)
        .post(`/api/restaurants/${RESTAURANT_ID}/reservations`)
        .set("Authorization", `Bearer ${USER_TOKEN}`)
        .send({ reservation_date: futureDate(), quantity: 2 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already have a reservation/i);
    });

    it("should return 401 when no token provided", async () => {
      const res = await request(app)
        .post(`/api/restaurants/${RESTAURANT_ID}/reservations`)
        .send({ reservation_date: futureDate(), quantity: 2 });

      expect(res.statusCode).toBe(401);
    });

    it("should return 500 on DB error during create", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockRestaurantModel.findById.mockResolvedValue(mockRestaurantInstance);
      mockReservationModel.find.mockResolvedValue([]);
      mockReservationModel.findOne.mockResolvedValue(null);
      mockReservationModel.create.mockRejectedValue(new Error("DB Error"));

      const res = await request(app)
        .post(`/api/restaurants/${RESTAURANT_ID}/reservations`)
        .set("Authorization", `Bearer ${USER_TOKEN}`)
        .send({ reservation_date: futureDate(), quantity: 2 });

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── PUT /api/reservations/:id ──────────────────────────────────────────

  describe("PUT /api/reservations/:id", () => {
    const updatedDate = () => {
      const d = new Date();
      d.setDate(d.getDate() + 5);
      d.setUTCHours(14, 0, 0, 0);
      return d.toISOString();
    };

    it("should return 200 on successful update", async () => {
      const ownReservation = {
        ...mockReservationInstance,
        user: mockUserInstance.id,
      };
      const updatedReservation = {
        ...ownReservation,
        quantity: 3,
        reservation_date: new Date(updatedDate()),
      };
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockReservationModel.findById.mockResolvedValue(ownReservation);
      mockRestaurantModel.findById.mockResolvedValue(mockRestaurantInstance);
      mockReservationModel.findByIdAndUpdate.mockResolvedValue(
        updatedReservation,
      );

      const res = await request(app)
        .put(`/api/reservations/${RESERVATION_ID}`)
        .set("Authorization", `Bearer ${USER_TOKEN}`)
        .send({ reservation_date: updatedDate(), quantity: 3 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 404 when reservation not found", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockReservationModel.findById.mockResolvedValue(null);

      const res = await request(app)
        .put(`/api/reservations/000000000000000000000000`)
        .set("Authorization", `Bearer ${USER_TOKEN}`)
        .send({ quantity: 3 });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 when user tries to update another user's reservation", async () => {
      const otherUserReservation = {
        ...mockReservationInstance,
        user: "aaaabbbbccccdddd00001111",
      };
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockReservationModel.findById.mockResolvedValue(otherUserReservation);

      const res = await request(app)
        .put(`/api/reservations/${RESERVATION_ID}`)
        .set("Authorization", `Bearer ${USER_TOKEN}`)
        .send({ quantity: 3 });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 when updating to a past date", async () => {
      const ownReservation = {
        ...mockReservationInstance,
        user: mockUserInstance.id,
      };
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockReservationModel.findById.mockResolvedValue(ownReservation);

      const res = await request(app)
        .put(`/api/reservations/${RESERVATION_ID}`)
        .set("Authorization", `Bearer ${USER_TOKEN}`)
        .send({ reservation_date: "2020-01-01T12:00:00Z" });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/future/i);
    });

    it("should return 400 when updating to outside open hours", async () => {
      const ownReservation = {
        ...mockReservationInstance,
        user: mockUserInstance.id,
        restaurant_id: mockRestaurantInstance._id,
      };
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockReservationModel.findById.mockResolvedValue(ownReservation);
      mockRestaurantModel.findById.mockResolvedValue(mockRestaurantInstance);

      const res = await request(app)
        .put(`/api/reservations/${RESERVATION_ID}`)
        .set("Authorization", `Bearer ${USER_TOKEN}`)
        .send({ reservation_date: futureDateOutsideHours() });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/open from/i);
    });

    it("should return 400 when updating to duplicate same day at same restaurant", async () => {
      const ownReservation = {
        ...mockReservationInstance,
        user: mockUserInstance.id,
        restaurant_id: mockRestaurantInstance._id,
      };
      const duplicateReservation = {
        ...mockReservationInstance,
        _id: "64a1b2c3d4e5f6a7b8c9d0ff",
      };
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockReservationModel.findById.mockResolvedValue(ownReservation);
      mockRestaurantModel.findById.mockResolvedValue(mockRestaurantInstance);
      mockReservationModel.findOne.mockResolvedValue(duplicateReservation); // duplicate found

      const res = await request(app)
        .put(`/api/reservations/${RESERVATION_ID}`)
        .set("Authorization", `Bearer ${USER_TOKEN}`)
        .send({ reservation_date: updatedDate() });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already have a reservation/i);
    });

    it("should return 401 when no token provided", async () => {
      const res = await request(app)
        .put(`/api/reservations/${RESERVATION_ID}`)
        .send({ quantity: 3 });

      expect(res.statusCode).toBe(401);
    });

    it("should return 500 on DB error", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockReservationModel.findById.mockRejectedValue(new Error("DB Error"));

      const res = await request(app)
        .put(`/api/reservations/${RESERVATION_ID}`)
        .set("Authorization", `Bearer ${USER_TOKEN}`)
        .send({ quantity: 3 });

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── DELETE /api/reservations/:id ──────────────────────────────────────

  // ── protect middleware - deleted user ─────────────────────────────────

  describe("protect middleware - deleted user", () => {
    it("should return 401 when token is valid but user no longer exists in DB", async () => {
      // User was deleted from DB after token was issued
      mockUserModel.findById.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/reservations")
        .set("Authorization", `Bearer ${USER_TOKEN}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not authorized/i);
    });
  });

  describe("DELETE /api/reservations/:id", () => {
    it("should return 200 on successful delete", async () => {
      const ownReservation = {
        ...mockReservationInstance,
        user: mockUserInstance.id,
        reservation_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        deleteOne: jest.fn().mockResolvedValue({}),
      };
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockReservationModel.findById.mockResolvedValue(ownReservation);

      const res = await request(app)
        .delete(`/api/reservations/${RESERVATION_ID}`)
        .set("Authorization", `Bearer ${USER_TOKEN}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({});
    });

    it("should return 404 when reservation not found", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockReservationModel.findById.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/reservations/000000000000000000000000`)
        .set("Authorization", `Bearer ${USER_TOKEN}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 when user tries to delete another user's reservation", async () => {
      const otherUserReservation = {
        ...mockReservationInstance,
        user: "aaaabbbbccccdddd00001111",
        reservation_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      };
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockReservationModel.findById.mockResolvedValue(otherUserReservation);

      const res = await request(app)
        .delete(`/api/reservations/${RESERVATION_ID}`)
        .set("Authorization", `Bearer ${USER_TOKEN}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 when cancelling within 1 hour of reservation time", async () => {
      const soonReservation = {
        ...mockReservationInstance,
        user: mockUserInstance.id,
        reservation_date: new Date(Date.now() + 30 * 60 * 1000), // 30 min from now
        deleteOne: jest.fn().mockResolvedValue({}),
      };
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockReservationModel.findById.mockResolvedValue(soonReservation);

      const res = await request(app)
        .delete(`/api/reservations/${RESERVATION_ID}`)
        .set("Authorization", `Bearer ${USER_TOKEN}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/within 1 hour/i);
    });

    it("should allow admin to delete reservation within 1 hour", async () => {
      const soonReservation = {
        ...mockReservationInstance,
        user: mockAdminInstance.id,
        reservation_date: new Date(Date.now() + 30 * 60 * 1000), // 30 min
        deleteOne: jest.fn().mockResolvedValue({}),
      };
      mockUserModel.findById.mockResolvedValue(mockAdminInstance);
      mockReservationModel.findById.mockResolvedValue(soonReservation);

      const res = await request(app)
        .delete(`/api/reservations/${RESERVATION_ID}`)
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 401 when no token provided", async () => {
      const res = await request(app).delete(
        `/api/reservations/${RESERVATION_ID}`,
      );

      expect(res.statusCode).toBe(401);
    });

    it("should return 500 on DB error", async () => {
      mockUserModel.findById.mockResolvedValue(mockUserInstance);
      mockReservationModel.findById.mockRejectedValue(new Error("DB Error"));

      const res = await request(app)
        .delete(`/api/reservations/${RESERVATION_ID}`)
        .set("Authorization", `Bearer ${USER_TOKEN}`);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
