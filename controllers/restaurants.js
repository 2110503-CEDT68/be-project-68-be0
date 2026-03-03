import Restaurant from "../models/Restaurant.js";
import Reservation from "../models/Reservation.js";

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
export const getRestaurants = async (req, res, next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields = ["select", "sort", "page", "limit"];

  // Loop over remove fields and delete them from reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`,
  );

  query = Restaurant.find(JSON.parse(queryStr)).populate("reservations");

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  try {
    const total = await Restaurant.countDocuments();
    query = query.skip(startIndex).limit(limit);

    // Execute query
    const restaurants = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Public
export const getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(400).json({ success: false });
    }

    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Create a restaurant
// @route   POST /api/restaurants
// @access  Private
export const createRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.create(req.body);

    res.status(201).json({
      success: true,
      data: restaurant,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Update single restaurant
// @route   PUT /api/restaurants/:id
// @access  Private
export const updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!restaurant) {
      return res.status(400).json({ success: false });
    }

    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Delete single restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private
export const deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: `Restaurant not found with id of ${req.params.id}`,
      });
    }

    await Reservation.deleteMany({ restaurant_id: req.params.id });
    await Restaurant.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};
