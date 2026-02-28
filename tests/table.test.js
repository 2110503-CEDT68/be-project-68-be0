import { jest, describe, it, expect, afterEach, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import Table from '../models/Table.js';

jest.mock('../models/Table.js');
jest.mock('../db.js');

describe('Table CRUD Routes', () => {
  beforeAll(async () => {
    const { connectDB } = await import('../db.js');
    await connectDB();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tables', () => {
    it('should return all tables', async () => {
      const mockTables = [
        { _id: '1', restaurant_id: 'res1', capacity: 4, status: 'AVAILABLE' }
      ];
      Table.findAll.mockResolvedValue(mockTables);

      const res = await request(app).get('/api/tables');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(expect.any(Array));
      expect(res.body[0].capacity).toBe(4);
    });

    it('should filter by restaurant_id', async () => {
      Table.findAll.mockResolvedValue([]);
      await request(app).get('/api/tables?restaurant_id=123');
      expect(Table.findAll).toHaveBeenCalledWith({
        restaurant_id: '123'
      });
    });
  });

  describe('GET /api/tables/:id', () => {
    it('should return a single table', async () => {
      const mockTable = { _id: '1', restaurant_id: 'res1', capacity: 4, status: 'AVAILABLE' };
      Table.findById.mockResolvedValue(mockTable);

      const res = await request(app).get('/api/tables/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body._id).toBe('1');
    });
  });

  describe('POST /api/tables', () => {
    it('should create a new table', async () => {
      const newTable = { restaurant_id: 'res1', capacity: 2 };
      Table.create.mockResolvedValue({ _id: '2', ...newTable, status: 'AVAILABLE' });

      const res = await request(app).post('/api/tables').send(newTable);
      expect(res.statusCode).toEqual(201);
      expect(res.body.capacity).toBe(2);
    });
  });

  describe('PUT /api/tables/:id', () => {
    it('should update a table', async () => {
      Table.update.mockResolvedValue({ _id: '1', status: 'OCCUPIED' });
      const res = await request(app).put('/api/tables/1').send({ status: 'OCCUPIED' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('OCCUPIED');
    });
  });

  describe('DELETE /api/tables/:id', () => {
    it('should delete a table', async () => {
      Table.delete.mockResolvedValue(true);
      const res = await request(app).delete('/api/tables/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Table deleted successfully');
    });
  });
});
