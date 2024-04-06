const express = require("express")
const {
	createPost,
	getAllPosts,
	getPost,
	updatePost,
	deletePost,
	likePost,
	getUserPosts,
	dislikePost,
} = require("../controllers/postController")
const { requireSignIn } = require("../middleware/authmiddleware")
const { uploadPhoto } = require("../middleware/uploadImage")
const postRouter = express.Router()

postRouter.post(
	"/post/add-post",
	uploadPhoto.single("image"),
	requireSignIn,
	createPost
)
postRouter.get("/post/posts", requireSignIn, getAllPosts)
postRouter.get("/user/posts", requireSignIn, getUserPosts)
postRouter.get("/post/posts/:postId", getPost)
postRouter.put(
	"/post/posts/:postId",
	uploadPhoto.single("image"),
	requireSignIn,
	updatePost
)

postRouter.put("/post/like/:postId", requireSignIn, likePost)
postRouter.put("/post/dislike/:postId", requireSignIn, dislikePost)
postRouter.delete("/post/posts/:postId", requireSignIn, deletePost)

module.exports = postRouter
