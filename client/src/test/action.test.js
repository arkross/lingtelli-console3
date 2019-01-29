import getMockStore from 'redux-mock-store'
import {expect} from 'chai'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import * as types from '../types'
import {fetchBots} from '../actions/bot'

describe('Bot Actions', () => {
	let store, httpMock

	const flushAllPromises = () => new Promise(resolve => setImmediate(resolve))

	beforeEach(() => {
		httpMock = new MockAdapter(axios)
		const mockStore = getMockStore()
		store = mockStore({})
	})
	
	test('fetch bots', async() => {
		const mockdata = [
			{robot_name: 'testbot 1', pk: 1},
			{robot_name: 'testbot 2', pk: 2}
		]
		// given
		httpMock.onGet(`${process.env.REACT_APP_API_HOST}/member/chatbot/`).reply(200, mockdata)

		// when
		fetchBots()(store.dispatch)
		await flushAllPromises()

		// then
		expect(store.getActions()).to.deep.equal([
			{
				type: types.FETCH_ALL_BOTS,
				bots: mockdata
			}
		])
	})

	test('fetch bot details', async() => {
		const mockdata = {
			robot_name: 'testbot 1',
			pk: 1,
			user: 'alex@lingtelli.com'
		}

		// given
		httpMock.onGet(`${process.env.REACT_AP_API_HOST}/member/chatbot/${mockdata.pk}/`).reply(200, mockdata)

	})
})