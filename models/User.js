const mongoose = require("mongoose");
const {Schema} = mongoose;

const userSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    mobile:{
        type: Number,
        required: true,
    },
    email:{
        type: String,
        required: true,
    },
    city:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true,
    }
})

module.exports = mongoose.model("User", userSchema);
