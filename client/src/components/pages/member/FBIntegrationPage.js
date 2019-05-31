import React, {Component, Fragment} from 'react'
import _ from 'lodash'
import {List, Image, Icon, Grid, Form, Header, Button, Label} from 'semantic-ui-react'
import { compose } from 'recompose'
import { translate, Trans} from 'react-i18next'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import toJS from '../../utils/ToJS'
import { facebookRead } from 'actions/bot'
import botAPI from '../../../apis/bot'
import { CopyToClipboard } from 'react-copy-to-clipboard'

class FBIntegration extends Component {

	constructor(props) {
		super(props)
		this.counter = 0
		this.state = {
			loading: false,
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
		// updateBot(info.id, info)
		// 	.then(data => this.finishLoading())
	}

	handleSubmit = platformName => {
		const { info, updateBot, facebookRead } = this.props
		const { info: stateInfo } = this.state
		const saveData = { ...info, [platformName]: stateInfo[platformName] }
		this.setState({ loading: true})
		botAPI.facebook.update(saveData.id, stateInfo[platformName].token, stateInfo[platformName].verify_str)
			.then(data => facebookRead(saveData.id).then(() => this.finishLoading()))
	}

	getFBTutorial = () => {
		const {t} = this.props

		const curlang = localStorage.i18nextLng.toLowerCase()
		const step4 = require(`../../../assets/img/chatbot/${curlang}/facebook/04_my_apps.PNG`)
		const step5 = require(`../../../assets/img/chatbot/${curlang}/facebook/05_messenger.PNG`)
		const step6 = require(`../../../assets/img/chatbot/${curlang}/facebook/06_token_generation.PNG`)
		const step9 = require(`../../../assets/img/chatbot/${curlang}/facebook/09_webhook.PNG`)
		const step12 = require(`../../../assets/img/chatbot/${curlang}/facebook/12_subscription.PNG`)
		const step13 = require(`../../../assets/img/chatbot/${curlang}/facebook/13_subscribe.PNG`)
		const step14 = require(`../../../assets/img/chatbot/${curlang}/facebook/14_review.PNG`)

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
			<List.Item><Trans i18nKey='chatbot.setting.facebook.steps._12'><strong>0</strong><strong>1</strong><strong>2</strong><strong>3</strong></Trans><br/><Image src={step12} centered rounded bordered /></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.facebook.steps._13'><strong>0</strong><strong>1</strong></Trans><br/><Image src={step13} centered rounded bordered /></List.Item>
			<List.Item><Trans i18nKey='chatbot.setting.facebook.steps._14'><strong>0</strong><strong>1</strong><strong>2</strong></Trans><br/><Image src={step14} centered rounded bordered /></List.Item>
			<List.Item>{t('chatbot.setting.facebook.steps._15')}</List.Item>
		</List>
	}

	render() {
		const { t, user, user: {packages} } = this.props
		const { info, copied, loading, show} = this.state

		const facebookWebhook = `https://${process.env.REACT_APP_WEBHOOK_HOST}/facebook/${info.vendor_id}`

		const currentPaidtype = _.find(packages, p => p.name === user.paid_type)		
		const isActivable = (currentPaidtype && currentPaidtype.third_party.find(el => el.name === 'Facebook'))

		return <Grid className='integration-page'>
		<Grid.Row columns='equal'>
			<Grid.Column><Header>Facebook</Header></Grid.Column>
			<Grid.Column floated='right'>
			{isActivable ? 
				<Label color='green' style={{ float: 'right'}}><Icon name='check' /> {t('chatbot.integration.activated')}</Label>
			: <Label color='grey' basic style={{ float: 'right'}}><Icon name='exclamation' /> {t('chatbot.setting.unavailable')}</Label>}
			</Grid.Column>
		</Grid.Row>
		<Grid.Row>
			<Grid.Column>
				<Form onSubmit={this.handleSubmit.bind(this, 'facebook')}>
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
						disabled={!isActivable}
						value={info.facebook ? info.facebook.token : ''}
						onChange={this.handleChange.bind(this, 'facebook')}
					/>
					<Form.Input
						type='text'
						name='verify_str'
						id='verify_token_field'
						label={t('chatbot.setting.facebook.verify')}
						disabled={!isActivable}
						value={info.facebook ? info.facebook.verify_str : ''}
						onChange={this.handleChange.bind(this, 'facebook')}
					/>
					<Button loading={loading} primary disabled={!isActivable}>
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
		</Grid.Row></Grid>
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
	connect(mapStateToProps, { facebookRead }),
	translate(),
	toJS
)(FBIntegration)