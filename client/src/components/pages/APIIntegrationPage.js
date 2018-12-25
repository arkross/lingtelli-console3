import React, {Component, Fragment} from 'react'
import _ from 'lodash'
import {Icon, Grid, Header, Button, Message, Segment, Input, Table, Divider, Label} from 'semantic-ui-react'
import { compose } from 'recompose'
import { translate, Trans} from 'react-i18next'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import toJS from '../utils/ToJS'
import { updateBot } from 'actions/bot'

class APIIntegration extends Component {

	constructor(props) {
		super(props)
		this.counter = 0
		this.state = {
			loading: false,
			info: props.info
		}
		
	}

	componentWillUnmount = () => {
		this.finishLoading = () => {}
	}

	componentWillReceiveProps(nextProps) {
		if (JSON.stringify(nextProps.info) !== JSON.stringify(this.state.info)) {
			this.setState({ info: nextProps.info })
		}
	}

	finishLoading = () => {
		this.setState({
			loading: false
		})
	}

	toggleTutorial = (platformName, e) => {
		e.preventDefault()
		this.setState({
			show: {...this.state.show, [platformName]: ! this.state.show[platformName]}
		})
	}

	handleChange = (platformName, e) => {
		this.setState({
			info: {
				...this.state.info,
				[platformName]: {
					...this.state.info[platformName],
					[e.target.name]: e.target.value
				}
			}
		})
	}

	handleCopy = () => {
		this.setState({
			copied: true
		})
	}
	
	handleToggle = platformName => {
		const { supportPlatforms, info, updateBot } = this.props
		const platformIndex = _.find(supportPlatforms, plat => plat.name == platformName)
		const isAlreadyActive = (_.indexOf(info.platform, platformIndex.id) > -1)

		if (isAlreadyActive) {
			info.platform = _.without(info.platform, platformIndex.id)
		} else {
			info.platform = [...info.platform, platformIndex.id]
		}

		this.setState({ loading: true })
		updateBot(info.pk, info)
			.then(data => this.finishLoading())
	}

	handleSubmit = platformName => {
		const { info, updateBot } = this.props
		const { info: stateInfo } = this.state
		const saveData = { ...info, [platformName]: stateInfo[platformName] }
		this.setState({ loading: true})
		updateBot(saveData.pk, saveData)
			.then(data => this.finishLoading())
	}

	getAPITutorial = () => {
		const { t } = this.props
		
	}

