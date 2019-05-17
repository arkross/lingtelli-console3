import * as types from '../types'
import api from '../apis/auth'
import setAuthorizationHeader from '../utils/setAuthorizationHeader'

// login action function
export const userLoggedIn = (auth, promptKick = false) => ({
	type: types.USER_LOGGED_IN,
	auth: {
		access_token: auth.success || auth.access_token
	},
	warning: auth.warning,
	promptKick
})

export const userCancelLogin = () => ({
	type: types.USER_CANCEL_LOGIN
})

// logout action function
export const userLoggedOut = () => ({
	type: types.USER_LOGGED_OUT,
})

export const confirmEmail = () => ({
	type: types.CONFIRM_EMAIL,
})

export const resendEmail = () => ({
	type: types.RESEND_EMAIL,
})

export const userKickedOut = () => ({
	type: types.USER_KICKED
})

// a login function return a function
export const login = (credentials, kick = false) => dispatch =>
	api.login(credentials, kick)
		.then(auth => {
			if (auth.success) {
				localStorage.setItem('token', auth.success)
				setAuthorizationHeader(auth.success)
				return dispatch(userLoggedIn(auth, false))
			}
			// Account is already logged in on another platform
			dispatch(userLoggedIn(auth, true))
			return Promise.reject('Force Login')
		})

export const cancelLogin = () => dispatch =>
	dispatch(userCancelLogin())

export const kickedOut = () => dispatch =>
	dispatch(userKickedOut())

export const showKickedOut = dispatch =>
	dispatch(userKickedOut())

export const logout = () => dispatch =>
	api.logout()
		.then(() => {
			localStorage.removeItem('token')
			dispatch(userLoggedOut())
		})

export const logoutDirectly = () => (dispatch) => {
	localStorage.removeItem('token')
	dispatch(userLoggedOut())
}

export const confirm = code => dispatch =>
	api.confirm(code)
		.then(() => dispatch(confirmEmail()))

export const resend = username => dispatch =>
	api.resend(username)
		.then(() => dispatch(resendEmail()))

export const resetPass = username => dispatch =>
	api.resetPassword(username)
		.then(data => data)