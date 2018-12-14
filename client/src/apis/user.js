import axios from 'axios'

const API_HOST = process.env.REACT_APP_API_HOST

export default {
	info: async () => (await axios.get(`${API_HOST}/member/`)).data,
  
	getId: async () => (await axios.get(`${API_HOST}/member/account/`)).data,

	detail: async id => (await axios.get(`${API_HOST}/member/account/${id}/`)).data,

	packages: async () => (await axios.get(`${API_HOST}/member/package/`)).data,

	edit: async (id, data) => (await axios.put(`${API_HOST}/member/account/${id}/`, {
		username: data.username,
		first_name: data.first_name
	})).data,
  
	resetPassword: async (id, data) => (await axios.post(`${API_HOST}/member/account/${id}/reset_password/`, data)).data
}
