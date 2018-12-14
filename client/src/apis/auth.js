import axios from 'axios'
import setAuth from '../utils/setAuthorizationHeader'

const API_HOST = process.env.REACT_APP_API_HOST

export default {
	/**
	 * @typedef LoginResponse
	 * @prop {string} access_token Access Token for Authorization header.
	 */

	/**
	 * Login
	 * @async
	 * @param {Object} credentials
	 * @param {Object} credentials.data
	 * @param {string} credentials.data.email
	 * @param {string} credentials.data.password
	 * @returns {Promise<LoginResponse>}
	 */
	login: async credentials => (await axios.post(`${API_HOST}/member/account/login/`, {
		username: credentials.data.email,
		password: credentials.data.password,
	})).data,

	/**
	 * Confirm user password
	 * @async
	 * @param {Object} creds
	 * @param {string} creds.username
	 * @param {string} creds.password
	 * @returns {Promise<LoginResponse>}
	 */
	confirmPassword: async creds => {
		// Remove auth header first
		const tempToken = setAuth()

		return axios.post(`${API_HOST}/member/account/login/`, creds).then(data => {
			setAuth(data.data.access_token)
			return data.data
		}, err => {
			setAuth(tempToken.replace('Bearer ', ''))
			return Promise.reject(err)
		})
	},

	confirm: async code => (await axios.post(`${API_HOST}/member/account/confirm/`, {
		code,
	})).data,

	register: async credentials => (await axios.post(`${API_HOST}/member/account/register/`, {
		username: credentials.data.email,
		password: credentials.data.password,
		first_name: credentials.data.nickname,
	})).data,

	resend: async username => (await axios.get(`${API_HOST}/member/account/resend/`, {
		params: { username },
	})).data,

	isExpired: async () => (await axios.get(`${API_HOST}/member/chatbot/`)).data,

	/**
	 * @typedef LogoutResponse
	 * @prop {string} success Success message
	 */

	/**
	 * Logout
	 * @async
	 * @returns {Promise<LogoutResponse>}
	 */
	logout: async () => (await axios.get(`${API_HOST}/member/account/logout/`)).data
}
