const mongoose = require("mongoose")
const Post = require("./postModel")
const Schema = mongoose.Schema

const userSchema = new Schema(
	{
		firstname: {
			type: String,
			required: [true, "firstname is required"],
			trim: true,
		},
		lastname: {
			type: String,
			required: [true, "lastname is required"],
			trim: true,
		},
		username: {
			type: String,
		},
		bio: {
			type: String,
		},
		email: {
			type: String,
			required: [true, "email is required"],
			trim: true,
			unique: true,
		},
		password: {
			type: String,
			required: [true, "password is required"],
			select: false,
			trim: true,
			min: [8, " Password should be at least 8 characters"],
		},
		profilePic: {
			img_url: {
				type: String,
			},
			public_id: {
				type: String,
			},
		},
		isBlocked: {
			type: Boolean,
			default: false,
		},
		isAdmin: {
			type: Boolean,
			default: false,
		},
		role: {
			type: String,
			enum: ["admin", "user"],
			default: "user",
		},
		viewers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		followers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],

		following: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		posts: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Post",
			},
		],
		comments: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Comment",
			},
		],
		blocked: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		password_reset_token: String,
		password_reset_token_expiry: Date,
		userAward: {
			type: String,
			enum: ["Bronze", "Silver", "Gold"],
			default: "Bronze",
		},
	},
	{ timestamps: true, toJSON: { virtuals: true } }
)

// mongoose middlewares / hooks
// pre : run the following code before saving

userSchema.pre("findOne", async function (next) {
	//populate the post
	this.populate({
		path: "posts",
	})
	//get the user id
	const userId = this._conditions._id

	//find the post created by the user
	const posts = await Post.find({ user: userId })
	//get the last post created by the user
	const lastPost = posts[posts.length - 1]

	//get the last post date
	const lastPostDate = new Date(lastPost?.createdAt)
	//get the last post date in string format
	const lastPostDateStr = lastPostDate.toDateString()
	//add virtuals to the schema
	userSchema.virtual("lastPostDate").get(function () {
		return lastPostDateStr
	})

	//------------------Check if user is inactive for 30 days------------------
	//get current date
	const currentDate = new Date()
	//get the difference between the last post date and the current date
	const diff = currentDate - lastPostDate
	//get the difference in days and return less than in days
	const diffInDays = diff / (1000 * 3600 * 24)

	if (diffInDays > 30) {
		//Add virtuals isInactive to the schema to check if a user is inactive for 30 days
		userSchema.virtual("isInactive").get(function () {
			return true
		})
		//Find the user by ID and update
		await User.findByIdAndUpdate(
			userId,
			{
				isBlocked: true,
			},
			{
				new: true,
			}
		)
	} else {
		userSchema.virtual("isInactive").get(function () {
			return false
		})
		//Find the user by ID and update
		await User.findByIdAndUpdate(
			userId,
			{
				isBlocked: false,
			},
			{
				new: true,
			}
		)
	}

	//------Last Active Date-------

	//convert to days ago, for example 1 day ago
	const daysAgo = Math.floor(diffInDays)
	//add virtuals lastActive in days to the schema
	userSchema.virtual("lastActive").get(function () {
		//check if daysAgo is less than 0
		if (daysAgo <= 0) {
			return "Today"
		}

		//check if daysAgo is equal to 1
		if (daysAgo === 1) {
			return "Yesterday"
		}
		//check if daysAgo is greater than 1
		if (daysAgo > 1) {
			return `${daysAgo} days ago`
		}
	})

	//----------------------------------------------
	//Update userAward based on the number of posts
	//--------------------------------------------
	//get the number of posts
	const numberOfPosts = posts.length
	//check if the number of posts is less than 10
	if (numberOfPosts <= 0) {
		await User.findByIdAndUpdate(
			userId,
			{
				userAward: "Bronze",
			},
			{
				new: true,
			}
		)
	}
	//check if the number of posts is greater than 10
	if (numberOfPosts > 10) {
		await User.findByIdAndUpdate(
			userId,
			{
				userAward: "Silver",
			},
			{
				new: true,
			}
		)
	}

	//check if the number of posts is greater than 20
	if (numberOfPosts > 20) {
		await User.findByIdAndUpdate(
			userId,
			{
				userAward: "Gold",
			},
			{
				new: true,
			}
		)
	}
	next()
})

//Get fullname
userSchema.virtual("fullname").get(function () {
	return `${this.firstname} ${this.lastname}`
})

//get posts count
userSchema.virtual("postCounts").get(function () {
	return this.posts?.length
})

//get followers count
userSchema.virtual("followersCount").get(function () {
	return this.followers?.length
})

//get followers count
userSchema.virtual("followingCount").get(function () {
	return this.following?.length
})

//get viewers count
userSchema.virtual("viewersCount").get(function () {
	return this.viewers?.length
})

//get blocked count
userSchema.virtual("blockedCount").get(function () {
	return this.blocked?.length
})

const User = mongoose.model("User", userSchema)

module.exports = User
