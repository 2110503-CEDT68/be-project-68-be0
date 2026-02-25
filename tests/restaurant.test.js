import { jest, describe, it, expect, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import prisma from '../db.js';


describe('Restaurant CRUD Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/restaurants', () => {
    it('should return all restaurants', async () => {
      const mockRestaurants = [
        { id: '1', name: 'Res 1', address: 'Add 1', telephone_number: '123', open_time: new Date(), close_time: new Date() }
      ];
      prisma.restaurant.findMany.mockResolvedValue(mockRestaurants);

      const res = await request(app).get('/api/restaurants');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(expect.any(Array));
      expect(res.body[0].name).toBe('Res 1');
    });

    it('should return 500 on error', async () => {
      prisma.restaurant.findMany.mockRejectedValue(new Error('DB Error'));
      const res = await request(app).get('/api/restaurants');
      expect(res.statusCode).toEqual(500);
    });
  });

  describe('GET /api/restaurants/:id', () => {
    it('should return a single restaurant', async () => {
      const mockRestaurant = { id: '1', name: 'Res 1', address: 'Add 1', telephone_number: '123', open_time: new Date(), close_time: new Date() };
      prisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);

      const res = await request(app).get('/api/restaurants/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe('Res 1');
    });

    it('should return 404 if not found', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(null);
      const res = await request(app).get('/api/restaurants/999');
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('POST /api/restaurants', () => {
    it('should create a new restaurant', async () => {
      const newRes = { name: 'New Res', address: 'New Add', telephone_number: '000', open_time: '2023-01-01T08:00:00Z', close_time: '2023-01-01T22:00:00Z' };
      prisma.restaurant.create.mockResolvedValue({ id: '2', ...newRes });

      const res = await request(app).post('/api/restaurants').send(newRes);
      expect(res.statusCode).toEqual(201);
      expect(res.body.id).toBe('2');
    });
  });

  describe('PUT /api/restaurants/:id', () => {
    it('should update a restaurant', async () => {
      prisma.restaurant.update.mockResolvedValue({ id: '1', name: 'Updated' });
      const res = await request(app).put('/api/restaurants/1').send({ name: 'Updated' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe('Updated');
    });
  });

  describe('DELETE /api/restaurants/:id', () => {
    it('should delete a restaurant', async () => {
      prisma.restaurant.delete.mockResolvedValue({});
      const res = await request(app).delete('/api/restaurants/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Restaurant deleted successfully');
    });
  });
});