	render() {
		const { supportPlatforms, t, info, user, user: {packages} } = this.props
		const { info: {platform: third_party, vendor_id}} = this.state
		const currentPlatforms = _.filter(supportPlatforms, plat => _.find(third_party, p => p === plat.id))
 
		const webActive = !!_.find(currentPlatforms, plat => plat.name == 'Api')
		const currentPaidtype = _.find(packages, p => p.name === user.paid_type)
		const isActivable = currentPaidtype && currentPaidtype.third_party.find(el => el.name === 'Api')

		const rootUrl = process.env.REACT_APP_WEBHOOK_API_HOST + '/' + vendor_id
		const webhookUrl = process.env.REACT_APP_WEBHOOK_HOST + '/' + vendor_id

		return <Grid className='integration-page'>
			<Grid.Row>
				<Grid.Column width={12}><Header>API</Header></Grid.Column>
				<Grid.Column floated='right' width={3}>
				{isActivable ? 
					<Button floated='right' disabled={!isActivable} onClick={this.handleToggle.bind(this, 'Api')} color={webActive ? 'green' : 'grey'} icon={webActive ? 'check' : 'remove'} content={webActive ? t('chatbot.integration.activated') : t('chatbot.integration.inactive')}
					/>
				: <Label basic color='grey'><Icon name='exclamation' /> {t('chatbot.setting.unavailable')}</Label>}
				</Grid.Column>
			</Grid.Row>
			<Grid.Row>
				<Grid.Column>
					<div>{t('chatbot.setting.api.description')}</div>
				</Grid.Column>
			</Grid.Row>
			<Grid.Row>
				<Grid.Column>
					<Header>API Root URL</Header>
					<pre>
						<code>
							{rootUrl}
						</code>
					</pre>
				</Grid.Column>
			</Grid.Row>
			<Grid.Row>
				<Grid.Column>
					<APIUnit
						t={t}
						title={'info'}
						method={'GET'}
						url={rootUrl + '/info'}
						headers={[
							{
								name: 'Content-Type',
								value: 'application/json'
							}
						]}
						responses={{
							tables: [
								{
									title: 'reply',
									content: [
										{
											name: 'robotName',
											value: `"${info.robot_name}"`
										},
										{
											name: 'activate',
											value: info.activate === "True" ? 'true' : 'false'
										},
										{
											name: 'failedMsg',
											value: `"${info.failed_msg}"`
										},
										{
											name: 'greetingMsg',
											value: `"${info.greeting_msg}"`
										},
										{
											name: 'chatbotId',
											value: info.pk
										},
										{
											name: 'postbackTitle',
											value: `"${info.postback_title}"`
										}
									]
								}
							],
							samples: [
								{
									title: 'success',
									color: 'green',
									statusCode: 200,
									content: {
										"robotName": info.robot_name,
										"activate": info.activate === "True" ? true : false,
										"failedMsg": info.failed_msg,
										"chatbotId": info.pk,
										"greetingMsg": info.greeting_msg,
										"postbackTitle": info.postback_title
									}
								},
								{
									title: 'notFound',
									color: 'red',
									statusCode: 404,
									content: {
										errors: 'Not Found'
									}
								}
							]
						}}
					/>
					<APIUnit
						t={t}
						title='message'
						method={'POST'}
						url={rootUrl}
						headers={[
							{
								name: 'Content-Type',
								value: 'application/json'
							}
						]}
						params={{
							tables: [
								{
									title: 'root',
									content: [
										{
											name: 'userId',
											value: '"c16abf20-bdaf-45c0-abd3-501ca1711085"'
										},
										{
											name: 'message',
										},
										{
											name: 'type',
										}
									]
								},
								{
									title: 'message',
									content: [
										{
											name: 'text',
											value: '"得到口臭後，應該要怎樣保養呢？"'
										},
										{
											name: 'id',
											optional: true,
											value: '11437'
										},
										{
											name: 'oriQue',
											optional: true,
											value: '"什麼"'
										}
									]
								}
							],
							samples: [
								{
									title: 'Message',
									content: {
										"userId": "c16abf20-bdaf-45c0-abd3-501ca1711085",
										"message": {
											"text":"您"
										},
										"type": "message"
									}
								},
								{
									title: 'Postback',
									content: {
										"userId": "c16abf20-bdaf-45c0-abd3-501ca1711085",
										"message": {
											"id": 11437,
											"oriQue": "什麼",
											"text": "得到口臭後，應該要怎樣保養呢？"
										},
										"type": "postback"
									}
								}
							]
						}}
						responses={{
							tables: [
								{
									title: 'reply',
									content: [
										{
											name: 'sender',
										},
										{
											name: 'type',
										},
										{
											name: 'state',
										},
										{
											name: 'success',
										},
										{
											name: 'uid',
											value: '"c16abf20-bdaf-45c0-abd3-501ca1711085"'
										},
										{
											name: 'sid',
											value: '"1apt8u6pv63g"'
										},
										{
											name: 'oriQue',
											value: '"Hi"'
										},
										{
											name: 'data',
										}
									]
								},
								{
									title: 'data',
									content: [
										{
											name: 'text',
											value: `"${info.failed_msg}"`
										},
										{
											name: 'title',
											value: `"${info.postback_title}"`
										},
										{
											name: 'buttons',
										}
									]
								},
								{
									title: 'choice',
									content: [
										{
											name: 'id',
											value: '11589'
										},
										{
											name: 'oriQue',
											value: '"什麼"'
										},
										{
											name: 'text',
											value: '"得到氣喘後，應該要怎樣保養呢？"'
										}
									]
								}
							],
							samples: [
								{
									title: 'messageSuccess',
									color: 'green',
									statusCode: 200,
									content: {
										"sender":"BOT",
										"type":"text",
										"state":"start",
										"success":false,
										"uid":"c16abf20-bdaf-45c0-abd3-501ca1711085",
										"sid":"1apt8u6pv63g",
										"oriQue":"Hi",
										"data":{
											"text": info.failed_msg
										}
									}
								},
								{
									title: 'postbackSuccess',
									color: 'green',
									statusCode: 200,
									content: {
										"sender":"BOT",
										"type":"list",
										"state":"in_progress",
										"success":true,
										"uid":"c16abf20-bdaf-45c0-abd3-501ca1711085",
										"sid":"1bsp6keg1oug",
										"oriQue":"什麼",
										"data":{
											"title": info.postback_title,
											"buttons":[
												{
													"id":11589,
													"oriQue":"什麼",
													"text":"得到氣喘後，應該要怎樣保養呢？"
												},
												{
													"id":11658,
													"oriQue":"什麼",
													"text":"得到蕁麻疹後，應該要怎樣保養呢？"
												},
												{
													"id":11437,
													"oriQue":"什麼",
													"text":"得到口臭後，應該要怎樣保養呢？"
												}
											]
										}
									}
								},
								{
									title: 'errorNotActivated',
									color: 'red',
									statusCode: 403,
									content: {
										errors: 'Platform is not activated'
									}
								}
							]
						}}
					/>
					<APIUnit
						t={t}
						title={'history'}
						method={'POST'}
						url={webhookUrl + '/history'}
						headers={[
							{
								name: 'Content-Type',
								value: 'application/json'
							}
						]}
						params={{
							tables: [
								{
									title: 'payload',
									content: [
										{
											name: 'userId',
											value: '"c16abf20-bdaf-45c0-abd3-501ca1711085"'
										}
									]
								}
							],
							samples: [
								{
									title: 'Basic',
									content: {
										"userId": "c16abf20-bdaf-45c0-abd3-501ca1711085"
									}
								}
							]
						}}
						responses={{
							samples: [
								{
									title: 'success',
									color: 'green',
									statusCode: 200,
									content: [
										{
											"owner": "BOT",
											"createdAt": "2018-10-04T10:24:08.000Z",
											"message": {
												"text": info.greeting_msg
											}
										},
										{
											"owner": "USER",
											"createdAt": "2018-10-04T10:24:08.000Z",
											"message": {
												"text": "hi"
											}
										}
									]
								},
								{
									title: 'notFound',
									color: 'red',
									statusCode: 404,
									content: {
										errors: 'Not Found'
									}
								}
							]
						}}
					/>
				</Grid.Column>
			</Grid.Row>
		</Grid>
	}
}

