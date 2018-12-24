import axios from 'axios'

const API_HOST = process.env.REACT_APP_API_HOST

export default {
	info: async () => (await axios.get(`${API_HOST}/member/`)).data,
  
	getId: async () => (await axios.get(`${API_HOST}/member/`)).data,

	detail: async id => (await axios.get(`${API_HOST}/member/${id}/`)).data,

	packages: async () => (await axios.get(`${API_HOST}/paidtype/`)).data,

	edit: async (id, data) => (await axios.put(`${API_HOST}/member/${id}/`, {
		username: data.username,
		first_name: data.first_name,
		language: data.language
	})).data,
  
	resetPassword: async (id, data) => (await axios.put(`${API_HOST}/member/${id}/reset_password/`, data)).data
}
