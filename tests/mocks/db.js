import { jest } from '@jest/globals';

const mockDB = {
  collection: jest.fn(() => ({
    find: jest.fn(() => ({
      toArray: jest.fn()
    })),
    findOne: jest.fn(),
    insertOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn()
  }))
};

export const connectDB = jest.fn().mockResolvedValue(mockDB);
export const getDB = jest.fn(() => mockDB);

export default { connectDB, getDB };
