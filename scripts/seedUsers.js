//scripts/seedUsers.js

//import required packages and models
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); //adjust the path if needed

//load environment variables from .env file
dotenv.config();

//dummy user data
const users = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'password123',
  },
  {
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    password: 'password123',
  },
];

//function to seed users into the database
const seedUsers = async () => {
  try {
    //connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    //optional fr clear existing users
    await User.deleteMany({});
    console.log('Existing users cleared');

    //hash passwords and insert users
    const hashedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return { ...user, password: hashedPassword };
      })
    );

    //insert into DB
    await User.insertMany(hashedUsers);
    console.log('Test users seeded successfully');

    //close DB connection
    mongoose.connection.close();
  } catch (err) {
    console.error('Error seeding users:', err.message);
    mongoose.connection.close();
  }
};

//to run the function
seedUsers();
