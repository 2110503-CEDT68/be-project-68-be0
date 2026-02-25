import { jest, describe, it, expect, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import prisma from '../db.js';


describe('Table CRUD Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tables', () => {
    it('should return all tables', async () => {
      const mockTables = [
        { id: '1', restaurant_id: 'res1', capacity: 4, status: 'AVAILABLE' }
      ];
      prisma.table.findMany.mockResolvedValue(mockTables);

      const res = await request(app).get('/api/tables');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(expect.any(Array));
      expect(res.body[0].capacity).toBe(4);
    });

    it('should filter by restaurant_id', async () => {
        prisma.table.findMany.mockResolvedValue([]);
        await request(app).get('/api/tables?restaurant_id=123');
        expect(prisma.table.findMany).toHaveBeenCalledWith({
            where: { restaurant_id: '123' }
        });
    });
  });

  describe('GET /api/tables/:id', () => {
    it('should return a single table', async () => {
      const mockTable = { id: '1', restaurant_id: 'res1', capacity: 4, status: 'AVAILABLE' };
      prisma.table.findUnique.mockResolvedValue(mockTable);

      const res = await request(app).get('/api/tables/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toBe('1');
    });
  });

  describe('POST /api/tables', () => {
    it('should create a new table', async () => {
      const newTable = { restaurant_id: 'res1', capacity: 2 };
      prisma.table.create.mockResolvedValue({ id: '2', ...newTable, status: 'AVAILABLE' });

      const res = await request(app).post('/api/tables').send(newTable);
      expect(res.statusCode).toEqual(201);
      expect(res.body.capacity).toBe(2);
    });
  });

  describe('PUT /api/tables/:id', () => {
    it('should update a table', async () => {
      prisma.table.update.mockResolvedValue({ id: '1', status: 'OCCUPIED' });
      const res = await request(app).put('/api/tables/1').send({ status: 'OCCUPIED' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('OCCUPIED');
    });
  });

  describe('DELETE /api/tables/:id', () => {
    it('should delete a table', async () => {
      prisma.table.delete.mockResolvedValue({});
      const res = await request(app).delete('/api/tables/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Table deleted successfully');
    });
  });
});
