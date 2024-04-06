const express = require("express")
const { requireSignIn } = require("../middleware/authmiddleware")
const { makeComment } = require("../controllers/commentController")
const commentRouter = express.Router()

commentRouter.post("/add/comment/:postId", requireSignIn, makeComment)
commentRouter.post(
	"/posts/:postId/comment/:commentId",
	requireSignIn,
	makeComment
)

module.exports = commentRouter
