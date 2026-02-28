import { jest, describe, it, expect, afterEach, beforeAll } from '@jest/globals';
import request from 'supertest';

const mockRestaurant = {
  findAllWithRelations: jest.fn(),
  findWithRelations: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

const mockDB = {
  collection: jest.fn()
};

const mockConnectDB = jest.fn().mockResolvedValue(mockDB);
const mockGetDB = jest.fn(() => mockDB);

jest.unstable_mockModule('../models/Restaurant.js', () => ({
  default: mockRestaurant
}));

jest.unstable_mockModule('../db.js', () => ({
  connectDB: mockConnectDB,
  getDB: mockGetDB,
  default: { connectDB: mockConnectDB, getDB: mockGetDB }
}));

const { default: app } = await import('../index.js');
const { default: Restaurant } = await import('../models/Restaurant.js');

describe('Restaurant CRUD Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/restaurants', () => {
    it('should return all restaurants', async () => {
      const mockRestaurants = [
        { _id: '1', name: 'Res 1', address: 'Add 1', telephone_number: '123', open_time: new Date(), close_time: new Date(), tables: [], reservations: [] }
      ];
      mockRestaurant.findAllWithRelations.mockResolvedValue(mockRestaurants);

      const res = await request(app).get('/api/restaurants');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(expect.any(Array));
      expect(res.body[0].name).toBe('Res 1');
    });

    it('should return 500 on error', async () => {
      mockRestaurant.findAllWithRelations.mockRejectedValue(new Error('DB Error'));
      const res = await request(app).get('/api/restaurants');
      expect(res.statusCode).toEqual(500);
    });
  });

  describe('GET /api/restaurants/:id', () => {
    it('should return a single restaurant', async () => {
      const mockRestaurantData = { _id: '1', name: 'Res 1', address: 'Add 1', telephone_number: '123', open_time: new Date(), close_time: new Date(), tables: [], reservations: [] };
      mockRestaurant.findWithRelations.mockResolvedValue(mockRestaurantData);

      const res = await request(app).get('/api/restaurants/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe('Res 1');
    });

    it('should return 404 if not found', async () => {
      mockRestaurant.findWithRelations.mockResolvedValue(null);
      const res = await request(app).get('/api/restaurants/999');
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('POST /api/restaurants', () => {
    it('should create a new restaurant', async () => {
      const newRes = { name: 'New Res', address: 'New Add', telephone_number: '000', open_time: '2023-01-01T08:00:00Z', close_time: '2023-01-01T22:00:00Z' };
      mockRestaurant.create.mockResolvedValue({ _id: '2', ...newRes });

      const res = await request(app).post('/api/restaurants').send(newRes);
      expect(res.statusCode).toEqual(201);
      expect(res.body._id).toBe('2');
    });
  });

  describe('PUT /api/restaurants/:id', () => {
    it('should update a restaurant', async () => {
      mockRestaurant.update.mockResolvedValue({ _id: '1', name: 'Updated' });
      const res = await request(app).put('/api/restaurants/1').send({ name: 'Updated' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe('Updated');
    });
  });

  describe('DELETE /api/restaurants/:id', () => {
    it('should delete a restaurant', async () => {
      mockRestaurant.delete.mockResolvedValue(true);
      const res = await request(app).delete('/api/restaurants/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Restaurant deleted successfully');
    });
  });
});
