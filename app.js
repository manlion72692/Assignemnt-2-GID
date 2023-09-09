const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require ("./models/user");
const Post = require("./models/post");

const app = express();

app.use(bodyParser.json());

mongoose.connect("mongodb://127.0.0.1:27017/assignment")
    .then(() => {
        console.log("Connected to MongoDB")
    })
    .catch(error => {
        console.error("Error connecting to DB", error)
    })


app.post("/register", async (req, res) => {
    try{
        const { name, email, password } = req.body;
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        res.status(200).json({
            status: "Success",
            user
        })
    }catch(e){
        res.status(404).json({
            status: "Failed",
            message: e.message
        })
    }
})

app.post("/login", async (req, res) => {
    try{
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if(!user){
            return res.status(404).json({
                status: "Failed",
                message: "Invalid Credentials"
            })
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if(!isValidPassword){
            return res.status(404).json({
                status: "Failed",
                message: "Invalid Credentials"
            })
        }
        const token = jwt.sign({ 
            userId: user._id 
        }, 'your-secret-key',  {expiresIn: '1h'});
        res.status(200).json({
            status: "Success",
            token
        })
    }catch(e){
        res.status(404).json({
            status: "Failed",
            message: e.message
        })
    }
})

app.get("/posts", async (req, res) => {
    const posts = await Post.find({ user: req.user });
    res.status(200).json({ 
        status: "Success",
        posts 
    })
})

app.post('/posts', async (req, res) => {
    try {
        const { title, body, image } = req.body;
        if (!req.headers.authorization) {
            return res.status(401).json({ status: 'error', message: 'Authorization header missing' });
        }
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, 'your-secret-key');
        const user = await User.findById(decodedToken.userId);
        const post = new Post({ title, body, image, user });
        await post.save();
        res.json({ status: 'post created', post });
    } catch (error) {
        res.status(404).json({ status: 'error', error: error.message });
    }
});

app.put('/posts/:postId', async (req, res) => {
    try {
        const { title, body, image } = req.body;
        const postId = req.params.postId;
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, 'your-secret-key');
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }
        if (post.user.toString() !== decodedToken.userId) {
            return res.status(403).json({ status: 'error', message: 'Unauthorized' });
        }
        post.title = title;
        post.body = body;
        post.image = image;
        await post.save();
        res.json({ status: 'success', post });
    } catch (error) {
        res.status(404).json({ status: 'error', error: error.message });
    }
});

app.delete('/posts/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, 'your-secret-key');
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }
        if (post.user.toString() !== decodedToken.userId) {
            return res.status(403).json({ status: 'error', message: 'Unauthorized' });
        }
        await post.remove();
        res.json({ status: 'Successfully deleted' });
    } catch (error) {
        res.status(404).json({ status: 'error', error: error.message });
    }
});

app.listen(3000, () => console.log("server is running"))