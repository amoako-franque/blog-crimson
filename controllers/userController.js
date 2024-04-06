const User = require("../models/userModel")
const crypto = require("crypto")
const bcrypt = require("bcrypt")
const { createJwtToken, generateResetToken } = require("../utils/generateToken")
const sendEmail = require("../utils/sendEmail")
const cloudinary = require("../utils/cloudinary")
const { validateMongoDbId } = require("../utils/validateMongodbId")
const path = require("path")
const fs = require("fs")

/**
 * @access Public
 * @url http://localhost:8000/register
 * @method POST
 * @description Create a new user and stores user data in the database
 */

exports.register = async (req, res, next) => {
	const { email, password, firstname, lastname } = req.body

	if (!email || !firstname || !lastname || !password) {
		res.json({ error: "All fields are required" })
		return false
	}

	if (password && password.length <= 7) {
		throw new Error("Password must be at least 8 characters")
	}

	//  check if user with email exists
	const existingUser = await User.findOne({ email })
	if (existingUser) {
		return res.status(400).json({ message: "User already exists" })
	}

	if (!req.file) {
		try {
			const salt = await bcrypt.genSalt(10)
			const hashedPassword = await bcrypt.hash(password, salt)

			const user = await User.create({
				password: hashedPassword,
				firstname,
				email,
				lastname,
			})

			res.status(201).json({
				message: "Account created. Please login with your credentials.",
				data: user,
			})
		} catch (error) {
			next(error)
		}
	}

	// user uploaded their profile pic

	const result = await cloudinary.uploader.upload(req?.file?.path, {
		folder: "profile_pics",
	})

	try {
		const salt = await bcrypt.genSalt(10)
		const hashedPassword = await bcrypt.hash(password, salt)

		const user = await User.create({
			password: hashedPassword,
			firstname,
			email,
			lastname,
			profilePic: {
				img_url: result.secure_url,
				public_id: result.public_id,
			},
		})
		res.status(201).json({
			message: "Account created. Please login with your credentials.",
			data: user,
		})
	} catch (error) {
		next(error)
	}
}

exports.login = async (req, res, next) => {
	const { email, password } = req.body
	if (!email || !password) {
		return res.status(400).json({ message: "All fields are required" })
	}

	//  check if user with email exists
	const user = await User.findOne({ email }).select("+password")

	if (!user) {
		// throw new Error(" could not find user")
		return res.status(400).json({ errorMessage: "Invalid user credentials" })
	}

	try {
		const isMatch = await bcrypt.compare(password, user.password)
		if (!isMatch) {
			return res.status(400).json({ message: "Invalid credentials" })
		}

		user.password = undefined

		//  generate jwt token

		const token = createJwtToken(user?._id, user?.email, user?.role)

		res.cookie("userToken", token, {
			httpOnly: true, //accessible only by web server
			secure: true, //https
			sameSite: "None", //cross-site cookie
			maxAge: 1 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rf
		})

		res.status(200).json({
			message: "Login successful",
			data: token,
			user_fullname: user,
		})
	} catch (error) {
		next(error)
	}
}

exports.whoViewedMyProfile = async (req, res, next) => {
	// check if user is blocked
	// step __ : check if the user has blocked you or you have blocked him/her

	try {
		// step one :  find the user who is viewing the profile
		const whoViewedMyProfile = req?.auth
		if (!whoViewedMyProfile) {
			res
				.status(401)
				.json({ errorMessage: " Please login to view users profile" })
			return false
		}
		const userId = req.params.userId

		validateMongoDbId(userId)

		// step two :  find the profile of the user we are viewing his/her profile
		const user = await User.findById(userId)

		// step three : check if user exists
		if (!user) {
			res.status(404).json({ errorMessage: "User not found" })
			return false
		}

		// step four : make sure that the person viewing is the viewing his/her own profile
		if (whoViewedMyProfile.id.toString() === user.id.toString()) {
			res.status(200).json({ success: true, data: user })
			return
		}

		// step five : check if both users exist
		if (user && whoViewedMyProfile) {
			// step six:  check if whoViewedMyProfile is not already in the viewers array
			const hasAlreadyViewed = user.viewers.find(
				(viewerId) => viewerId.toString() === whoViewedMyProfile.id.toString()
			)

			if (hasAlreadyViewed) {
				return res.status(200).json({ data: user })
			} else {
				// step seven:  if not, push whoViewedMyProfile's id to the viewers array
				user.viewers.push(whoViewedMyProfile.id)

				await user.save()

				res.status(200).json({ success: true, data: user })
			}
		}
	} catch (error) {
		next(error)
	}
}

