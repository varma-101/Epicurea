// Import necessary modules
import express from 'express';
import mongoose from 'mongoose';
import MainSchema from './usermodel.js';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = 6969;

// Enable CORS - Development configuration
app.use(cors({
  origin: '*', // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log(err));

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up file upload path
const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  lat1 = parseFloat(lat1);
  lon1 = parseFloat(lon1);
  lat2 = parseFloat(lat2);
  lon2 = parseFloat(lon2);

  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return null;
  }

  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get restaurants by cuisine
app.get('/restaurants-by-cuisine', async (req, res) => {
  try {
    const { cuisine, page = 1, limit = 6, latitude, longitude, maxDistance = 50 } = req.query;

    if (!cuisine) {
      return res.status(400).json({ message: 'Cuisine query parameter is required.' });
    }

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const pipeline = [
      { $unwind: "$restaurants" },
      {
        $match: {
          "restaurants.restaurant.cuisines": {
            $regex: new RegExp(cuisine, 'i')
          }
        }
      },
      {
        $project: {
          _id: 0,
          id: "$restaurants.restaurant.id",
          name: "$restaurants.restaurant.name",
          cuisines: "$restaurants.restaurant.cuisines",
          location: "$restaurants.restaurant.location",
          user_rating: "$restaurants.restaurant.user_rating",
          featured_image: "$restaurants.restaurant.featured_image",
        }
      }
    ];

    const documents = await MainSchema.aggregate(pipeline);

    let result = documents.map(doc => {
      let distance = null;
      if (latitude && longitude && doc.location?.latitude && doc.location?.longitude) {
        distance = calculateDistance(
          latitude,
          longitude,
          doc.location.latitude,
          doc.location.longitude
        );
      }
      return { ...doc, distance };
    });

    if (latitude && longitude) {
      result = result.filter(restaurant =>
        restaurant.distance !== null &&
        restaurant.distance <= parseFloat(maxDistance)
      );
      result.sort((a, b) => a.distance - b.distance);
    }

    const total = result.length;
    const paginatedResult = result.slice(skip, skip + pageSize);

    if (paginatedResult.length === 0) {
      return res.status(404).json({
        message: latitude && longitude
          ? `No restaurants found within ${maxDistance}km of your location`
          : 'No restaurants found for the given cuisine'
      });
    }

    return res.status(200).json({
      total_results: total,
      current_page: pageNumber,
      total_pages: Math.ceil(total / pageSize),
      data: paginatedResult
    });

  } catch (err) {
    console.error('Error fetching restaurants:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get restaurant by ID
app.get('/restaurant/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await MainSchema.aggregate([
      { $unwind: "$restaurants" },
      {
        $match: {
          "restaurants.restaurant.id": id
        }
      }
    ]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    return res.status(200).json(result[0].restaurants.restaurant);
  } catch (err) {
    console.error('Error fetching restaurant details:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Google Generative AI Image Analysis
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Update the analyzeImageWithRetry function
async function analyzeImageWithRetry(model, base64Image, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const prompt = "What cuisine type is shown in this food image? Respond with just the cuisine name.";
      
      // Create a GenerativeContent object with the image
      const imageParts = [
        {
          text: prompt
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        }
      ];

      // Generate content
      const result = await model.generateContent(imageParts);
      const response = await result.response;
      
      if (!response || !response.text()) {
        throw new Error("Empty response from Gemini API");
      }

      return response.text();
    } catch (error) {
      lastError = error;
      console.error(`Retry ${i + 1} failed:`, error);
      // Wait before retrying, with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw lastError;
}

app.post("/api/analyze-image", upload.single("image"), async (req, res) => {
  let imagePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No image uploaded." 
      });
    }

    imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Get cuisine prediction
    const textResponse = await analyzeImageWithRetry(model, base64Image);
    console.log("AI Response:", textResponse); // Debug log

    if (!textResponse) {
      throw new Error("Failed to get cuisine prediction");
    }

    // Clean up detected cuisine text
    const detectedCuisine = textResponse
      .trim()
      .replace(/^(this appears to be|this is|i see|looks like)\s+/i, '')
      .replace(/\s+cuisine$/i, '')
      .trim();

    // Get restaurants using the detected cuisine
    const restaurants = await MainSchema.aggregate([
      { $unwind: "$restaurants" },
      {
        $match: {
          "restaurants.restaurant.cuisines": {
            $regex: new RegExp(detectedCuisine, 'i')
          }
        }
      },
      {
        $project: {
          _id: 0,
          id: "$restaurants.restaurant.id",
          name: "$restaurants.restaurant.name",
          cuisines: "$restaurants.restaurant.cuisines",
          location: "$restaurants.restaurant.location",
          user_rating: "$restaurants.restaurant.user_rating",
          featured_image: "$restaurants.restaurant.featured_image",
        }
      }
    ]);

    console.log("Found Restaurants:", restaurants.length); // Debug log

    // Paginate results
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedResults = restaurants.slice(startIndex, endIndex);
    const totalPages = Math.ceil(restaurants.length / limit);

    // Clean up uploaded file
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Send response
    return res.json({
      success: true,
      detectedCuisine,
      result: paginatedResults,
      currentPage: page,
      totalPages,
      totalResults: restaurants.length
    });

  } catch (error) {
    console.error("Error in image analysis:", error);
    
    // Clean up uploaded file on error
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Send error response
    return res.status(500).json({ 
      success: false, 
      message: "Failed to analyze image or find matching restaurants",
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
