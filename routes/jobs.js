// routes/jobs.js

//imported required modules
const express = require('express');

const { check, validationResult } = require('express-validator'); //fr request body validation
const Job = require('../models/Job'); //Mongoose Job model
const auth = require('../middleware/auth'); //middleware to protect routes
const CustomError = require('../utils/customError'); //import custom error utility

const router = express.Router(); //initialize router

//CREATE JOB
//route   POST /api/jobs
//create a new job
//access  Private,only logged-in users can create jobs
router.post(
  '/',
  auth, //protect route with JWT-based auth
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
      //If errors exist, send it to client
      return next(new CustomError('Validation failed', 400));
    }

    //destructure job fields from request body 
    const { title, company, description, location, salary } = req.body;

    try {
      //create a new job instance with data&user from token
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

//GET ALL JOBS 
//route   GET /api/jobs
//get all jobs for the logged-in user
//access  Private

router.get('/', auth, async (req, res, next) => {
  try {
    //Extract query params from the URL
    const {
      page = 1,            // current page number (default is 1)
      limit = 10,          // how many jobs per page (default is 10)
      search = '',         // keyword to search in job title/description
      company,             // filter by company name
      location             // filter by location
    } = req.query;

    //Convert page and limit to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    //Start building the query object (always filter by logged-in user)
    const query = { user: req.user.userId };

    //Add search condition if search term is provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },        // search in title (case-insensitive)
        { description: { $regex: search, $options: 'i' } }   // search in description
      ];
    }

    //Add filter for company if provided
    if (company) {
      query.company = { $regex: company, $options: 'i' };    // case-insensitive match
    }

    //Add filter for location if provided
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    //Get total number of jobs matching the query (for pagination)
    const totalJobs = await Job.countDocuments(query);

    //Fetch jobs with pagination and sorting
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })       // sort by newest first
      .skip(skip)                    // skip previous pages
      .limit(limitNumber);           // limit to current page

    //send response with jobs and pagination info
    res.json({
      success: true,
      total: totalJobs,               // total matching jobs
      page: pageNumber,               // current page
      totalPages: Math.ceil(totalJobs / limitNumber),  // total number of pages
      jobs                             // jobs on the current page
    });
  } catch (err) {
    next(err); // pass any errors to global error handler
  }
});

//GET SINGLE JOB 
//route   GET /api/jobs/:id
//get a single job by ID
//access  Private
router.get('/:id', auth, async (req, res, next) => {
  try {
    //find job by ID&ensure it belongs to the current user
    const job = await Job.findOne({ _id: req.params.id, user: req.user.userId });

    if (!job) {
      //if no such job,404
      return next(new CustomError('Job not found', 404));
    }

    res.json(job); //return the job
  } catch (err) {
    next(err); //pass to global error handler
  }
});

//UPDATE JOB 
//route   PUT /api/jobs/:id
//to update a job
//access  Private
router.put(
  '/:id',
  auth,
  [
    //optional validations(only if the fields are present)
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

    //destructure updated values from request body
    const { title, company, description, location, salary } = req.body;

    try {
      //fnd the job by ID&user to ensure ownership
      let job = await Job.findOne({ _id: req.params.id, user: req.user.userId });

      if (!job) {
        return next(new CustomError('Job not found', 404));
      }

      //update only the fields that are provided
      job.title = title || job.title;
      job.company = company || job.company;
      job.description = description || job.description;
      job.location = location || job.location;
      job.salary = salary || job.salary;

      //save the updated job
      const updatedJob = await job.save();

      res.json(updatedJob); //return the updated job
    } catch (err) {
      next(err); //pass to global error handler
    }
  }
);

//DELETE JOB 
//route   DELETE /api/jobs/:id
//delete a job by ID
//access  Private
router.delete('/:id', auth, async (req, res, next) => {
  try {
    //find&delete the job if it belongs to the user
    const job = await Job.findOneAndDelete({ _id: req.params.id, user: req.user.userId });

    if (!job) {
      return next(new CustomError('Job not found', 404));
    }

    res.json({ msg: 'Job deleted successfully' }); 
  } catch (err) {
    next(err); //pass to global error handler
  }
});

module.exports = router; //export the router so it can be used in index.js

