const mongoose = require("mongoose")

//create schema
const postSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, "Post Title is required"],
			trim: true,
		},
		description: {
			type: String,
			required: [true, "Post description is required"],
		},
		category: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Category",
			required: [true, "Post category is required"],
		},
		numViews: {
			type: Number,
			default: 0,
		},
		views: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		likes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		disLikes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		comments: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Comment",
			},
		],
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: [true, "Please Author is required"],
		},
		post_image: {
			img_url: {
				type: String,
			},
			public_id: {
				type: String,
			},
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
	}
)
const Post = mongoose.model("Post", postSchema)
module.exports = Post
