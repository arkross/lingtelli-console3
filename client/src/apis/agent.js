import axios from 'axios'

const API_HOST = process.env.REACT_APP_API_HOST

export default {
	login: async (username, password) => (await axios.post(`${API_HOST}/agent/login/`, {
		username, password
	})).data,

	logout: async () => await axios.get(`${API_HOST}/agent/logout/`).data,

	read: async () => (await axios.get(`${API_HOST}/agent/`)).data[0],

	create: async data => (await axios.post(`${API_HOST}/agent/`, data)).data,

	update: async (id, data) => (await axios.put(`${API_HOST}/agent/${id}/`, data)).data,

	delete: async id => (await axios.delete(`${API_HOST}/agent/${id}/`)).data,

	readMember: async id => (await axios.get(`${API_HOST}/agent/member/${id}/`)).data,

	readMembers: async () => (await axios.get(`${API_HOST}/agent/member/`)).data,

	updateMember: async (id, data) => (await axios.put(`${API_HOST}/agent/member/${id}/`, data)).data
}