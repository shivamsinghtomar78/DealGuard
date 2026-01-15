import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.warn('WARNING: MONGODB_URI environment variable is not set. Database features will be unavailable.');
            return;
        }
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`MongoDB connection error: ${error.message}`);
        console.warn('The server will continue running but database features will be unavailable.');
        // Don't exit - let the server start so Render can detect the port
    }
};

export default connectDB;
