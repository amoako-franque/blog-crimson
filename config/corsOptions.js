const allowedOrigin = require("./allowedOptions")

const corsOptions = {
	origin: (origin, cb) => {
		if (allowedOrigin.indexOf(origin) !== -1 || !origin) {
			cb(null, true)
		} else {
			cb(new Error("Not allowed by cors"))
		}
	},
	methods: ["GET", "POST"],
	credentials: true,
	optionsSuccessStatus: 200,
}

module.exports = corsOptions
