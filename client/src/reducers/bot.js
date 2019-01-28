import _ from 'lodash'
import moment from 'moment'
import { fromJS } from 'immutable'
import * as types from '../types'

const initState = fromJS({
	info: {
		robot_name: '',
		platform: ''
	},
	bots: {},
	supportPlatforms: []
})

export default function bot(state = initState, action = {}) {
	switch (action.type) {
	case types.FETCH_ALL_BOTS: {
		return state.withMutations(s => {
			const existingPK = s.get('bots').map(el => el.get('id'))
			const toDelete = existingPK.filterNot(el => _.find(action.bots, bot => bot.id === el))
			toDelete.forEach(el => {
				s.deleteIn(['bots', el + ''])
			})
			_.forEach(action.bots, o => {
				_.forEach(o, (v, w) => {
					s.setIn(['bots', o.id + '', w], fromJS(v))
				})
			})
			return s
		})
	}
	case types.FETCH_BOT_INFO: {
		return state.withMutations(s => {
			s.set('info', fromJS(action.info))
			_.forEach(action.info, (o, k) => {
				s.setIn(['bots', action.info.activeBot + '', k], fromJS(o))
			})
			return s
		})
	}
	case types.FETCH_BOT_HISTORY:
		return state.setIn(['bots', action.id + '', 'histories'], fromJS(action.histories))
	case types.FETCH_BOT_MATCHING:
		return state.setIn(['bots', action.id + '', 'recomlog'], fromJS(action.data))
	case types.FETCH_BOT_REPORT: {
		const newData = _.chain(action.report)
			.filter(el => el.date)
			.sortBy(el => moment(el.date, 'YYYY/MM/DD').valueOf())
			.value()
		const check = state.getIn(['bots', action.id + '', 'report'])
		const totalStat = _.chain(action.report)
			.find(el => !el.date)
			.value()
		if (check) {
			return state.withMutations(s => s
				.setIn(['bots', action.id + '', 'reportStat'], fromJS(totalStat))
				.updateIn(['bots', action.id + '', 'report'], curState => curState
					.concat(fromJS(newData))
					.groupBy(el => el.get('date'))
					.map(el => el.last())
					.toList())
			)
		}
		return state.withMutations(s => s
			.setIn(['bots', action.id + '', 'report'], fromJS(newData))
			.setIn(['bots', action.id + '', 'reportStat'], fromJS(totalStat)))
	}
	case types.FETCH_GROUPS: {
		return state.setIn(['bots', action.id + '', 'group', 'groups'], fromJS(action.data))
	}
	case types.FETCH_GROUP_LENGTH: {
		return state.setIn(['bots', action.id + '', 'group', 'length'], action.length)
	}
	case types.FETCH_GROUP: {
		const idx = state.getIn(['bots', action.id + '', 'group', 'groups']).findIndex(el => el.get('group') == action.groupId)
		return state.setIn(['bots', action.id + '', 'group', 'groups', idx], fromJS(action.data))
	}
	case types.FETCH_SUPPORT_PLATFORMS:
		return state.set('supportPlatforms', fromJS(action.platforms))
	case types.CREATE_BOT:
		return state
	case types.UPDATE_BOT:
		return state.withMutations(s => {
			_.forEach(action.data, (o, k) => {
				s.setIn(['bots', action.id + '', k], fromJS(o))
					.setIn(['info', k], fromJS(o))
			})
			return s
		})
	case types.DELETE_BOT:
		return state.setIn(['info', 'activeBot'], -1)
	case types.FETCH_FACEBOOK:
		return state.setIn(['bots', action.id + '', 'facebook'], fromJS(action.data))
	case types.FETCH_LINE:
		return state.setIn(['bots', action.id + '', 'line'], fromJS(action.data))
	default:
		// TODO: wired here: because close create bot page will
		//       reset activebot.
		return state
	}
}
