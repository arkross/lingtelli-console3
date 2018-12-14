import axios from 'axios'

const API_HOST = process.env.REACT_APP_API_HOST

export default {
	create: async (activeBot, gid) => (await axios.post(`${API_HOST}/member/chatbot/${activeBot}/question/`, {
		group: gid,
		content: '',
	})).data,

	update: async (activeBot, payload) => (await axios.put(`${API_HOST}/member/chatbot/${activeBot}/question/${payload.id}/`, {
		content: payload.content,
	})).data,

	delete: async (activeBot, id) => (await axios.delete(`${API_HOST}/member/chatbot/${activeBot}/question/${id}/`)).data
}
