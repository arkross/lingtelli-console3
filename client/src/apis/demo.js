import axios from 'axios'

const DEMO_HOST = process.env.REACT_APP_DEMO_HOST

export default {
	ask: async (venderId, text) => (await axios.post(`${DEMO_HOST}/${venderId}`, {
		userId: venderId,
		type: 'message',
		message: { text },
	})).data,
	postback: async (venderId, postObj, message) => (await axios.post(`${DEMO_HOST}/${venderId}`, {
		userId: venderId,
		type: 'postback',
		message: {
			id: postObj.id,
			oriQue: postObj.oriQue,
			text: message
		}
	})).data
}
