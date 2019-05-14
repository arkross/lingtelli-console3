import axios from 'axios'

const API_HOST = process.env.REACT_APP_API_HOST

export default {
	login: async (username, password, kick = false) => (await axios.post(`${API_HOST}/agent/login/`, {
		username, password, kick
	})).data,

	logout: async () => await axios.get(`${API_HOST}/agent/logout/`).data,

	read: async () => (await axios.get(`${API_HOST}/agent/`)).data[0],

	create: async data => (await axios.post(`${API_HOST}/agent/`, data)).data,

	update: async (id, data) => (await axios.put(`${API_HOST}/agent/${id}/`, data)).data,

	delete: async id => (await axios.delete(`${API_HOST}/agent/${id}/`)).data,

	readMember: async id => (await axios.get(`${API_HOST}/agent/member/${id}/`)).data,

	readMembers: async (page = 1, username='') => (await axios.get(`${API_HOST}/agent/member/`, { params: { page, username } })).data,

	readAllMembers: async (params = {}) => (await axios.get(`${API_HOST}/agent/member/list_all_member/`, { params })).data,

	updateMember: async (id, data) => (await axios.put(`${API_HOST}/agent/member/${id}/`, data)).data
}