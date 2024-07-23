const rateLimit = require("express-rate-limit")

exports.loginLimit = rateLimit({
	windowMs: 24 * 60 * 60 * 1000,
	max: 50,
	message: {
		message: " Too many login attempts from ip. please try again 60 seconds",
	},
	standardHeaders: true,
	legacyHeaders: false,
})
