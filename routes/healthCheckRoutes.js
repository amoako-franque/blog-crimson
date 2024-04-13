const express = require("express")
const { healthCheck } = require("../controllers/healthcheckController")
const healthCheckRouter = express.Router()

healthCheckRouter.get("/health-check", healthCheck)

module.exports = healthCheckRouter
