const mongoose = require("mongoose")
const colors = require("colors")
const db_connection = async () => {
	// connect to mongodb

	try {
		await mongoose.connect(process.env.MONGODB_URL)

		console.log("Connection to MongoDB is established".blue)
		// if connection fail we show/ send user an error message
	} catch (error) {
		console.log("Connection to MongoDB failed")
		console.log({ error })
	}
}

module.exports = db_connection
