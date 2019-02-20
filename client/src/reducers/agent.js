import { fromJS, Map } from 'immutable'
import * as types from '../types'
import _ from 'lodash'

const initState = fromJS({
	profile: {},
	members: [],
	bots: []
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
					s.setIn(['members', elementKey + '', okey], fromJS(action.data[okey]))
				})
				return s
			})
		case types.FETCH_TASKBOTS:
			return state.withMutations(s => {
				_.forEach(_.groupBy(action.data, 'assign_user'), (botsGroup, userId) => {
					const elkey = s.get('members').findIndex(m => (m.get('id') + '') === (userId + ''))
					s = s.setIn(['members', elkey + '', 'bots'], fromJS(botsGroup))
				})
				return s.set('bots', fromJS(action.data))
			})
		default: return state
	}
}