const express = require("express")
const {
	addCategory,
	getCategories,
	getCategory,
	removeCategory,
} = require("../controllers/categoryController")
const { requireSignIn, isAdmin } = require("../middleware/authmiddleware")
const categoryRouter = express.Router()

categoryRouter.post("/category", requireSignIn, isAdmin, addCategory)
categoryRouter.get("/categories", getCategories)
categoryRouter.get("/categories/:id", getCategory)
categoryRouter.delete("/categories/:id", requireSignIn, isAdmin, removeCategory)

module.exports = categoryRouter
