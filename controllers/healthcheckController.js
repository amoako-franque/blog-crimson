exports.healthCheck = async (req, res) => {
	res.status(200).json({ success: true })
}
