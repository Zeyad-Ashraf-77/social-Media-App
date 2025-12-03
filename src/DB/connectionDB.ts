import mongoose from "mongoose";

const connectionDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL!as unknown as string)
        console.log("Connected to MongoDB...❤️✌️")
        
    } catch (error) {
        console.log("Failed to connect to MongoDB...😢😡",error)
        
    }
}

export default connectionDB