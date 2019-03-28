import * as types from '../types'
import api from '../apis/taskbot'
import _ from 'lodash'

export const actionFetchTaskbots = data => ({
	type: types.FETCH_TASKBOTS,
	data
})

export const actionFetchTaskbot = (id, data) => ({
	type: types.FETCH_TASKBOT,
	id,
	data
})

export const fetchTaskbots = () => dispatch => api.list()
	.then(data => {
		const promises = _.map(data, bot => api.info(bot.id))
		return Promise.all(promises).then(result => {
			dispatch(actionFetchTaskbots(result))
		})
	})

export const fetchTaskbot = id => dispatch => api.info(id)
	.then(data => dispatch(actionFetchTaskbot(id, data)))

export const createTaskbot = data => dispatch => api.create(data)
	.then(result => result)

export const updateTaskbot = (id, data) => dispatch => api.update(id, data)
	.then(result => result)

export const deleteTaskbot = id => dispatch => api.delete(id)
	.then(result => result)

export const confirmDeleteTaskbot = password => dispatch => api.confirmDelete(password)
	.then(result => result)

