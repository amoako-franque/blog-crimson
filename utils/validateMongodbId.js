const mongoose = require("mongoose")

exports.validateMongoDbId = (id) => {
	const isValid = mongoose.Types.ObjectId
	if (!isValid) throw new Error(`This ${id} is not a valid MongoDB Id`)
}
