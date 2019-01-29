import { fromJS, Map } from 'immutable'
import * as types from '../types'
import _ from 'lodash'

const initState = fromJS({
	profile: {},
	members: []
})

/**
 * Agent Reducer function
 * @param {Map} state 
 * @param {Object} action 
 */
export default function(state = initState, action) {
	let elementKey = ''
	switch(action.type) {
		case types.FETCH_AGENT:
			return state.set('profile', fromJS(action.data))
		case types.FETCH_AGENT_MEMBER:
			return state.set('members', fromJS(action.data))
		case types.FETCH_AGENT_MEMBER_DETAIL:
			elementKey = state.get('members').findKey(el => action.id === el.get('id'))
			return state.withMutations(s => {
				Object.keys(action.data).forEach(okey => {
					s.setIn(['members', elementKey + '', okey], action.data[okey])
				})
				return s
			})
		case types.FETCH_TASKBOTS:
			return state.withMutations(s => {
				_.chain(action.data)
					.groupBy('user')
					.forEach((userId, botsGroup) => {
						const elkey = s.get('member').ifndKey(m => (m.id + '') === (userId + ''))
						s.setIn(['members', elkey + '', 'bots'], botsGroup)
					})
				return s
			})
		default: return state
	}
}