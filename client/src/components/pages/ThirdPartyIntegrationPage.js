import React, {Component, Fragment} from 'react'
import _ from 'lodash'
import {List, Image, Icon, Grid, Form, Header, Button, Label, Divider, Loader} from 'semantic-ui-react'
import { compose } from 'recompose'
import { translate, Trans} from 'react-i18next'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import toJS from '../utils/ToJS'
import { lineRead, facebookRead, lineReadIgnore, facebookReadIgnore } from 'actions/bot'
import botAPI from '../../apis/bot'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import EditableList from '../utils/EditableList'

class LineIntegration extends Component {

	constructor(props) {
		super(props)
		this.counter = 0
		this.state = {
			facebookLoading: false,
			lineLoading: false,
			info: props.info,
			copied: false,
			show: {
				facebook: false,
				line: false,
				web: false
			}
		}
		
	}

	componentWillUnmount = () => {
		this.finishLoading = () => {}
	}

	componentWillReceiveProps(nextProps) {
		if (JSON.stringify(nextProps.info) !== JSON.stringify(this.state.info)) {
			this.setState({ info: nextProps.info })
			if (nextProps.info.assign_user && nextProps.user.paid_type === 'Staff') {
				nextProps.history.push(`/dashboard/bot/${nextProps.info.id}/setting`)
			}
		}
	}