/**
 * @prop {string} title The component title
 * @prop {string} method
 * @prop {string} url
 * @prop {Object} params
 * @prop {Array.<Object>} params.tables
 * @prop {Array.<Object>} params.samples
 * @prop {string} params.tables[].title
 * @prop {Array.<Object>} params.tables[].content
 * @prop {string} params.tables[].content[].name
 * @prop {string} params.tables[].content[]value
 * @prop {string} params.tables[].content[].desc
 * @prop {boolean} params.tables[].content[].optional
 * @prop {string} params.samples[].title
 * @prop {(Object|string)} params.samples[].content
 * @prop {Object} responses
 * @prop {Array.<Object>} responses.samples
 * @prop {string} responses.samples[].title
 * @prop {string} responses.samples[].color
 * @prop {string} responses.samples[].content
 * @prop {string} responses.samples[].statusCode
 * @prop {Array.<Object>} responses.tables
 * @prop {string} responses.tables[].title
 * @prop {Array.<Object>} responses.tables[].content
 * @prop {string} responses.tables[].content[].name
 * @prop {string} responses.tables[].content[]value
 * @prop {string} responses.tables[].content[].desc
 * @prop {Array.<Object>} headers
 * @prop {string} headers[].name
 * @prop {string} headers[].value
 */
class APIUnit extends Component {
	parseJSON(obj) {
		if (typeof obj === 'string') {
			return obj
		}
		else {
			return JSON.stringify(obj, null, 4)
		}
	}

