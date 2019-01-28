import * as types from '../types'
import api from '../apis/auth'
import setAuthorizationHeader from '../utils/setAuthorizationHeader'

// login action function
export const userLoggedIn = auth => ({
	type: types.USER_LOGGED_IN,
	auth: {
		access_token: auth.success || auth.access_token
	}
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

// a login function return a function
export const login = credentials => dispatch =>
	api.login(credentials)
		.then((auth) => {
			localStorage.setItem('token', auth.success)
			setAuthorizationHeader()
			return dispatch(userLoggedIn(auth))
		})

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
