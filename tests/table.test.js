import { jest, describe, it, expect, afterEach } from '@jest/globals';
import request from 'supertest';

// Mock the models and db before importing app
const mockTable = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

const mockDB = {
  collection: jest.fn()
};

const mockConnectDB = jest.fn().mockResolvedValue(mockDB);
const mockGetDB = jest.fn(() => mockDB);

// Set up module mocks
jest.unstable_mockModule('../models/Table.js', () => ({
  default: mockTable
}));

jest.unstable_mockModule('../db.js', () => ({
  connectDB: mockConnectDB,
  getDB: mockGetDB,
  default: { connectDB: mockConnectDB, getDB: mockGetDB }
}));

// Import app after mocks are set up
const { default: app } = await import('../index.js');
const { default: Table } = await import('../models/Table.js');

describe('Table CRUD Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tables', () => {
    it('should return all tables', async () => {
      const mockTables = [
        { _id: '1', restaurant_id: 'res1', capacity: 4, status: 'AVAILABLE' }
      ];
      mockTable.findAll.mockResolvedValue(mockTables);

      const res = await request(app).get('/api/tables');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(expect.any(Array));
      expect(res.body[0].capacity).toBe(4);
    });

    it('should filter by restaurant_id', async () => {
      mockTable.findAll.mockResolvedValue([]);
      await request(app).get('/api/tables?restaurant_id=123');
      expect(mockTable.findAll).toHaveBeenCalledWith({
        restaurant_id: '123'
      });
    });
  });

  describe('GET /api/tables/:id', () => {
    it('should return a single table', async () => {
      const mockTableData = { _id: '1', restaurant_id: 'res1', capacity: 4, status: 'AVAILABLE' };
      mockTable.findById.mockResolvedValue(mockTableData);

      const res = await request(app).get('/api/tables/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body._id).toBe('1');
    });
  });

  describe('POST /api/tables', () => {
    it('should create a new table', async () => {
      const newTable = { restaurant_id: 'res1', capacity: 2 };
      mockTable.create.mockResolvedValue({ _id: '2', ...newTable, status: 'AVAILABLE' });

      const res = await request(app).post('/api/tables').send(newTable);
      expect(res.statusCode).toEqual(201);
      expect(res.body.capacity).toBe(2);
    });
  });

  describe('PUT /api/tables/:id', () => {
    it('should update a table', async () => {
      mockTable.update.mockResolvedValue({ _id: '1', status: 'OCCUPIED' });
      const res = await request(app).put('/api/tables/1').send({ status: 'OCCUPIED' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('OCCUPIED');
    });
  });

  describe('DELETE /api/tables/:id', () => {
    it('should delete a table', async () => {
      mockTable.delete.mockResolvedValue(true);
      const res = await request(app).delete('/api/tables/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Table deleted successfully');
    });
  });
});
