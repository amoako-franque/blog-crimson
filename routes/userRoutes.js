const express = require("express")
const {
	register,
	getUsers,
	login,
	forgottenPasswordToken,
	resetPassword,
	updateProfile,
	followUser,
	unFollowUser,
	blockUser,
	unBlockUser,
	imgCtr,
	whoViewedMyProfile,
	usersWhoViewedMyProfile,
	blockUserByAdmin,
	unBlockUserByAdmin,
} = require("../controllers/userController")
const { requireSignIn, isAdmin } = require("../middleware/authmiddleware")
const { uploadPhoto, profilePicResize } = require("../middleware/uploadImage")
const userRouter = express.Router()
//

userRouter.post("/auth/register", uploadPhoto.single("image"), register)
userRouter.post("/auth/login", login)
userRouter.get("/auth/users", getUsers)
userRouter.get("/view-profile/:userId", requireSignIn, whoViewedMyProfile)
userRouter.get("/profile/viewers", requireSignIn, usersWhoViewedMyProfile)
userRouter.put(
	"/auth/update/user/:userId",
	uploadPhoto.single("image"),
	profilePicResize,
	requireSignIn,
	updateProfile
)
userRouter.put("/follow/:userId", requireSignIn, followUser)
userRouter.put("/unfollow/:userId", requireSignIn, unFollowUser)
userRouter.put("/block/:userId", requireSignIn, blockUser)
userRouter.put("/unblock/:userId", requireSignIn, unBlockUser)
userRouter.post("/auth/reset", forgottenPasswordToken)
userRouter.put("/auth/resetPassword/:passwordToken", resetPassword)

// admin routes
userRouter.put("/admin/block/:userId", requireSignIn, isAdmin, blockUserByAdmin)
userRouter.put(
	"/admin/unblock/:userId",
	requireSignIn,
	isAdmin,
	unBlockUserByAdmin
)

module.exports = userRouter