exports.usersWhoViewedMyProfile = async (req, res) => {
	const user = req?.auth

	const profileViewers = await User.findById(user.id)
		.select("viewers")
		.populate("viewers", "firstname lastname")
	res.json({ profileViewers })
}

exports.getUsers = async (req, res) => {
	const user = req?.auth

	const users = await User.find().sort({ createdAt: -1 })

	// if (user.isBlocked) {
	// 	throw new Error(` Hi ${user.firstname}, you are blocked from this app.`)
	// }
	res.json({ users })
}

exports.forgottenPasswordToken = async (req, res, next) => {
	const { email } = req.body

	const user = await User.findOne({ email })

	if (!user) {
		return res.status(400).json({ error: "User not found with this email" })
	}

	try {
		const resetToken = await generateResetToken(user)
		await user.save()

		const emailUrl = `Hi, Please use click on this link to reset your password.
        Token will expire in 10 minutes
        <a href="http://localhost:8000/api/v1/auth/resetPassword/${resetToken}">Reset Password</a>
        `

		const data = {
			to: user.email,
			text: `Hello ${user.firstname}`,
			subject: "Password reset link",
			html: emailUrl,
		}

		await sendEmail(data)
		res.status(202).json({
			message:
				"A token has been sent to the email provided with instructions to reset your password. Token expires in 10 minutes",
		})
	} catch (err) {
		next(err)
	}
}

exports.resetPassword = async (req, res) => {
	const { passwordToken } = req.params // 123456
	const newPassword = req.body.password

	const hashedToken = crypto
		.createHash("sha256")
		.update(passwordToken)
		.digest("hex")

	const user = await User.findOne({
		password_reset_token: hashedToken,
		password_reset_token_expiry: { $gt: Date.now() },
	}).select("+password")

	if (!user) {
		res.status(400).json({ errorMessage: "Token Expired. Please try again" })
		return false
	}

	const salt = await bcrypt.genSalt(10)
	const hashedPassword = await bcrypt.hash(newPassword, salt)

	user.password = hashedPassword

	user.password_reset_token = undefined
	user.password_reset_token_expiry = undefined

	await user.save()

	res.status(202).json({
		message: "Password reset successful. Please login with your new password",
	})
}

exports.updateProfile = async (req, res, next) => {
	const user = req?.auth

	const userId = req.params.userId

	if (!user) {
		res.status(400).json({ errorMessage: "You can't update this user" })
		return false
	}

	if (user?.id?.toString() !== userId?.toString()) {
		return res.status(400).json({
			errorMessage: "Invalid user credentials. Please login to update password",
		})
	}

	try {
		const updateInfo = {}

		if (req.body.firstname) {
			updateInfo.firstname = req.body.firstname
		}

		if (req.body.lastname) {
			updateInfo.lastname = req.body.lastname
		}

		if (req.body.bio) {
			updateInfo.bio = req.body.bio
		}

		if (req?.file) {
			const { public_id } = user?.profilePic

			if (public_id) {
				await cloudinary.uploader.destroy(public_id)
			}

			const localPath = `public/images/profile/${req.file.filename}`
			const result = await cloudinary.uploader.upload(localPath, {
				folder: "profile_pics",
			})

			fs.unlinkSync(localPath)

			updateInfo.profilePic.img_url = result.secure_url
			updateInfo.profilePic.public_id = result.public_id
		}

		const updatedUser = await User.findByIdAndUpdate(
			{ _id: user.id },
			{ $set: updateInfo },
			{
				new: true,
				upsert: true,
			}
		)

		res.json({ message: "Profile updated successfully", user: updatedUser })
	} catch (error) {
		next(error)
	}
}

