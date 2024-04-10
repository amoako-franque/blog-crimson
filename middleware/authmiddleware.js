const jwt = require("jsonwebtoken")
const User = require("../models/userModel")
const JWT_SECRET_KEY = process.env.JWT_SECRET

const requireSignIn = async (req, res, next) => {
	const token = req.cookies.userToken
	try {
		if (!token) {
			return res.status(401).json({
				message: "Invalid Token Format",
			})
		}
		const decode = jwt.verify(token, JWT_SECRET_KEY)

		const { userId, role, email } = decode
		//find the user by id
		const user = await User.findById(userId)
		if (!user) {
			return res.status(401).json({
				message: "Invalid Token",
			})
		}

		if (user?.isBlocked) {
			res.status(401).json({
				errorMessage: `Access Denied ${user?.firstname} is blocked. Contact Support Team`,
			})

			return
		}
		//attach the user to the request object
		req.auth = user
		next()
	} catch (error) {
		// if (error instanceof jwt.TokenExpiredError) {
		// 	return res.status(401).json({
		// 		message: "Session Expired",
		// 		error: error.message,
		// 	})
		// }
		// if (
		// 	error instanceof jwt.JsonWebTokenError ||
		// 	error instanceof jwt.TokenError
		// ) {
		// 	return res.status(401).json({
		// 		message: "Invalid Token",
		// 		error: error.message,
		// 	})
		// }
		// res.status(500).json({
		// 	message: "Internal server Error",
		// 	error: error.message,
		// 	stack: error.stack,
		// })
		next(error)
	}
}

const isAdmin = async (req, res, next) => {
	const user = req?.auth

	if (user.isAdmin) {
		next()
	} else {
		res
			.status(401)
			.json({ errorMessage: "You are not authorized to access this page" })
		return false
	}
}

module.exports = { requireSignIn, isAdmin }

// option one

// const authorization = req.headers.authorization || req.headers.Authorization

// if (!authorization) {
// 	return res.status(401).json({
// 		error: "No Authorization. Please login with your credentials to continue",
// 	})
// }
// const token = authorization.split("Bearer ")[1]
