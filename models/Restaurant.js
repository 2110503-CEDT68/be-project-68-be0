import { ObjectId } from 'mongodb';
import { getDB } from '../db.js';

class Restaurant {
  static collection() {
    return getDB().collection('restaurants');
  }

  static async findAll(options = {}) {
    return await this.collection().find({}).toArray();
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

  static async findWithRelations(id) {
    const restaurant = await this.findById(id);
    if (!restaurant) return null;

    const db = getDB();
    const [tables, reservations] = await Promise.all([
      db.collection('tables').find({ restaurant_id: id }).toArray(),
      db.collection('reservations').find({ restaurant_id: id }).toArray()
    ]);

    return {
      ...restaurant,
      tables,
      reservations,
      reservation_count: reservations.length
    };
  }

  static async findAllWithRelations() {
    const restaurants = await this.findAll();
    const db = getDB();

    return await Promise.all(
      restaurants.map(async (restaurant) => {
        const [tables, reservations] = await Promise.all([
          db.collection('tables').find({ restaurant_id: restaurant._id.toString() }).toArray(),
          db.collection('reservations').find({ restaurant_id: restaurant._id.toString() }).toArray()
        ]);

        return {
          ...restaurant,
          tables,
          reservation_count: reservations.length
        };
      })
    );
  }
}

export default Restaurant;
