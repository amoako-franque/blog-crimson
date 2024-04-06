const Comment = require("../models/commentModel")
const Post = require("../models/postModel")

exports.makeComment = async (req, res, next) => {
	// step one user should sign in
	const user = req?.auth

	if (!user) {
		res.status(403).json({ errorMessage: "User not logged in" })
		return false
	}

	// step two get the post id from the request params
	const id = req.params.postId

	try {
		const post = await Post.findById(id)

		const content = req.body.description

		const comment = await Comment.create({
			post: id,
			user: user.id,
			description: content,
		})

		post.comments.push(comment._id)

		await post.save()

		res.status(201).json({ message: "Comment created successfully" })
	} catch (error) {
		next(error)
	}
}

exports.quoteComment = async (req, res) => {
	const user = req?.auth

	if (!user) {
		return res.status(403).json({ errorMessage: "User not logged" })
	}

	const { postId, commentId } = req.params

	const comment = await Comment.findOne({ _id: commentId, post: postId })

	comment.comments.push({
		post: postId,
		user: user.id,
		description: req.body.description,
	})

	await comment.save()
}

// deleting a comment
// updating a comment
// fetching all comments for a posts
