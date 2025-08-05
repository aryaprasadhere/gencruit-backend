//index.js
//Import core modules
const express = require("express"); //main framework to create API
const connectDB = require("./db"); //function to connect to MongoDB database
const cors = require("cors"); //middleware to allow frontend to access backend (Cross-Origin)
const dotenv = require("dotenv"); //to load variables from .env file

//import global error handler middleware
const errorHandler = require('./middleware/errorHandler'); // catches and handles errors in one place

//load environment variables from .env file
dotenv.config();

//create Express app
const app = express();

//middleware setup
//enable CORS so frontend can talk to this API (very important!)
app.use(cors());

//parse incoming JSON requests(req.body will be usable)
app.use(express.json());


//route registration
//auth-related routes(e.g., signup, login)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes); //all auth routes will be prefixed with /api/auth

//job-related routes(CRUD for job posts)
const jobsRoutes = require('./routes/jobs');
app.use('/api/jobs', jobsRoutes); //all job routes will be prefixed with /api/jobs


//sample route
//simple test route to make sure server is working
app.get('/', (req, res) => {
  res.send('Jobify backend is running!');
});



//global error handler(must be placed after all routes)
app.use(errorHandler); //catches errors from anywhere in the app


//strt server if only DB connects

//pick port frm environment or use 5000
const PORT = process.env.PORT || 5000;

//connect to MongoDB&start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
});
