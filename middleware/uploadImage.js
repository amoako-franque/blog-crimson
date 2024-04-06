const multer = require("multer")
const sharp = require("sharp")
const path = require("path")
const fs = require("fs")

exports.uploadPhoto = multer({
	storage: multer.memoryStorage({}),
	fileFilter: (req, file, cb) => {
		let ext = path.extname(file.originalname)
		if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
			cb(new Error("File uploaded is not supported"), false)
			return
		}
		cb(null, true)
	},
	limit: { fileSize: 1000000 },
})

exports.postImageResize = async (req, res, next) => {
	if (!req.file) return next()

	req.file.filename = `user-${Date.now()}- ${req.file.originalname}`

	await sharp(req.file.buffer)
		.resize(300, 300)
		.toFormat("jpeg")
		.jpeg({ quality: 90 })
		.toFile(`public/images/post/${req.file.filename}`)
	next()
}

exports.profilePicResize = async (req, res, next) => {
	if (!req.file) return next()

	req.file.filename = `user-${Date.now()}- ${req.file.originalname}`

	await sharp(req.file.buffer)
		.resize(300, 300)
		.toFormat("jpeg")
		.jpeg({ quality: 90 })
		.toFile(`public/images/profile/${req.file.filename}`)
	next()
}
