import axios from 'axios'
import authApi from '../apis/auth'
import botApi from '../apis/bot'
import groupApi from '../apis/group'
import userApi from '../apis/user'
import httpAdapter from 'axios/lib/adapters/http'
import {expect} from 'chai'

axios.defaults.adapter = httpAdapter
const credential = {
	email: 'jhowliu@lingtelli.com',
	password: 'jhow'
}
let bots = []
describe('AuthAPI', () => {
	test('should login', async () => {
		const response = await authApi.login({data: credential})
		expect(response).to.have.property('access_token')
		axios.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`
	})

	test('should get user details', async() => {
		const response = await userApi.getId()
		expect(response).to.be.an('array').with.lengthOf(1)
		expect(response[0]).to.have.property('id')
		expect(response[0].id).to.be.a('number')
		const userId = response[0].id
		const userDetails = await userApi.detail(userId)
		expect(userDetails).to.have.property('first_name')
		expect(userDetails).to.have.property('username')
	})

	test('should get packages', async() => {
		const response = await userApi.packages()
		expect(response).to.be.an('array')
		response.forEach(record => {
			expect(record).to.have.property('name')
			expect(record).to.have.property('price')
			expect(record).to.have.property('id')
		})
	})
})

describe('BotAPI', () => {

	test('should list', async() => {
		bots = await botApi.list()
		expect(bots).to.be.an('array')
		bots.forEach(bot => {
			expect(bot).to.have.property('robot_name')
			expect(bot).to.have.property('pk')
		})
	})

	test('should get details', async() => {
		const promises = await Promise.all(bots.map(bot => botApi.info(bot.pk)))
		promises.forEach(prom => {
			expect(prom).to.have.property('user')
			expect(prom).to.have.property('robot_name')
			expect(prom.user).to.equal(credential.email)
		})
	})

	test('should get report', async() => {
		const promises = await Promise.all(bots.map(bot => botApi.report(bot.pk)))
		promises.forEach(prom => {
			expect(prom).to.be.an('array').with.lengthOf(8)
			prom.filter(p => p.date).forEach(record => {
				expect(record).to.have.property('total_chat')
				expect(record).to.have.property('success_count')
			})
		})
	})

	test('should get history', async() => {
		const promises = await Promise.all(bots.map(bot => botApi.history(bot.pk)))
		promises.forEach(prom => {
			expect(prom).to.have.property('results')
			expect(prom).to.have.property('count')
			expect(prom).to.have.property('total_pages')
			expect(prom.results).to.be.an('array')

			prom.results.forEach(record => {
				expect(record).to.have.property('sender')
				expect(record).to.have.property('content')
			})
		})
	})

	test('should get matching', async() => {
		const promises = await Promise.all(bots.map(bot => botApi.matching(bot.pk)))
		promises.forEach(prom => {
			expect(prom).to.be.an('array')
			prom.forEach(record => {
				expect(record).to.have.property('id')
				expect(record).to.have.property('ori_question')
				expect(record).to.have.property('select_question')
			})
		})
	})

	test('should get platforms', async() => {
		const platforms = await botApi.platforms()
		expect(platforms).to.be.an('array')
		platforms.forEach(platform => {
			expect(platform).to.have.property('id')
			expect(platform).to.have.property('name')
		})
	})
})

describe('FAQ API', () => {
	test('should list', async() => {
		const faqs = await Promise.all(bots.map(bot => groupApi.fetch(bot.pk, 1)))
		faqs.forEach(faq => {
			expect(faq).to.have.property('results')
			expect(faq).to.have.property('count')
			expect(faq).to.have.property('total_pages')
			faq.results.forEach(record => {
				expect(record).to.have.property('answer')
				expect(record).to.have.property('question')
				expect(record).to.have.property('id')
				expect(record.question).to.be.an('array')
				expect(record.answer).to.be.an('array')
				record.question.forEach(que => {
					expect(que).to.have.property('id')
					expect(que).to.have.property('content')
				})
				record.answer.forEach(ans => {
					expect(ans).to.have.property('id')
					expect(ans).to.have.property('content')
				})
			})
		})
	})
})