const cookieParser = require("cookie-parser")
const express = require("express")
const morgan = require("morgan")
const helmet = require("helmet")
const fs = require("fs")
const cors = require("cors")
const db_connection = require("./config/db")
require("dotenv").config()
const colors = require("colors")
const { notFound, errorHandler } = require("./middleware/errorHandlers")
const corsOptions = require("./config/corsOptions")
const { loginLimit } = require("./middleware/loginLimiter")
const compression = require("compression")

// connection to mongodb database
db_connection()

const PORT = process.env.PORT || 8900

const app = express()

// middleware
//  refresh token and sessions + cookies
app.use(helmet())
app.use(compression())
app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(cors(corsOptions))
app.use(loginLimit)

app.get("/data", (req, res) => {
	res.json({ data: req.body })
})

let count = 0
const interval = setInterval(() => {
	if (count >= 30 * 24 * 60) {
		clearInterval(interval)
	} else {
		fetch("http://localhost:8000/api/v1/health-check")
			.then((response) => response.json())
			.then((data) => console.log(data))
			.catch((error) => console.error(error))
		count += 10
	}
}, 600000)
//
// app.use("/api/v1/auth", require("./routes/userRoutes"))
// app.use("/api/v1/category", require("./routes/categoryRoutes"))
// app.use("/api/v1/post", require("./routes/postRoutes"))

fs.readdirSync("./routes").map((route) => {
	app.use("/api/v1", require("./routes/" + route))
})
app.use(notFound)
app.use(errorHandler)
// http://localhost:8000/api/v1/register

// app.get('/', (req, res) => res.send('Hello World!'))
app.listen(PORT, () =>
	console.log(` Server listening on http://localhost:${PORT}`.bgMagenta)
)
