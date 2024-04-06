const nodemailer = require("nodemailer")

const sendEmail = async (data) => {
	let transporter = nodemailer.createTransport({
		host: process.env.NODEMAILER_HOST,
		service: process.env.NODEMAILER_SERVICE,
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: process.env.USER_MAIL_ID,
			pass: process.env.USER_SECRET,
		},
	})

	await transporter.sendMail({
		from: "Hey 👻 noreply@crimson.com", // sender address
		to: data.to, // list of receivers
		subject: data.subject, // Subject line
		text: data.text, // plain text body
		html: data.html, // html body
	})
	// res.status(200).json({
	// 	message: "Email sent successfully",
	// })
}

module.exports = sendEmail
