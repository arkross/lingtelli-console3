import * as types from '../types'
import api from '../apis/agent'
import userApi from '../apis/user'
import setAuthorizationHeader from '../utils/setAuthorizationHeader';

export const agentLoggedIn = auth => ({
	type: types.AGENT_LOGGED_IN,
	auth: auth.success
})

export const agentLoggedOut = () => ({
	type: types.AGENT_LOGGED_OUT
})

export const agentMembers = data => ({
	type: types.FETCH_AGENT_MEMBER,
	data
})

export const agentReadMember = (id, data) => ({
	type: types.FETCH_AGENT_MEMBER_DETAIL,
	id,
	data
})

export const agentMemberUpdate = (id, data) => ({
	type: types.UPDATE_AGENT_MEMBER,
	id,
	data
})

export const agentRead = data => ({
	type: types.FETCH_AGENT,
	data
})

export const agentUpdate = data => ({
	type: types.UPDATE_AGENT,
	data
})

export const login = creds => dispatch => {
	return api.login(creds.username, creds.password)
		.then(auth => {
			localStorage.setItem('agent_token', auth.success)
			setAuthorizationHeader()
			return dispatch(agentLoggedIn(auth))
		})
}

export const logout = () => dispatch => api.logout()
	.then(() => {
		localStorage.removeItem('agent_token')
		dispatch(agentLoggedOut())
	})

export const fetchMembers = () => dispatch =>
	api.readMembers()
		.then(data => {
			dispatch(agentMembers(data))
			const promises = data.map(el => {
				return api.readMember(el.id).then(result => {
					dispatch(agentReadMember(el.id, result))
				})
			})
			return Promise.all(promises)
		})

export const updateMember = (id, data) => dispatch =>
	api.updateMember(id, data)
		.then(result => {
			dispatch(agentMemberUpdate(id, data))
		})

export const fetchAgent = () => dispatch =>
	api.read()
		.then(data => {
			dispatch(agentRead(data))
		})

export const updateAgent = (id, data) => dispatch =>
	api.update(id, data)
		.then(result => {
			dispatch(agentUpdate(data))
		})