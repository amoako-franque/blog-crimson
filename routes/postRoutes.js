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
	timelinePosts,
} = require("../controllers/postController")
const { requireSignIn } = require("../middleware/authmiddleware")
const { uploadPhoto } = require("../middleware/uploadImage")
const { postCache } = require("../middleware/cachePosts")
const postRouter = express.Router()

postRouter.post("/post", uploadPhoto.single("image"), requireSignIn, createPost)
postRouter.get("/posts", postCache(300), getAllPosts)
postRouter.get("/user/posts", requireSignIn, getUserPosts)
postRouter.get("/user/timeline/posts", requireSignIn, timelinePosts)
postRouter.get("/posts/:postId", getPost)
postRouter.put(
	"/posts/:postId",
	uploadPhoto.single("image"),
	requireSignIn,
	updatePost
)

postRouter.put("/post/like/:postId", requireSignIn, likePost)
postRouter.put("/post/dislike/:postId", requireSignIn, dislikePost)
postRouter.delete("/post/:postId", requireSignIn, deletePost)

module.exports = postRouter
