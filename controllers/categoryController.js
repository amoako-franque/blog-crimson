const Category = require("../models/cartegoryModel")

exports.addCategory = async (req, res) => {
	const user = req?.auth

	if (!user) {
		return res.status(401).json({
			errorMessage: "Unauthorized to access this page",
		})
	}

	if (!req.body.title) {
		return res.status(400).json({
			errorMessage: "Please enter a category title",
		})
	}

	const existingCat = await Category.findOne({ title: req.body.title })

	if (existingCat) {
		return res.status(400).json({
			errorMessage: `Category with title ${existingCate} exists`,
		})
	}

	const category = await Category.create({
		title: req.body.title,
		user: user.id,
	})

	if (!category) {
		throw new Error(" Failed to create category")
	}

	res.status(201).json({ message: "Category created", category: category })
}

exports.getCategories = async (req, res) => {
	const categories = await Category.find()

	res.json({ categories })
}

exports.getCategory = async (req, res) => {
	if (!req.params.id) {
		return res.status(404).json({
			errorMessage: "No id provided",
		})
	}
	const cat = await Category.findById(req.params.id)
	if (!cat) {
		return res.status(404).json({
			errorMessage: "Category not found",
		})
	}

	res.json({ data: cat })
}

exports.removeCategory = async (req, res) => {
	if (!req.params.id) {
		return res.status(404).json({
			errorMessage: "No id provided",
		})
	}
	const cat = await Category.findByIdAndDelete(req.params.id)
	if (!cat) {
		return res.status(404).json({
			errorMessage: "Category not found",
		})
	}

	res.json({ data: cat, message: "Category deleted" })
}
