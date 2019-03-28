require('babel-core/register')
require('babel-polyfill')
if ( ! process.env.NODE_ENV) {
	process.env.NODE_ENV = 'test' 
}
require('dotenv').config({path: `env/${process.env.NODE_ENV}.env`})
const _ = require('lodash')
const {
	expect
} = require('chai')
const httpAdapter = require('axios/lib/adapters/http')
const axios = require('axios')
const {
	default: authApi
} = require('../apis/auth')
const {
	default: userApi
} = require('../apis/user')
const {
	default: botApi
} = require('../apis/bot')
const {
	default: groupApi
} = require('../apis/group')

axios.defaults.adapter = httpAdapter
const credentials = {
	email: 'jhowliu@lingtelli.com',
	password: 'jhow'
}

let bots = []

describe('Authentication API', function() {
	this.timeout(10000)
	it('should login', async () => {
		const response = await authApi.login({
			data: credentials
		})
		expect(response).to.have.property('access_token')
		axios.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`
	})
	it('should query user data', async () => {
		const response = await userApi.getId()
		expect(response).to.be.an('array').with.lengthOf(1)
		expect(response[0]).to.have.property('id')
		expect(response[0].id).to.be.a('number')
		const userId = response[0].id
		const userDetails = await userApi.detail(userId)
		expect(userDetails).to.have.property('first_name')
		expect(userDetails).to.have.property('username')
	})
	it('should query packages', async () => {
		const response = await userApi.packages()
		expect(response).to.be.an('array')
		_.forEach(response, record => {
			expect(record).to.have.property('name')
			expect(record).to.have.property('price')
			expect(record).to.have.property('id')
		})
	})
})

describe('Bot API', function() {
	let promises = []
	it('should query list', async function() {
		this.timeout(5000)
		bots = await botApi.list()
		expect(bots).to.be.an('array')
		_.forEach(bots, bot => {
			expect(bot).to.have.property('robot_name')
		})

	})

	it('should query info', async function() {
		this.timeout(1000 * bots.length)
		promises = await Promise.all(_.map(bots, bot => botApi.info(bot.pk)))
		expect(promises).to.be.an('array').with.lengthOf(bots.length)
		_.forEach(promises, prom => {
			expect(prom).to.have.property('robot_name')
			expect(prom).to.have.property('user')
			expect(prom.user).to.equal(credentials.email)
		})
	})

	it('should query report', async function() {
		this.timeout(2000 * bots.length)
		promises = await Promise.all(_.map(bots, bot => botApi.report(bot.pk)))
		expect(promises).to.be.an('array').with.lengthOf(bots.length)
		_.forEach(promises, prom => {
			expect(prom).to.be.an('array').with.lengthOf(8)
			_.forEach(_.filter(prom, p => p.date), record => {
				expect(record).to.have.property('total_chat')
				expect(record).to.have.property('success_count')
			})
		})
	})

	it('should query history', async function() {
		this.timeout(1000 * bots.length)
		promises = await Promise.all(_.map(bots, bot => botApi.history(bot.pk)))
		expect(promises).to.be.an('array').with.lengthOf(bots.length)
		_.forEach(promises, prom => {
			expect(prom).to.have.property('results')
			expect(prom).to.have.property('count')
			expect(prom).to.have.property('total_pages')
			expect(prom.results).to.be.an('array')

			_.forEach(prom.results, record => {
				expect(record).to.have.property('sender')
				expect(record).to.have.property('content')
			})
		})
	})
	it('should query matching', async function() {
		this.timeout(1000 * bots.length)
		promises = await Promise.all(_.map(bots, bot => botApi.matching(bot.pk)))
		expect(promises).to.be.an('array').with.lengthOf(bots.length)
		_.forEach(promises, prom => {
			expect(prom).to.be.an('array')
			_.forEach(prom, record => {
				expect(record).to.have.property('id')
				expect(record).to.have.property('ori_question')
				expect(record).to.have.property('select_question')
			})
		})
	})

	it('should query platform', async function() {
		this.timeout(1000 * bots.length)
		const platforms = await botApi.platforms()
		expect(platforms).to.be.an('array')
		_.forEach(platforms, platform => {
			expect(platform).to.have.property('id')
			expect(platform).to.have.property('name')
		})
	})
})

describe('FAQ API', function() {
	this.timeout(4000 * bots.length)
	it('should query FAQ', async () => {
		const faqs = await Promise.all(_.map(bots, bot => groupApi.fetch(bot.pk, 1)))
		_.forEach(faqs, faq => {
			expect(faq).to.have.property('results')
			expect(faq).to.have.property('count')
			expect(faq).to.have.property('total_pages')
			_.forEach(faq.results, record => {
				expect(record).to.have.property('answer')
				expect(record).to.have.property('question')
				expect(record.question).to.be.an('array')
				expect(record.answer).to.be.an('array')
				expect(record).to.have.property('id')
				_.forEach(record.answer, ans => {
					expect(ans).to.have.property('content')
					expect(ans).to.have.property('id')
				})
				_.forEach(record.question, que => {
					expect(que).to.have.property('content')
					expect(que).to.have.property('id')
				})
			})
		})
	})
})