import * as types from '../types'
import api from '../apis/bot'
import { showNetworkErrorRaw as showNetworkError } from './message'
import { fetchGroups } from './group'
import _ from 'lodash'

// fetch all bots for user
export const fetchAllBots = bots => ({
	type: types.FETCH_ALL_BOTS,
	bots,
})
// fetch a specific bot information
export const fetchBotInfo = info => ({
	type: types.FETCH_BOT_INFO,
	info,
})

export const fetchBotHistory = (histories,id) => ({
	type: types.FETCH_BOT_HISTORY,
	histories,
	id
})

export const fetchBotMatching = (data, id, page) => ({
	type: types.FETCH_BOT_MATCHING,
	data,
	id
})

export const fetchBotReport = (report, id) => ({
	type: types.FETCH_BOT_REPORT,
	report,
	id
})

export const fetchSupportPlatforms = platforms => ({
	type: types.FETCH_SUPPORT_PLATFORMS,
	platforms,
})

export const createTheBot = () => ({
	type: types.CREATE_BOT,
})

export const updateTheBot = (botId, data) => ({
	type: types.UPDATE_BOT,
	id: botId,
	data
})

export const deleteTheBot = () => ({
	type: types.DELETE_BOT,
})

export const fetchBot = (botId) => dispatch =>
	api.info(botId)
		.then( info => {
			info.activeBot = botId
			dispatch(fetchBotInfo(info))
			return Promise.resolve(info)
		})
// .catch(err => {
//   if (err.response) {
//     showBotError(dispatch)
//     return Promise.reject({message: err.response.data.detail})
//   }
//   else if (err.request) {
//     showNetworkError(dispatch)
//     return Promise.reject({message: err.request.statusText})
//   }
//   return Promise.reject(err)
// })

export const fetchPlatforms = () => dispatch =>
	api.platforms()
		.then(platforms => dispatch(fetchSupportPlatforms(platforms)))

export const fetchBots = () => dispatch =>
	api.list()
		.then(bots => dispatch(fetchAllBots(bots)), err => {
			if (! err.response) {
				showNetworkError(dispatch)
			}
			return Promise.reject(err)
		})

export const fetchHistory = (activeBot, currentPage = 1) => dispatch =>
	api.history(activeBot, currentPage)
		.then(histories => dispatch(fetchBotHistory(histories, activeBot, currentPage)))

export const fetchMatching = (activeBot, currentPage = 1) => dispatch =>
	api.matching(activeBot, currentPage)
		.then(data => dispatch(fetchBotMatching(data, activeBot, currentPage)))

export const fetchAllBotDetails = () => async (dispatch) => {
	const bots = await api.list()
	dispatch(fetchAllBots(bots))
	return Promise.all(_.map(bots, bot => {
		api.info(bot.id).then(data => {
			data.activeBot = bot.id
			// Also fetch FAQ to get the counts
			fetchGroups(bot.id, 1)(dispatch)
			dispatch(fetchBotInfo(data))
		})
		return api.report(bot.id).then(data => dispatch(fetchBotReport(data, bot.id)))
	}))
}

export const fetchReport = (activeBot, days) => dispatch =>
	api.report(activeBot, days)
		.then(report => dispatch(fetchBotReport(report, activeBot)))

/**
 * @typedef BotInfo
 * @prop {string} robot_name
 * @prop {string} failed_msg
 * @prop {string} greeting_msg
 * @prop {string} postback_title
 * @prop {string} language "tw", "cn", "en"
 * @prop {Object} [facebook]
 * @prop {string} facebook.token
 * @prop {string} facebook.verify_str
 * @prop {Object} [line]
 * @prop {string} line.token
 * @prop {string} line.secret
 * @prop {string} [package]
 * @prop {Array<number>} [platform]
 */

/**
 * Creates a new bot
 * @param {BotInfo} data Populated data
 * @returns {function}
 */
export const createBot = data => dispatch =>
	api.create(data)
		.then(() => dispatch(createTheBot()))

/**
 * Updates bot info
 * @param {number} botId Bot Primary Key
 * @param {BotInfo} data Populated data
 * @returns {function}
 */
export const updateBot = (botId, data) => dispatch =>
	api.update(botId, data)
		.then(() => dispatch(updateTheBot(botId, data)))

/**
 * Deletes a bot
 * @param {number} botId Bot Primary key
 * @returns {function}
 */
export const deleteBot = botId => dispatch =>
	api.delete(botId)
		.then(() => dispatch(deleteTheBot()))
