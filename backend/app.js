const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const globalErrorHandler = require("./controller/errorController");
const userRouter = require("./routes/userRoutes");
const AppError = require('./utils/appError');


const app = express();

app.use(cookieParser())

app.use(cors({
    origin:['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

app.use(express.json({limit: "10kb"}));

// Users api urls
app.use("/api/medi-scan/users", userRouter);

app.all('*', (req,res,next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;