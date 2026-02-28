import { jest } from '@jest/globals';

const RestaurantMock = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findWithRelations: jest.fn(),
  findAllWithRelations: jest.fn()
};

export default RestaurantMock;
