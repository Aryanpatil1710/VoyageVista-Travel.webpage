if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}


console.log(process.env.SECRET);


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dburl = process.env.ATLASDB_URL;
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema} = require("./schema.js");
const reviews = require("./models/review.js");
const session = require("express-session");
const Mongostore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStragety = require("passport-local");
const user = require("./models/user.js");
const methodOverride = require('method-override');
const middleware = require('./middleware');


const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");


const dbUrl= process.env.ATLASDB_URL;
// console.log(dbUrl);

main().then(() => {
    console.log("connected to DB");
})
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(dbUrl);
}


app.set("view engine", "ejs");
app.use(methodOverride('_method'));
app.set("views", path.join(__dirname, "views"));
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const sessionOption = {
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true 
};

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStragety(user.authenticate()));

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.use((req, res, next)=> {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/", (req, res)=>{
//     res.send("Hi , I am root");
// });  

const store = Mongostore.create({
    mongoUrl: dburl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", ()=>{
    console.log("ERROR in MONGO SESSION STORE", err);
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

//REVIEWS 
//POST ROUTE





// app.get("/testListing",async (req, res)=>{
//   let sampleListing = new Listing({
//         title: "My new Villa",
//         descrition: "By teh beach",
//         price: "1200",
//         location: "Calangute, Goa",
//         country: "India",
//        });

//        await sampleListing.save();
//        console.log("sample was saved");
//        res.send("successful testing");
// });

app.use((err, req, res, next) => {
    let { status = 500, message = "Something Went Wrong!" } = err;
    res.status(status).render("error.ejs", { err });
});

app.listen(8080, ()=>{
    console.log("server is listening to port 8080");
});