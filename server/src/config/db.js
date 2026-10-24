import mongoose from "mongoose";

let isConnected = false;

/**
 * Masks sensitive credentials in MongoDB connection strings before logging
 * 
 * @param {string} uri - Raw connection URI
 * @returns {string} Sanitized URI safe for logs
 */
export function maskMongoUri(uri = "") {
  if (!uri || typeof uri !== "string") return "[NOT_SET]";
  try {
    return uri.replace(/(mongodb(\+srv)?:\/\/)([^:@]+):([^@]+)@/, "$1*****:*****@");
  } catch {
    return "[MASKED_URI]";
  }
}

/**
 * Connects to MongoDB Atlas using the URI from environment variables
 * Safely handles missing configurations, placeholder URIs, and connection errors.
 * 
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI;

  // 1. Check for missing URI or template placeholders
  if (!uri || uri.includes("<username>") || uri.includes("<password>")) {
    console.log(
      "[DATABASE] Notice: MongoDB Atlas URI not configured or contains placeholders in .env."
    );
    console.log(
      "[DATABASE] To connect to MongoDB Atlas, set MONGO_URI in server/.env with your cluster credentials."
    );
    isConnected = false;
    return false;
  }

  // 2. Attempt connection with strict timeout
  try {
    const maskedUri = maskMongoUri(uri);
    console.log(`[DATABASE] Attempting connection to MongoDB Atlas at: ${maskedUri}...`);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    isConnected = true;
    console.log(
      `[DATABASE] Connected successfully to MongoDB Atlas database: "${mongoose.connection.name}"`
    );
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`[DATABASE] MongoDB connection could not be established: ${error.message}`);
    console.warn(
      "[DATABASE] Operating with resilient fallback to maintain service availability."
    );
    return false;
  }
}

/**
 * Checks whether the MongoDB connection is active
 * @returns {boolean}
 */
export function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Disconnects from MongoDB (useful for clean process termination and tests)
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

export default connectDB;
