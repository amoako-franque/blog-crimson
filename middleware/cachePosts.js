const NodeCache = require("node-cache")

const cache = new NodeCache({ stdTTL: 10 })

exports.postCache = (duration) => (req, res, next) => {
	// is request GET ?
	// if not, send an error and call next
	if (req.method !== "GET") {
		console.error("you can not cache posts yet")
		return next()
	}

	const key = req.originalUrl
	const cachedResponse = cache.get(key)
	console.log({ key })
	if (cachedResponse) {
		console.log(`Cache hit for ${key}`)
		res.json(cachedResponse)
	} else {
		// if not replace .send with method to set response to cache
		console.log(`Cache miss for $(key}`)
		res.originalJson = res.json
		res.json = (body) => {
			console.log({ key, body, duration })
			res.originalJson(body)
			cache.set(key, body, duration)
		}
		next()
	}
}
