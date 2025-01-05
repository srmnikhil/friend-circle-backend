const mongoose =  require("mongoose");
require("dotenv").config();
const mongoURI = "mongodb://localhost:27017/friendcircle";

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