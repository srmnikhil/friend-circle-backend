const mongoose =  require("mongoose");
require("dotenv").config();
const mongoURI = process.env.DATABASE_URI;

const connectToMongo = ()=>{
    mongoose.connect(mongoURI)
    .then(()=>{
        console.log("Connected DB Successfully");
    })
    .catch((error)=>{
        console.log("Failed to Connect: "+(error));
    });
}
    // Export the function to be used in other files.
module.exports = connectToMongo;