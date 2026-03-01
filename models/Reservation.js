import { ObjectId } from 'mongodb';
import { getDB } from '../db.js';

class Reservation {
  static collection() {
    return getDB().collection('reservations');
  }

  static async findAll(filter = {}) {
    return await this.collection().find(filter).toArray();
  }

  static async findByUser(userId) {
    return await this.collection().find({ user: userId }).toArray();
  }

  static async findById(id) {
    return await this.collection().findOne({ _id: new ObjectId(id) });
  }

  static async create(data) {
    const result = await this.collection().insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return await this.findById(result.insertedId);
  }

  static async update(id, data) {
    await this.collection().updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } }
    );
    return await this.findById(id);
  }

  static async delete(id) {
    const result = await this.collection().deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  static async deleteByRestaurant(restaurantId) {
    const result = await this.collection().deleteMany({ restaurant_id: restaurantId });
    return result.deletedCount;
  }
}

export default Reservation;