	finishLoading = () => {
		this.setState({
			facebookLoading: false,
			lineLoading: false
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
		// updateBot(info.id, info)
		// 	.then(data => this.finishLoading())
	}

	handleFbSubmit = platformName => {
		const { info, updateBot, facebookRead } = this.props
		const { info: stateInfo } = this.state
		const saveData = { ...info, [platformName]: stateInfo[platformName] }
		this.setState({ facebookLoading: true})
		return botAPI.facebook.update(saveData.id, stateInfo[platformName].token, stateInfo[platformName].verify_str)
			.then(data => facebookRead(saveData.id).then(() => this.finishLoading()))
	}

	handleLineSubmit = platformName => {
		const { info, updateBot, lineRead } = this.props
		const { info: stateInfo } = this.state
		const saveData = { ...info, [platformName]: stateInfo[platformName] }
		this.setState({ lineLoading: true})
		return botAPI.line.update(saveData.id, stateInfo[platformName].secret, stateInfo[platformName].token)
			.then(data => lineRead(saveData.id).then(() => this.finishLoading()))
	}

	handleIgnoreUpdate = (type = 'line', id, value) => {
		this.setState({ [`${type}Loading`]: true })
		return botAPI[type].updateIgnore(this.props.info.id, id, { display_name: value })
			.then(() => this.props[`${type}ReadIgnore`](this.props.info.id))
			.then(() => {
				this.setState({ [`${type}Loading`]: false })
				return this.props.info[`${type}Ignore`]
			})
	}

	handleIgnoreDelete = (type = 'line', id) => {
		return botAPI[type].deleteIgnore(this.props.info.id, id)
			.then(() => this.props[`${type}ReadIgnore`](this.props.info.id))
			.then(() => this.props.info[`${type}Ignore`])
	}

	handleIgnoreCreate = (type = 'line', value) => {
		return botAPI[type].createIgnore(this.props.info.id, {
			display_name: value
		})
			.then(() => this.props[`${type}ReadIgnore`](this.props.info.id))
			.then(() => this.props.info[`${type}Ignore`])
	}

	handleIgnoreChange = (type, values) => {
		const clone = _.clone(this.state.info)
		if (type === 'line') {
			clone.lineIgnore = values
		} else if (type === 'facebook') {
			clone.facebookIgnore = values
		}
		this.setState({ info: clone })
		return this.handleLineSubmit('line')
	}

	getFBTutorial = () => {
		const {t} = this.props

		const curlang = localStorage.i18nextLng.toLowerCase()
		const step4 = require(`../../assets/img/chatbot/${curlang}/facebook/04_my_apps.PNG`)
		const step5 = require(`../../assets/img/chatbot/${curlang}/facebook/05_messenger.PNG`)
		const step6 = require(`../../assets/img/chatbot/${curlang}/facebook/06_token_generation.PNG`)
		const step9 = require(`../../assets/img/chatbot/${curlang}/facebook/09_webhook.PNG`)
		const step12 = require(`../../assets/img/chatbot/${curlang}/facebook/12_subscription.PNG`)
		const step13 = require(`../../assets/img/chatbot/${curlang}/facebook/13_subscribe.PNG`)
		const step14 = require(`../../assets/img/chatbot/${curlang}/facebook/14_review.PNG`)

		return <List ordered relaxed>
			<List.Item>{t('chatbot.setting.facebook.steps._1')}</List.Item>
			<List.Item>{t('chatbot.setting.facebook.steps._2')}</List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.facebook.steps._3'><a href='https://developers.facebook.com' target='_BLANK'>0</a></Trans></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.facebook.steps._4'><strong>0</strong><strong>1</strong></Trans><br /> <Image src={step4} centered rounded bordered /></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.facebook.steps._5'><strong>0</strong><strong>1</strong></Trans><br/> <Image src={step5} centered rounded bordered /></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.facebook.steps._6'><strong>0</strong><strong>1</strong></Trans><br/> <Image src={step6} centered rounded bordered /></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.facebook.steps._7'><strong>0</strong><Label as='label' htmlFor='access_token_field' content={t('chatbot.setting.facebook.token')}></Label></Trans></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.facebook.steps._8'><Label as='label' htmlFor='verify_token_field' content={t('chatbot.setting.facebook.verify')}></Label></Trans></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.facebook.steps._9'><strong>0</strong><strong>1</strong></Trans><br/><Image src={step9} centered rounded bordered /></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.facebook.steps._10'><Label as='label' htmlFor='webhook_url_field' content={t('chatbot.setting.facebook.webhookURL')}></Label><strong>1</strong></Trans></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.facebook.steps._11'><Label as='label' htmlFor='verify_token_field' content={t('chatbot.setting.facebook.verify')}></Label><strong>1</strong><Label color='blue' content={t('chatbot.update')} icon='check'></Label></Trans></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.facebook.steps._12'><strong>0</strong><strong>1</strong><strong>2</strong></Trans><br/><Image src={step12} centered rounded bordered /></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.facebook.steps._13'><strong>0</strong><strong>1</strong></Trans><br/><Image src={step13} centered rounded bordered /></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.facebook.steps._14'><strong>0</strong><strong>1</strong><strong>2</strong></Trans><br/><Image src={step14} centered rounded bordered /></List.Item>
			<List.Item>{t('chatbot.setting.facebook.steps._15')}</List.Item>
		</List>
	}

	getLineTutorial = () => {
		const { t } = this.props
		const step3 = require(`../../assets/img/chatbot/en-us/line/03_provider.PNG`)
		const step4 = require(`../../assets/img/chatbot/en-us/line/04_channel.PNG`)
		const step6 = require(`../../assets/img/chatbot/en-us/line/06_access_token.PNG`)
		const step8 = require(`../../assets/img/chatbot/en-us/line/08_secret.PNG`)

		return <List ordered relaxed>
			<List.Item>{t('chatbot.setting.line.steps._1')}</List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.line.steps._2'><a href='https://developers.line.me' target="_BLANK">0</a><strong>1</strong></Trans></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.line.steps._3'><strong>0</strong></Trans><br /><Image src={step3} /></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.line.steps._4'><strong>0</strong></Trans><br /><Image src={step4} /></List.Item>
			<List.Item>{t('chatbot.setting.line.steps._5')}</List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.line.steps._6'><strong>0</strong><strong>1</strong><strong>2</strong></Trans><br /><Image src={step6} /></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.line.steps._7'><strong>0</strong><Label as='label' htmlFor='token_field' content={t('chatbot.setting.line.token')}></Label></Trans></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.line.steps._8'><strong>0</strong><strong>1</strong><Label as='label' htmlFor='secret_field' content={t('chatbot.setting.line.secret')}></Label></Trans><br /><Image src={step8} /></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.line.steps._9'><Label as='label' htmlFor='webhook_line_url_field' content={t('chatbot.setting.line.webhookURL')}></Label><strong>1</strong><strong>2</strong></Trans></List.Item>
			<List.Item>{t('chatbot.setting.line.steps._10')}</List.Item>
		</List>

	}

	render() {
		const { supportPlatforms, t, match, user, user: {packages} } = this.props
		const { info, info: {third_party, facebookIgnore, lineIgnore}, loading, show, facebookLoading, lineLoading} = this.state
		const currentPlatforms = _.filter(supportPlatforms, plat => third_party.indexOf(plat.id) >= 0)
		
		const lineWebhook = `${process.env.REACT_APP_WEBHOOK_HOST}/line/${info.vendor_id}`
		const lineActive = !!_.find(currentPlatforms, plat => plat.name == 'Line')

		const facebookWebhook = `https://${process.env.REACT_APP_WEBHOOK_HOST}/facebook/${info.vendor_id}`
		const facebookActive = !!_.find(currentPlatforms, plat => plat.name === 'Facebook')

		const currentPaidtype = _.find(packages, p => p.name === user.paid_type)
		const isActivable = currentPaidtype && currentPaidtype.third_party.find(el => el.name === 'Line')

		return <Grid className='integration-page'>
		
		<Grid.Row columns='equal'>
			<Grid.Column><Header as='h1'>LINE</Header></Grid.Column>
			<Grid.Column floated='right'>
				{!lineActive ?
				<Label basic color='grey' style={{ float: 'right' }}><Icon name='exclamation' /> {t('chatbot.setting.unavailable')}</Label> :
				<Label color='green' style={{ float: 'right'}}><Icon name='check' /> {t('chatbot.integration.activated')}</Label>}
			</Grid.Column>
		</Grid.Row>
		<Grid.Row>
			<Grid.Column>
				<Form onSubmit={this.handleLineSubmit.bind(this, 'line')}>
					<Form.Input
						icon={
							<CopyToClipboard text={lineWebhook}>
								<Icon name='copy' link />
							</CopyToClipboard>
						}
						type='text'
						name='webhookURL'
						id='webhook_line_url_field'
						readOnly={true}
						label={t('chatbot.setting.facebook.webhookURL')}
						value={lineWebhook || ''}
					/>
					<Form.Input 
						type='text'
						name='secret'
						id='secret_field'
						label={t('chatbot.setting.line.secret')}
						disabled={!lineActive}
						value={info.line ? info.line.secret : ''}
						onChange={this.handleChange.bind(this, 'line')}
					/>
					<Form.Input
						type='text'
						name='token'
						id='token_field'
						label={t('chatbot.setting.line.token')}
						disabled={!lineActive}
						value={info.line ? info.line.token : ''}
						onChange={this.handleChange.bind(this, 'line')}
					/>
					<Button loading={lineLoading} primary disabled={!lineActive}>
						<Icon name='save' />
						{t('chatbot.update')}
					</Button>
				</Form>
			</Grid.Column>
		</Grid.Row>
		<Grid.Row>
			<Grid.Column>
				<a onClick={this.toggleTutorial.bind(this, 'line')} href='#'>
					{show.line ? t('chatbot.integration.hide_tutorial') : t('chatbot.integration.see_tutorial')}
					{show.line ? <Icon name='caret up' /> : <Icon name='caret down' />}
				</a>
				{ show.line && this.getLineTutorial()}
			</Grid.Column>
		</Grid.Row>
		<Grid.Row>
			<Grid.Column>
				<Header>{t('chatbot.setting.line.ignoreTitle')}</Header>
				<p>{t('chatbot.setting.line.ignoreDescription')}</p>
				{lineIgnore ?
				<EditableList
					values={lineIgnore}
					onDelete={this.handleIgnoreDelete.bind(null, 'line')}
					onCreate={this.handleIgnoreCreate.bind(null, 'line')}
					onChange={this.handleIgnoreChange.bind(null, 'line')}
					onUpdate={this.handleIgnoreUpdate.bind(null, 'line')}
					idKey='id'
					valueKey='display_name'
				/>
				: <Loader active={true} />
				}
			</Grid.Column>
		</Grid.Row>

		<Divider />

		<Grid.Row columns='equal'>
			<Grid.Column><Header as='h1'>Facebook</Header></Grid.Column>
			<Grid.Column floated='right'>
			{facebookActive ?
				<Label color='green' style={{ float: 'right'}}><Icon name='check' /> {t('chatbot.integration.activated')}</Label>
			: <Label color='grey' basic style={{ float: 'right'}}><Icon name='exclamation' /> {t('chatbot.setting.unavailable')}</Label>}
			</Grid.Column>
		</Grid.Row>
		<Grid.Row>
			<Grid.Column>
				<Form onSubmit={this.handleFbSubmit.bind(this, 'facebook')}>
					<Form.Input
						icon={
							<CopyToClipboard text={facebookWebhook}>
								<Icon name='copy' link />
							</CopyToClipboard>
						}
						type='text'
						name='webhookURL'
						id='webhook_url_field'
						readOnly={true}
						label={t('chatbot.setting.facebook.webhookURL')}
						value={facebookWebhook || ''}
					/>
					<Form.Input
						type='text'
						name='token'
						id='access_token_field'
						label={t('chatbot.setting.facebook.token')}
						disabled={!facebookActive}
						value={info.facebook ? info.facebook.token : ''}
						onChange={this.handleChange.bind(this, 'facebook')}
					/>
					<Form.Input
						type='text'
						name='verify_str'
						id='verify_token_field'
						label={t('chatbot.setting.facebook.verify')}
						disabled={!facebookActive}
						value={info.facebook ? info.facebook.verify_str : ''}
						onChange={this.handleChange.bind(this, 'facebook')}
					/>
					<Button loading={facebookLoading} primary disabled={!facebookActive}>
						<Icon name='save' />
						{t('chatbot.update')}
					</Button>
				</Form>
			</Grid.Column>
		</Grid.Row>
		<Grid.Row>
			<Grid.Column>
				<a href='#' onClick={this.toggleTutorial.bind(this, 'facebook')}>
				{show.facebook ? t('chatbot.integration.hide_tutorial') : t('chatbot.integration.see_tutorial')}
				{show.facebook ? <Icon name='caret up' /> : <Icon name='caret down' />}
				</a>
				{ show.facebook && this.getFBTutorial()}
			</Grid.Column>
		</Grid.Row>
		<Grid.Row>
			<Grid.Column>
				<Header>{t('chatbot.setting.facebook.ignoreTitle')}</Header>
				<p>{t('chatbot.setting.facebook.ignoreDescription')}</p>
				{facebookIgnore ?
				<EditableList
					values={facebookIgnore}
					onDelete={this.handleIgnoreDelete.bind(null, 'facebook')}
					onCreate={this.handleIgnoreCreate.bind(null, 'facebook')}
					onChange={this.handleIgnoreChange.bind(null, 'facebook')}
					onUpdate={this.handleIgnoreUpdate.bind(null, 'facebook')}
					idKey='id'
					valueKey='display_name'
				/>
				: <Loader active={true} />
				}
			</Grid.Column>
		</Grid.Row>
	</Grid>
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
	connect(mapStateToProps, { facebookRead, lineRead, facebookReadIgnore, lineReadIgnore }),
	translate(),
	toJS
)(LineIntegration)