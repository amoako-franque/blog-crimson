const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3")
const crypto = require("crypto")

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
const putOptions = {
	Bucket: bucketName,
	Key: req.file.originalname + "-" + random_image_name(),
	Body: req.file.buffer,
	ContentType: req.file.mimetype,
}
const command = new PutObjectCommand(putOptions)

module.exports = { s3_client, command }
