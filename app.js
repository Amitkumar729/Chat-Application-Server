const express = require("express"); //web framework for the node.js

const routes = require("./routes/index");

//it gives the http request info like..end point, response time, all the login info
const morgan = require("morgan");

const ratelimit = require("express-rate-limit");

const helmet = require("helmet");

const mongosanitize = require("express-mongo-sanitize");

const xss = require("xss-clean");

const bodyparser = require("body-parser");


const cors = require("cors");

const cookieParser = require("cookie-parser");

const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "PATCH", "POST", "DELETE", "PUT"],
    credentials: true,
}));

app.use(cookieParser());

app.use(express.json({ limit: "10kb" }));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.use(helmet());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = ratelimit({
  max: 3000,
  windowMs: 60 * 60 * 1000, // In one hour
  message: "Too many requests from this IP, please try again in an Hour",
});

app.use("/tawk", limiter);

app.use(mongosanitize());


app.use(xss());

app.use(routes);



module.exports = app; 
