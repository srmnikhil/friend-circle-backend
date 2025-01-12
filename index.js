const connectToMongo = require("./db");
const express = require("express");
const cors = require("cors");
connectToMongo();

const app = express();

// Enable CORS for all routes
app.use(cors());
// Middleware to parse JSON data in requests
app.use(express.json());
//Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/friends", require("./routes/friends"));
app.use("/api/request", require("./routes/request"));
const port = process.env.PORT||5000;;

app.listen(port, ()=>{
    console.log(`Server listening on port ${port}`);
})