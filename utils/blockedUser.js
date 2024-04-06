exports.blockUser = (user) => {
	if (user?.isBlocked) {
		throw new Error(
			`Access Denied ${user?.firstName} is blocked. Contact Support Team`
		)
	}
}
