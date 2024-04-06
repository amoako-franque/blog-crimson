const Post = require("../models/postModel")
const User = require("../models/userModel")
const { validateMongoDbId } = require("../utils/validateMongodbId")

exports.createPost = async (req, res) => {
	const user = req?.auth
	const { title, description, categoryId } = req.body

	// if (!title || !description || !categoryId) {
	// 	return res.status(400).json({ message: "All fields are required" })
	// }

	const requiredFields = [
		{ field: title, message: "Title is required" },
		{ field: description, message: "Description is required" },
		{ field: categoryId, message: "category id is required" },
	]

	for (const { field, message } of requiredFields) {
		if (!field) {
			res.status(400).json({ message })
			return false
		}
	}

	const post = await Post.create({
		title,
		description,
		category: categoryId,
		user: user._id,
	})

	user.posts.push(post._id)

	await user.save()

	res.status(201).json({ message: "Post added successfully", post })
}

exports.getAllPosts = async (req, res) => {
	const user = req?.auth
	const posts = await Post.find({}).populate("user")

	const filteredPosts = posts.filter((post) => {
		const blockedUsers = post.user.blocked
		const isBlocked = blockedUsers.includes(user.id)

		// return isBlocked ? null : post

		return !isBlocked
	})

	// const limit = req.query.limit ? parseInt(req.query.limit) : 10
	// const page = req.query.page ? parseInt(req.query.page) : 1
	// const skip = (page - 1) * limit
	// const search = req.query.search
	// const query = {
	// 	$or: [
	// 		{ title: { $regex: search, $options: "i" } },
	// 		{ description: { $regex: search, $options: "i" } },
	// 	],
	// }
	// const posts = await Post.find(query).skip(skip).limit(limit)
	res.status(200).json({ posts })
}

exports.getUserPosts = async (req, res, next) => {
	const auth = req?.auth
	validateMongoDbId(auth.id)
	try {
		const posts = await Post.find({ user: auth.id })
		// const user = await User.findById({ id: auth.id }).populate(
		// 	"posts",
		// 	"title description"
		// )
		// if (!user) {
		// 	return res.status(404).json({ message: "User not found" })
		// }
		// const posts = await Post.find({ user: userId })
		res.status(200).json({ posts: posts })
	} catch (error) {
		next(error)
	}
}
exports.getPost = async (req, res, next) => {
	const user = req?.auth

	const postId = req.params.postId
	validateMongoDbId(postId)

	try {
		const post = await Post.findById(postId)
			.populate("category", " title")
			.populate("user", " firstname lastname")

		//  update number of views and people who viewed the post

		if (post?.numViews) {
			await Post.findByIdAndUpdate(
				{ _id: postId },
				{
					$inc: { numViews: 1 },
				},
				{ new: true }
			)
		}

		res.json({ data: post })
	} catch (error) {
		next(error)
	}
}

exports.deletePost = async (req, res, next) => {
	const id = req.params.postId

	validateMongoDbId(id)
	const user = req?.auth

	if (!user) {
		res.status(401).json({ message: "You are not logged in" })
		return false
	}

	try {
		const post = await Post.findById(id)

		if (post === null || !post) {
			res.status(404).json({ message: "Post not found" })
			return false
		}

		// check if post belongs to the user => current logged in user

		if (post?.user?.toString() !== user?.id?.toString()) {
			res
				.status(400)
				.json({ message: " You are not authorized to delete this post" })
			return false
		}
		// post_image: {
		// 			img_url: {
		// 				type: String,
		// 			},
		// 			public_id: {
		// 				type: String,
		// 			},
		// },

		const { public_id } = post?.post_image

		if (public_id) {
			await cloudinary.uploader.destroy(public_id)
		}

		await User.findByIdAndUpdate(
			{ _id: user.id },
			{
				$pull: { post: id },
			},
			{
				new: true,
			}
		)

		await Post.findByIdAndDelete(id).exec()

		res.status(200).json({ message: "Post deleted successfully" })
	} catch (error) {
		next(error)
	}
}

exports.updatePost = async (req, res, next) => {
	const id = req.params.postId

	validateMongoDbId(id)
	const user = req?.auth

	if (!user) {
		res.status(401).json({ message: "You are not logged in" })
		return false
	}

	try {
		const post = await Post.findById(id)

		if (post === null || !post) {
			res.status(404).json({ message: "Post not found" })
			return false
		}

		// check if post belongs to the user => current logged in user

		if (post?.user?.toString() !== user?.id?.toString()) {
			res
				.status(400)
				.json({ message: " You are not authorized to delete this post" })
			return false
		}

		const { title, description, categoryId } = req.body

		// run your validation here
		//.. code
		post.title = title || post.title
		post.description = description || post.description
		post.category = categoryId || post.category

		if (req.file) {
			console.log("hi from req.file")
			const { public_id } = post?.post_image

			if (public_id) {
				await cloudinary.uploader.destroy(public_id)
			}

			const result = await cloudinary.uploader.upload(req?.file?.path, {
				folder: "posts_images",
			})

			post.post_image = {
				img_url: result.img_url,
				public_id: result.public_id,
			}

			post.title = title || post.title
			post.description = description || post.description
			post.category = categoryId || post.category

			await post.save()

			return res.json({ message: "Post updated" })
		}

		post.title = title || post.title
		post.description = description || post.description
		post.category = categoryId || post.category

		await post.save()

		res.status(200).json({ message: "Post updated successfully" })
	} catch (error) {
		next(error)
	}
}

exports.likePost = async (req, res, next) => {
	const { postId } = req.params
	const user = req?.auth

	validateMongoDbId(postId)

	try {
		const post = await Post.findById(postId)

		if (!post) {
			return res.status(404).json({ message: "Post not found" })
		}

		if (post.likes.includes(user._id)) {
			const post = await Post.findByIdAndUpdate(
				postId,
				{ $pull: { likes: user._id } },
				{ new: true }
			)
			res.status(200).json({ message: "Like removed ", post: post })
			return
		}

		const likedPost = await Post.findByIdAndUpdate(
			{ _id: postId },
			{ $push: { likes: user._id } },
			{ new: true }
		)

		res.status(200).json({ message: "Post liked", post: likedPost })
	} catch (error) {
		next(error)
	}
}

exports.dislikePost = async (req, res, next) => {
	const { postId } = req.params
	const user = req?.auth

	validateMongoDbId(postId)

	try {
		const post = await Post.findById(postId)

		if (!post) {
			return res.status(404).json({ message: "Post not found", post })
		}

		if (post.disLikes.includes(user._id)) {
			const post = await Post.findByIdAndUpdate(
				{ _id: postId },
				{ $pull: { disLikes: user._id } },
				{ new: true }
			)
			res.status(200).json({ message: "Dislike removed", post: post })
			return
		}

		const dislikedPost = await Post.findByIdAndUpdate(
			{ _id: postId },
			{ $push: { dislikes: user._id } },
			{ new: true }
		)

		res.status(200).json({ message: "Post liked", post: dislikedPost })
	} catch (error) {
		next(error)
	}
}
