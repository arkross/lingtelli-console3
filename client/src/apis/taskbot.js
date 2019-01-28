import axios from 'axios'

const API_HOST = process.env.REACT_APP_API_HOST

export default {
	list: async () => (await axios.get(`${API_HOST}/agent/taskbot/`)).data,

	info : async id => (await axios.get(`${API_HOST}/agent/taskbot/${id}/`)).data,

	create: async data => (await axios.post(`${API_HOST}/agent/taskbot/`, data)).data,

	update: async (id, data) => (await axios.put(`${API_HOST}/agent/taskbot/${id}/`, data)).data,

	delete: async id => (await axios.delete(`${API_HOST}/agent/taskbot/${id}/`)).data,

	confirmDelete: async (id, password) => (await axios.put(`${API_HOST}/agent/taskbot/${id}/delete_confirm/`, { password })).data
}