import Reservation from '../models/Reservation.js';
import Table from '../models/Table.js';

// @desc    Get all tables
// @route   GET /api/tables
// @access  Public
export const getTables = async(req, res, next) => {
    let query;

    // Copy req.query
    const reqQuery = {...req.query};

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over remove fields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    console.log(reqQuery);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    query = Table.find(JSON.parse(queryStr)).populate('restaurant_id', 'name address');

    // Select Fields
    if(req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    // Sort
    if(req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page-1)*limit;
    const endIndex = page*limit;
    
    try {
        const total = await Table.countDocuments();
        query = query.skip(startIndex).limit(limit);

        // Execute query
        const tables = await query;

        // Pagination result
        const pagination = {};

        if(endIndex < total) {
            pagination.next = {
                page:page+1,
                limit
            }
        }

        if(startIndex > 0) {
            pagination.prev = {
                page:page-1,
                limit
            }
        }

        res.status(200).json({
            success: true,
            count: tables.length,
            data: tables
        });
    }
    catch(err) {
        res.status(400).json({success: false});
    }
}

// @desc    Get single table
// @route   GET /api/tables/:id
// @access  Public
export const getTable = async(req, res, next) => {
    try {
        const table = await Table.findById(req.params.id);

        if(!table) {
            return res.status(400).json({success: false});
        }

        res.status(200).json({
            success: true,
            data: table
        });
    }
    catch(err) {
        res.status(400).json({success: false});
    }
}

// @desc    Create a table
// @route   POST /api/tables
// @access  Private
export const createTable = async(req, res, next) => {
    try {
        const table = await Table.create(req.body);

        res.status(201).json({
            success: true,
            data: table
        });
    }
    catch(err) {
        res.status(400).json({success: false});
    }
}

// @desc    Update single table
// @route   PUT /api/tables/:id
// @access  Private
export const updateTable = async(req, res, next) => {
    try {
        const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if(!table) {
            return res.status(400).json({success: false});
        }

        res.status(200).json({
            success: true,
            data: table
        });
    }
    catch(err) {
        res.status(400).json({success: false});
    }
}

// @desc    Delete single table
// @route   DELETE /api/tables/:id
// @access  Private
export const deleteTable = async(req, res, next) => {
    try {
        const table = await Table.findById(req.params.id);

        if(!table) {
            return res.status(404).json({
                success: false,
                message: `Table not found with id of ${req.params.id}`
            });
        }

        await Reservation.deleteMany({table: req.params.id});
        await Table.deleteOne({_id: req.params.id});

        res.status(200).json({
            success: true,
            data: {}
        });
    }
    catch(err) {
        res.status(400).json({success: false});
    }
}