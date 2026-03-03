import mongoose from "mongoose";

const RestaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      unique: true,
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    address: {
      type: String,
      required: [true, "Please add an address"],
    },
    telephone_number: {
      type: String,
    },
    open_time: {
      type: String,
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "Please add a valid open_time in HH:MM format",
      ],
    },
    close_time: {
      type: String,
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "Please add a valid close_time in HH:MM format",
      ],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual populate reservations
RestaurantSchema.virtual("reservations", {
  ref: "Reservation",
  localField: "_id",
  foreignField: "restaurant_id",
  justOne: false,
});

export default mongoose.model("Restaurant", RestaurantSchema);
