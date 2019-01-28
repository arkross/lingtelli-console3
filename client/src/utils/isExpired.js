import api from '../apis/auth'

export const memberIsExpired = (token = null) => {
	return api.isExpired(token)
		.then( () => {
			return false
		})
		.catch( () => {
			return true
		})
}


export const agentIsExpired = token => {
	return api.agentIsExpired(token)
		.then(() => false)
		.catch(() => true)
}