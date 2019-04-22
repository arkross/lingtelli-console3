import axios from 'axios'

const API_HOST = process.env.REACT_APP_API_HOST

export default {
	info: async () => (await axios.get(`${API_HOST}/member/`)).data,
  
	getId: async () => (await axios.get(`${API_HOST}/member/`)).data,

	detail: async id => (await axios.get(`${API_HOST}/member/${id}/`)).data,

	packages: async () => (await axios.get(`${API_HOST}/paidtype/`)).data,

	createPackage: async (data) => (await axios.post(`${API_HOST}/paidtype/`, data)).data,

	updatePackage: async (id, data) => (await axios.put(`${API_HOST}/paidtype/${id}/`, data)).data,

	deletePackage: async id => (await axios.delete(`${API_HOST}/paidtype/${id}/`)).data,

	edit: async (id, data) => (await axios.put(`${API_HOST}/member/${id}/`, {
		username: data.username,
		first_name: data.first_name,
		language: data.language,
		old_password: data.old_password,
		password: data.password
	})).data,
  
	resetPassword: async (id, data) => (await axios.put(`${API_HOST}/member/${id}/`, data)).data
}
