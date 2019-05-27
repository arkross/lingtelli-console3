import React, {Component, Fragment} from 'react'
import _ from 'lodash'
import {Icon, Grid, Header, Button, Message, Segment, Input, Table, Divider, Label} from 'semantic-ui-react'
import { compose } from 'recompose'
import { translate, Trans} from 'react-i18next'
import { connect } from 'react-redux'
import { withRouter, NavLink } from 'react-router-dom'
import toJS from '../../utils/ToJS'
import { updateBot } from 'actions/bot'

import APIDocPage from '../APIDocPage'

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
		// const { supportPlatforms, info, updateBot } = this.props
		// const platformIndex = _.find(supportPlatforms, plat => plat.name == platformName)
		// const isAlreadyActive = (_.indexOf(info.platform, platformIndex.id) > -1)

		// if (isAlreadyActive) {
		// 	info.platform = _.without(info.platform, platformIndex.id)
		// } else {
		// 	info.platform = [...info.platform, platformIndex.id]
		// }

		// this.setState({ loading: true })
		// updateBot(info.pk, info)
		// 	.then(data => this.finishLoading())
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
		const { info: {third_party, vendor_id}} = this.state
		const currentPlatforms = _.filter(supportPlatforms, plat => third_party.indexOf(plat.id) >= 0)

		const webActive = !!_.find(currentPlatforms, plat => plat.name == 'Api')
		const currentPaidtype = _.find(packages, p => p.name === user.paid_type)
		const isActivable = currentPaidtype && currentPaidtype.third_party.find(el => el.name === 'Api')

		const rootUrl = process.env.REACT_APP_WEBHOOK_API_HOST + '/' + vendor_id
		const webhookUrl = process.env.REACT_APP_WEBHOOK_HOST + '/' + vendor_id

		return <Grid className='integration-page'>
			<Grid.Row columns='equal'>
				<Grid.Column><Header>API</Header></Grid.Column>
				<Grid.Column floated='right'>
				{webActive ? 
					<Label color='green' style={{ float: 'right'}}><Icon name='check' /> {t('chatbot.integration.activated')}</Label>
				: <Label basic color='grey' style={{ float: 'right'}}><Icon name='exclamation' /> {t('chatbot.setting.unavailable')}</Label>}
				</Grid.Column>
			</Grid.Row>
			<Grid.Row>
				<Grid.Column>
					<Header as='h4'>Vendor ID</Header>
					<Input type='text' readOnly value={vendor_id}>
						<input size={40} />
					</Input>
				</Grid.Column>
			</Grid.Row>
			<Grid.Row>
				<APIDocPage vendorId={vendor_id} />	
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