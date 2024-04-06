const jwt = require("jsonwebtoken")
const JWT_SECRET_KEY = process.env.JWT_SECRET
const crypto = require("crypto")

const createJwtToken = (userId, email, role) => {
	const token = jwt.sign({ userId, email, role }, JWT_SECRET_KEY, {
		expiresIn: "1d",
	})

	return token
}

const generateResetToken = async (user) => {
	const resetToken = crypto.randomBytes(41).toString("hex")

	const hashedToken = crypto
		.createHash("sha256")
		.update(resetToken)
		.digest("hex")

	// console.log({ token: resetToken, hash: hashedToken })

	user.password_reset_token = hashedToken
	user.password_reset_token_expiry = Date.now() + 10 * 60 * 1000 // 10 minutes from now

	return resetToken
}

module.exports = { createJwtToken, generateResetToken }
