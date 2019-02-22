import axios from 'axios'

const API_HOST = process.env.REACT_APP_API_HOST

export default {
	create: async (activeBot, gid, content='') => (await axios.post(`${API_HOST}/chatbot/${activeBot}/answer/`, {
		group: gid,
		content,
	})).data,

	update: async (activeBot, payload) => (await axios.put(`${API_HOST}/chatbot/${activeBot}/answer/${payload.id}/`, {
		content: payload.content.replace(',', '，'),
	})).data,

	delete: async (activeBot, id) => (await axios.delete(`${API_HOST}/chatbot/${activeBot}/answer/${id}/`)).data
}
