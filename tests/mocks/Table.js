import { jest } from '@jest/globals';

const TableMock = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

export default TableMock;
