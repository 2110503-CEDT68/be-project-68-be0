import { jest } from "@jest/globals";

const RestaurantMock = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  deleteOne: jest.fn(),
  countDocuments: jest.fn(),
};

export default RestaurantMock;