	render() {
		const { title, method, url, params, responses, headers, t} = this.props

		return <Fragment>
			<Divider/>
			<Header as='h3'>
				{t(`api.${title}.title`)}
			</Header>
			<Input fluid label={method} value={url} readOnly />
			<Header as='h4'>{t('chatbot.setting.api.headers')}</Header>
			{(headers && headers.length) ? <Table celled>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell>{t('chatbot.setting.api.table.name')}</Table.HeaderCell>
						<Table.HeaderCell>{t('chatbot.setting.api.table.value')}</Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{headers.map(param => <Table.Row key={param.name}>
						<Table.Cell>{param.name}</Table.Cell>
						<Table.Cell><code>{param.value}</code></Table.Cell>
					</Table.Row>)}
				</Table.Body>
			</Table> : <p>{t('chatbot.setting.api.noData')}</p>}

			<Header as='h4'>
				{t('chatbot.setting.api.params')}
			</Header>
			{(params && params.tables && params.tables.length) ? params.tables.map(table => <Fragment key={table.title}>
				<Header as='h5'>{t(`api.${title}.params.${table.title}.title`)}</Header>
				<Table celled>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell>{t('chatbot.setting.api.table.name')}</Table.HeaderCell>
							<Table.HeaderCell>{t('chatbot.setting.api.table.value')}</Table.HeaderCell>
							<Table.HeaderCell>{t('chatbot.setting.api.table.optional')}</Table.HeaderCell>
							<Table.HeaderCell>{t('chatbot.setting.api.table.description')}</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{table.content.map(row => <Table.Row key={row.name}>
							<Table.Cell><code>{row.name}</code></Table.Cell>
							<Table.Cell>{row.value !== null ? <code>{row.value}</code> : ''}{t(`api.${title}.params.${table.title}.${row.name}_value`)}</Table.Cell>
							<Table.Cell>{row.optional ? <Icon name='checkmark' color='green' /> : <Icon name='remove' color='red' />}</Table.Cell>
							<Table.Cell>{t(`api.${title}.params.${table.title}.${row.name}_desc`)}</Table.Cell>
						</Table.Row>)}
					</Table.Body>
				</Table>
			</Fragment>) : <p>{t('chatbot.setting.api.noData')}</p>}
			<Header as='h4'>
				{t('chatbot.setting.api.paramSamples')}
			</Header>
			{(params && params.samples && params.samples.length) ? params.samples.map(sample => <Fragment key={sample.title}>
				<Header as='h5'>{sample.title}</Header>
				<pre>{this.parseJSON(sample.content)}</pre>
			</Fragment>) : <p>{t('chatbot.setting.api.noData')}</p>}

			<Header as='h4'>{t('chatbot.setting.api.responses')}</Header>
			{(responses && responses.tables && responses.tables.length) ? responses.tables.map(table => <Fragment key={table.title}>
				<Header as='h5'>{t(`api.${title}.responses.${table.title}.title`)}</Header>
				<Table celled>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell>{t('chatbot.setting.api.table.name')}</Table.HeaderCell>
							<Table.HeaderCell>{t('chatbot.setting.api.table.value')}</Table.HeaderCell>
							<Table.HeaderCell>{t('chatbot.setting.api.table.description')}</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{table.content.map(row => <Table.Row key={row.name}>
							<Table.Cell><code>{row.name}</code></Table.Cell>
							<Table.Cell>{t(`api.${title}.responses.${table.title}.${row.name}_value`)}{row.value !== null ? <code>{row.value}</code> : ''}</Table.Cell>
							<Table.Cell>{t(`api.${title}.responses.${table.title}.${row.name}_desc`)}</Table.Cell>
						</Table.Row>)}
					</Table.Body>
				</Table>
			</Fragment>) : <p>{t('chatbot.setting.api.noData')}</p>}

			<Header as='h4'>{t('chatbot.setting.api.respSamples')}</Header>
			{(responses && responses.samples && responses.samples.length) ? responses.samples.map(resp => <Fragment key={resp.title}>
				<Message attached='top' header={t(`api.${title}.responseSamples.${resp.title}`)} color={resp.color} content={`HTTP Status Code: ${resp.statusCode}`} />
				<Segment attached='bottom'>
					<pre>{this.parseJSON(resp.content)}</pre>
				</Segment>
			</Fragment>) : <p>{t('chatbot.setting.api.noData')}</p>}
		</Fragment>
	}
}

const mapStateToProps = (state, props) => ({
	user: state.get('user'),
	activeBot: props.match.params.id,
	info: state.getIn(['bot', 'bots', props.match.params.id]) || {},
	supportPlatforms: state.getIn(['bot', 'supportPlatforms']) || []
})
export default compose(
	withRouter,
	connect(mapStateToProps, { updateBot }),
	translate(),
	toJS
)(APIIntegration)