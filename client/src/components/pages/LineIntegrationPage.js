import React, {Component, Fragment} from 'react'
import _ from 'lodash'
import {List, Image, Icon, Grid, Form, Header, Button, Label} from 'semantic-ui-react'
import { compose } from 'recompose'
import { translate, Trans} from 'react-i18next'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import toJS from '../utils/ToJS'
import { updateBot } from 'actions/bot'
import { CopyToClipboard } from 'react-copy-to-clipboard'

class LineIntegration extends Component {

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
		const { supportPlatforms, t, match } = this.props
		const { info, info: {platform: activatedPlatforms}, copied, loading, show} = this.state
		const currentPlatforms = _.filter(supportPlatforms, plat => _.find(activatedPlatforms, p => p == plat.id))
		
		const lineWebhook = `${process.env.REACT_APP_WEBHOOK_HOST}/line/${info.vender_id}`
		const lineActive = !!_.find(currentPlatforms, plat => plat.name == 'Line')

		return <Grid className='integration-page'><Grid.Row>
			<Grid.Column width={12}><Header>LINE</Header></Grid.Column>
			<Grid.Column floated='right' width={3}>
				<Button floated='right' onClick={this.handleToggle.bind(this, 'Line')} color={lineActive ? 'green' : 'grey'} icon={lineActive ? 'check' : 'remove'} content={lineActive ? t('chatbot.integration.activated') : t('chatbot.integration.inactive')}
				/>
			</Grid.Column>
		</Grid.Row>
		<Grid.Row>
			<Grid.Column>
				<Form onSubmit={this.handleSubmit.bind(this, 'line')}>
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
					<Button loading={loading} primary disabled={!lineActive}>
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
		</Grid.Row></Grid>
	}
}

const mapStateToProps = (state, props) => ({
	activeBot: props.match.params.id,
	info: state.getIn(['bot', 'bots', props.match.params.id]) || {},
	supportPlatforms: state.getIn(['bot', 'supportPlatforms']) || []
})
export default compose(
	withRouter,
	connect(mapStateToProps, { updateBot }),
	translate(),
	toJS
)(LineIntegration)