exports.deleteUser = async (req, res, next) => {
	const id = req.params.id

	validateMongoDbId(id)
	const user = req?.auth

	if (!user) {
		res.status(401).json({ message: "You are not logged in" })
		return false
	}

	try {
		if (user?._id?.toString() !== id?.toString()) {
			res
				.status(400)
				.json({ message: " You are not authorized to delete this post" })
			return false
		}

		const { public_id } = user?.profilePic

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

exports.followUser = async (req, res) => {
	const loggedInUser = req?.auth

	if (!loggedInUser) {
		res.status(401).json({ message: "You must be logged in to follow users" })
		return false
	}

	const followId = req.params.userId

	validateMongoDbId(followId)

	const followingAlready = loggedInUser?.following?.includes(followId)
	if (followingAlready) {
		res.status(400).json({ message: "You are already following this user" })
		return false
	}

	const user = await User.findByIdAndUpdate(
		followId,
		{
			$push: { followers: loggedInUser._id },
		},
		{ new: true }
	)

	await User.findByIdAndUpdate(
		loggedInUser._id,
		{
			$push: { following: followId },
		},
		{ new: true }
	)

	res.status(200).json({ message: `You have followed ${user.firstname}` })
}

exports.unFollowUser = async (req, res) => {
	const loggedInUser = req?.auth

	if (!loggedInUser) {
		res.status(401).json({ message: "You must be logged in to follow users" })
		return false
	}

	const followId = req.params.userId

	validateMongoDbId(followId)

	const user = await User.findByIdAndUpdate(
		followId,
		{
			$pull: { followers: loggedInUser._id },
		},
		{ new: true }
	)

	await User.findByIdAndUpdate(
		loggedInUser._id,
		{
			$pull: { following: followId },
		},
		{ new: true }
	)

	res.status(200).json({ message: `You have unfollowed ${user.firstname}` })
}

exports.blockUser = async (req, res) => {
	const loggedInUser = req?.auth

	if (!loggedInUser) {
		res.status(401).json({ message: "You must be logged in to block users" })
		return false
	}

	const blockId = req.params.userId

	validateMongoDbId(blockId)

	const blockedAlready = loggedInUser?.blocked?.includes(blockId)
	if (blockedAlready) {
		res.status(400).json({ message: "You have already blocked this user" })
		return false
	}

	await User.findByIdAndUpdate(
		loggedInUser._id,
		{
			$push: { blocked: blockId },
		},
		{ new: true }
	)

	res.status(200).json({ message: `You have blocked` })
}

exports.unBlockUser = async () => {
	const loggedInUser = req?.auth
	if (!loggedInUser) {
		res.status(401).json({ message: "You must be logged in to unblock users" })
		return false
	}

	const blockId = req.params.userId

	validateMongoDbId(blockId)

	await User.findByIdAndUpdate(
		loggedInUser._id,
		{
			$pull: { blocked: blockId },
		},
		{ new: true }
	)

	res.status(200).json({ message: `You have unblocked this user` })
}

exports.blockUserByAdmin = async (req, res, next) => {
	const userId = req.params.userId

	validateMongoDbId(userId)

	try {
		const user = await User.findById(userId)

		if (!user) {
			res.status(404).json({ message: "User not found" })
			return false
		}

		user.isBlocked = true
		await user.save()

		res.status(200).json({ message: `${user.firstname} has been blocked` })
	} catch (error) {
		next(error)
	}
}

exports.unBlockUserByAdmin = async (req, res, next) => {
	const userId = req.params.userId

	validateMongoDbId(userId)

	try {
		const user = await User.findById(userId)

		if (!user) {
			res.status(404).json({ message: "User not found" })
			return false
		}

		user.isBlocked = false
		await user.save()

		res.status(200).json({ message: `${user.firstname} has been unblocked` })
	} catch (error) {
		next(error)
	}
}

exports.imgCtr = async (req, res, next) => {
	const localPath = `public/images/profile/${req.file.filename}`

	try {
		const result = await cloudinary.uploader.upload(localPath, {
			folder: "images-profile",
		})

		fs.unlinkSync(localPath)
		res.json({ result: result.secure_url })
	} catch (error) {
		next(error)
	}
}
