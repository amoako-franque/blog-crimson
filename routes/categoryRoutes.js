const express = require("express")
const {
	addCategory,
	getCategories,
	getCategory,
	removeCategory,
} = require("../controllers/categoryController")
const { requireSignIn, isAdmin } = require("../middleware/authmiddleware")
const categoryRouter = express.Router()

categoryRouter.post("/category/add-cat", requireSignIn, isAdmin, addCategory)
categoryRouter.get("/category/categories", getCategories)
categoryRouter.get("/category/categories/:id", getCategory)
categoryRouter.delete(
	"/category/categories/:id",
	requireSignIn,
	isAdmin,
	removeCategory
)

module.exports = categoryRouter
