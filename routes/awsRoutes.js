const express = require("express")
const multer = require("multer")
const sharp = require("sharp")
const router = express.Router()
const {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
} = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")
const crypto = require("crypto")

let Post = [{}]

const bucketName = process.env.BUCKET_NAME
const bucketRegion = process.env.BUCKET_REGION
const awsAccessKey = process.env.AWS_ACCESS_KEYS
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEYS

// image names
const random_image_name = (bytes = 32) =>
	crypto.randomBytes(bytes).toString("hex")

const s3_client = new S3Client({
	credentials: {
		accessKeyId: awsAccessKey,
		secretAccessKey: awsSecretAccessKey,
	},

	region: bucketRegion,
})

const storage = multer.memoryStorage()
const upload_file = multer({ storage: storage })

router.post("/create-post", upload_file.single("image"), async (req, res) => {
	// console.log(req.body)
	// console.log(req.file)

	const sharp_buffer = await sharp(req.file.buffer)
		.resize({ width: 1080, height: 1920, fit: "contain" })
		.toBuffer()

	const post_image = req.file.originalname + "-" + random_image_name()

	const putOptions = {
		Bucket: bucketName,
		Key: post_image,
		Body: sharp_buffer,
		ContentType: req.file.mimetype,
	}

	const command = new PutObjectCommand(putOptions)

	await s3_client.send(command)

	const post = await Post.create({
		title: req.body.title,
		content: req.body.content,
		image_name: post_image,
	})

	res.json({ message: "image uploaded", post })
})

router.get("/fetch/posts", async (req, res) => {
	//1. fetch all posts from database
	let posts = []

	for (const post of posts) {
		const getObjectParams = {
			key: post?.post_image,
			Bucket: bucketName,
		}
		const command = new GetObjectCommand(getObjectParams)
		const url = await getSignedUrl(s3_client, command, { expiresIn: 3600 })
		post.ImgURL = url
	}

	res.json(posts)
})

router.delete("/post/:id", async (req, res) => {
	const id = +req.params.id
	const post = await Post.findById(id)

	if (!post) {
		return res.status(404).json({ message: "post not found" })
	}

	const params = {
		Bucket: bucketName,

		Key: post?.post_image,
	}

	const command = new DeleteObjectCommand(params)

	await s3_client.send(command)

	await Post.findByIdAndDelete(id)

	res.json({ message: "post deleted", post })
})

module.exports = router
