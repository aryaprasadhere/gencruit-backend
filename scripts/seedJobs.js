const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');
const Job = require('../models/Job');
const User = require('../models/User');

dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected for seeding jobs');
    seedJobs();
  })
  .catch((err) => console.error('DB Connection Failed:', err));

// Function to seed jobs
const seedJobs = async () => {
  try {
    // Get all users (we'll assign jobs to real users)
    const users = await User.find();

    if (users.length === 0) {
      console.log('No users found. Please seed users first.');
      return;
    }

    const jobsToInsert = [];

    for (let i = 0; i < 30; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];

      const job = new Job({
        title: faker.person.jobTitle(),
        company: faker.company.name(),
        description: faker.lorem.paragraph(),
        location: faker.location.city(),
        salary: faker.number.int({ min: 30000, max: 150000 }),
        user: randomUser._id,
      });

      jobsToInsert.push(job);
    }

    await Job.insertMany(jobsToInsert);
    console.log(`${jobsToInsert.length} jobs seeded successfully.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding jobs failed:', err);
    process.exit(1);
  }
};
