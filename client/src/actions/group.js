import * as types from '../types'
import api from '../apis/group'

export const upload = () => ({
	type: types.UPLOAD_GROUPS,
})

export const fetch = (data, id, page, answer_content) => ({
	type: types.FETCH_GROUPS,
	data,
	id,
	page,
	answer_content
})

export const fetchFaqGroup = (data, botId, groupId) => ({
	type: types.FETCH_GROUP,
	data,
	id: botId,
	groupId
})

export const deleted = () => ({
	type: types.DELETE_GROUP,
})

export const training = () => ({
	type: types.TRAIN_GROUPS,
})

export const uploadGroups = (activeBot, file) => dispatch =>
	api.upload(activeBot, file).then(() => dispatch(upload()))

export const fetchGroups = (activeBot, page, answer_content='') => dispatch =>
	api.fetch(activeBot, page, answer_content).then(data => dispatch(fetch(data, activeBot, page, answer_content)))

export const deleteGroup = (activeBot, id) => dispatch =>
	api.delete(activeBot, id).then(() => dispatch(deleted()))

export const trainGroups = activeBot => dispatch =>
	api.train(activeBot).then(() => dispatch(training()))

export const fetchGroup = (activeBot, groupId) => dispatch =>
	api.fetchGroup(activeBot, groupId).then(data => dispatch(fetchFaqGroup(data, activeBot, groupId)))
