const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

app.use('/uploads', express.static(uploadsDir));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Define Photo Schema
const photoSchema = new mongoose.Schema({
    filename: String,
    country: String,
    uploadDate: { type: Date, default: Date.now }
});

const Photo = mongoose.model('Photo', photoSchema);

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } //5MB file size limit
});

// Routes
app.post('/upload', upload.single('photo'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const newPhoto = new Photo({
        filename: req.file.filename,
        country: req.body.country
    });

    try {
        await newPhoto.save();
        res.status(201).send('Photo uploaded successfully');
    } catch (error) {
        console.error('Error uploading photo:', error)
        res.status(500).send(`Error uploading photo: ${error.message}`);
    }
});

app.get('/photos', async (req, res) => {
    const { country } = req.query;
    try {
        let query = country ? { country: new RegExp(country, 'i') } : {};
        const photos = await Photo.find(query);
        res.json(photos);
    } catch (error) {
        res.status(500).send('Error fetching photos');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});