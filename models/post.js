const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
    title: { type: String },
    body: { type: String },
    image: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User"}
}) 

module.exports = mongoose.model("Post", PostSchema);