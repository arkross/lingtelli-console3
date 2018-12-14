import api from '../apis/auth'

export default (token = null) => {
	return api.isExpired(token)
		.then( () => {
			return false
		})
		.catch( () => {
			return true
		})
}
