import _ from 'lodash'
import i18n from '../i18n'

export default function (config, data) {
	return _.mapValues(config, (el, key) => {
		const result = {
			error: false,
			messages: []
		}
		const {
			rules,
			name: fieldName
		} = el
		const matchData = _.get(data, key)

		if (matchData === null) {
			return result
		}

		// Loop through individual rules
		const ruleChecks = _.map(rules, rule => {
			const ruleObject = {
				type: 'required',
				message: '',
				args: null,
				noTranslation: false
			}
			const ruleResult = {
				error: false,
				message: ''
			}

			if (typeof rule === 'object') {
				const keys = _.keys(rule)
				ruleObject.type = keys[0]
				ruleObject.args = rule[keys[0]]
			}
			if (typeof rule === 'string') {
				ruleObject.type = rule
			}
			ruleObject.message = `validation.${ruleObject.type}`

			// Individual implementations
			switch (ruleObject.type) {
			case 'required':
				if (!matchData.trim()) {
					ruleResult.error = true
				}
				break
			case 'length':
				ruleResult.error = (matchData.length !== ruleObject.args)
				break
			case 'min':
				ruleResult.error = (matchData.length < ruleObject.args)
				break
			case 'max':
				ruleResult.error = (matchData.length > ruleObject.args)
				break
			case 'range':
				ruleResult.error = (matchData.length > ruleObject.args[1] || matchData.length < ruleObject.args[0])
				break
			case 'match':
				const matchData2 = _.get(data, ruleObject.args)
				ruleResult.error = (matchData2 !== matchData)
				break
			case 'email':
				ruleObject.args = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
			case 'regex':
				ruleResult.error = !ruleObject.args.test(matchData)
				break
			default:
			}

			// Message generation
			if (ruleResult.error) {
				if (ruleObject.noTranslation) {
					ruleResult.message = ruleObject.message
				} else {
					const params = {
						field: i18n.t(fieldName)
					}
					if (_.isArray(ruleObject.args)) {
						for (let i = 1; i <= ruleObject.args.length; i++) {
							params[`param${i}`] = ruleObject.args[i - 1]
						}
					} else if (ruleObject.type === 'match') {
						const matchConfig = _.get(config, ruleObject.args)
						if (matchConfig) {
							params['param1'] = i18n.t(matchConfig.name)
						}
					}
					ruleResult.message = i18n.t(ruleObject.message, params)
				}
			}

			return ruleResult
		})

		return _.reduce(ruleChecks, (acc, o) => {
			acc.error = o.error || acc.error
			acc.messages = [...acc.messages, o.message]
			return acc
		}, {
			error: false,
			messages: []
		})
	})
}
