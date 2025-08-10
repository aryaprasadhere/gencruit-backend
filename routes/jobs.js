// routes/jobs.js

//imported required modules
const express = require('express');
const { check, validationResult } = require('express-validator'); //for request body validation
const Job = require('../models/Job'); //Mongoose Job model
const auth = require('../middleware/auth'); //middleware to protect routes
const CustomError = require('../utils/customError'); //import custom error utility
const authorize = require('../middleware/authorize'); //to restrict job creation to recruiters and admins

const router = express.Router(); //initialize router

/**
 * CREATE JOB
 * route   POST /api/jobs
 * desc    create a new job
 * access  Private, only logged-in users with 'recruiter' or 'admin' roles
 */
router.post(
  '/',
  auth, //protect route with JWT-based auth
  authorize(['recruiter', 'admin']),  //only allow recruiters or admins to create jobs
  [
    //validation rules using express-validator
    check('title', 'Job title is required').notEmpty(),
    check('company', 'Company name is required').notEmpty(),
    check('description', 'Description must be at least 10 characters').isLength({ min: 10 }),
    check('location', 'Location is required').notEmpty(),
    check('salary', 'Salary must be a number').optional().isNumeric(),
  ],
  async (req, res, next) => {
    //check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //If errors exist, pass to custom error handler
      return next(new CustomError('Validation failed', 400));
    }

    //destructure job fields from request body 
    const { title, company, description, location, salary } = req.body;

    try {
      //create a new job instance with data & user from token
      const newJob = new Job({
        title,
        company,
        description,
        location,
        salary,
        user: req.user.userId, //user ID was added to req by auth middleware
      });

      //save the job to DB
      const savedJob = await newJob.save();

      //return the newly created job
      res.status(201).json(savedJob);
    } catch (err) {
      next(err); //pass to global error handler
    }
  }
);

/**
 * GET ALL JOBS 
 * route   GET /api/jobs
 * desc    get all jobs for the logged-in user with optional filters, search, and pagination
 * access  Private
 */
router.get('/', auth, async (req, res, next) => {
  try {
    //Extract query params from the URL (with defaults)
    const {
      page = 1,            
      limit = 10,          
      search = '',         
      company,             
      location,            
    } = req.query;

    //Convert page and limit to numbers for pagination
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    //Always filter jobs by the logged-in user's ID
    const query = { user: req.user.userId };

    //Add keyword search filter (title or description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    //Filter by company name if provided
    if (company) {
      query.company = { $regex: company, $options: 'i' };
    }

    //Filter by location if provided
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    //Get total number of jobs matching the query (for pagination info)
    const totalJobs = await Job.countDocuments(query);

    //Fetch jobs with pagination and sorting (newest first)
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    //Send response with jobs and pagination details
    res.json({
      success: true,
      total: totalJobs,
      page: pageNumber,
      totalPages: Math.ceil(totalJobs / limitNumber),
      jobs,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET SINGLE JOB 
 * route   GET /api/jobs/:id
 * desc    get a single job by ID (must belong to current user)
 * access  Private
 */
router.get('/:id', auth, async (req, res, next) => {
  try {
    //find job by ID & ensure it belongs to the current user
    const job = await Job.findOne({ _id: req.params.id, user: req.user.userId });

    if (!job) {
      return next(new CustomError('Job not found', 404));
    }

    res.json(job);
  } catch (err) {
    next(err);
  }
});

/**
 * UPDATE JOB 
 * route   PUT /api/jobs/:id
 * desc    update a job (only fields provided will be updated)
 * access  Private
 */
router.put(
  '/:id',
  auth,
  [
    //optional validations (only if the fields are present)
    check('title', 'Job title is required').optional().notEmpty(),
    check('company', 'Company name is required').optional().notEmpty(),
    check('description', 'Description must be at least 10 characters').optional().isLength({ min: 10 }),
    check('location', 'Location is required').optional().notEmpty(),
    check('salary', 'Salary must be a number').optional().isNumeric(),
  ],
  async (req, res, next) => {
    //handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new CustomError('Validation failed', 400));

    const { title, company, description, location, salary } = req.body;

    try {
      //find the job by ID & user to ensure ownership
      let job = await Job.findOne({ _id: req.params.id, user: req.user.userId });

      if (!job) {
        return next(new CustomError('Job not found', 404));
      }

      //update only the provided fields
      job.title = title ?? job.title;
      job.company = company ?? job.company;
      job.description = description ?? job.description;
      job.location = location ?? job.location;
      job.salary = salary ?? job.salary;

      //save and return the updated job
      const updatedJob = await job.save();
      res.json(updatedJob);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE JOB 
 * route   DELETE /api/jobs/:id
 * desc    delete a job by ID (must belong to current user)
 * access  Private
 */
router.delete('/:id', auth, async (req, res, next) => {
  try {
    //find & delete the job if it belongs to the user
    const job = await Job.findOneAndDelete({ _id: req.params.id, user: req.user.userId });

    if (!job) {
      return next(new CustomError('Job not found', 404));
    }

    res.json({ msg: 'Job deleted successfully' }); 
  } catch (err) {
    next(err);
  }
});

module.exports = router;
