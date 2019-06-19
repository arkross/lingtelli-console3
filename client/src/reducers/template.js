import _ from 'lodash'
import * as types from '../types'
import { fromJS } from 'immutable'

const initState = fromJS({})

export default (state = initState, action = {}) => {
	switch (action.type) {
		case types.FETCH_TEMPLATES:
			return state.withMutations(s => {
				const existingPK = s.map(el => el.get('id'))
				const toDelete = existingPK.filterNot(el => _.find(action.data, template => template.id === el))
				toDelete.forEach(el => {
					s.delete(el + '')
				})
				_.forEach(action.data, o => {
					_.forEach(o, (v, w) => {
						s.setIn([o.id + '', w], fromJS(v))
					})
				})
				return s
			})
		case types.FETCH_TEMPLATE:
			return state.set(action.templateId + '', fromJS(action.data))
		case types.FETCH_TEMPLATE_FAQ_GROUPS:
			return state.setIn([action.templateId + '', 'group'], fromJS(action.data))
		case types.FETCH_TEMPLATE_FAQ_GROUP:
			const idx = state.getIn([action.templateId + '', 'group', 'results']).findIndex(el => el.get('group') === action.groupId)
			return state.setIn([action.templateId + '', 'group', 'results', idx], fromJS(action.data))
		case types.FETCH_TEMPLATE_FIELDS:
			return state.setIn([action.templateId + '', 'fields'], fromJS(action.data.fields))
		default: return state
	}
}