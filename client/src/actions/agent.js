import * as types from '../types'
import api from '../apis/agent'
import userApi from '../apis/user'
import setAuthorizationHeader from '../utils/setAuthorizationHeader';

export const agentLoggedIn = (auth, promptKick) => ({
	type: types.AGENT_LOGGED_IN,
	auth: auth.success,
	warning: auth.warning,
	promptKick
})

export const agentLoggedOut = () => ({
	type: types.AGENT_LOGGED_OUT
})

export const agentAllMembers = data => ({
	type: types.FETCH_AGENT_ALL_MEMBERS,
	data
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

export const login = (creds, kick) => dispatch => {
	return api.login(creds.username, creds.password, kick)
		.then(auth => {
			if (auth.success) {
				localStorage.setItem('agent_token', auth.success)
				setAuthorizationHeader()
				return dispatch(agentLoggedIn(auth, false))
			}
			dispatch(agentLoggedIn(auth, true))
			return Promise.reject('Force Login')
		})
}

export const logout = () => dispatch => api.logout()
	.then(() => {
		localStorage.removeItem('agent_token')
		dispatch(agentLoggedOut())
	})

export const fetchAllMembers = () => dispatch =>
	api.readAllMembers()
		.then(data => {
			return dispatch(agentAllMembers(data))
		})

export const fetchMembers = (page = 1, username='') => dispatch =>
	api.readMembers(page, username)
		.then(data => {
			dispatch(agentMembers(data))
			const promises = data.results.map(el => {
				return api.readMember(el.id).then(result => {
					dispatch(agentReadMember(el.id, result))
				})
			})
			return Promise.all(promises)
		})

export const fetchMember = id => dispatch =>
	api.readMember(id).then(result => {
		return dispatch(agentReadMember(id, result))
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