import React, {Component, Fragment} from 'react'
import _ from 'lodash'
import {Image, Icon, Grid, Header, Button, Message, Segment, Form, FormField, Input, TextArea, Label, List} from 'semantic-ui-react'
import { compose } from 'recompose'
import { translate, Trans} from 'react-i18next'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import toJS from '../utils/ToJS'
import { updateBot, fetchBot } from '../../actions/bot'
import { CopyToClipboard } from 'react-copy-to-clipboard'

class WebIntegration extends Component {

	constructor(props) {
		super(props)
		this.counter = 0
		this.state = {
			loading: false,
			info: props.info,
			preview: {
				robotIcon: '',
				chatIcon: '',
				headerBackgroundColor: '',
				headerTextColor: '',
				chatLabel: '',
			},
			domains: [],
			newDomain: '',
			newDomainLoading: false,
			copied: false,
			robotIcon: '',
			chatIcon: '',
			headerBackgroundColor: '',
			headerTextColor: '',
			chatLabel: '',
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
			this.setState({ info: nextProps.info, domains: (nextProps.info.domain ? nextProps.info.domain.split(',').map(el => ({
				name: el,
				isDeleting: false,
				isLoading: false
			})) : []) })
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

	handleNewDomainChange = (e, { value }) => {
		this.setState({
			newDomain: value
		})
	}

	handleNewDomainSubmit = () => {
		const finalDomains = [...this.state.domains.map(el => el.name), this.state.newDomain]
		this.setState({ newDomainLoading: true })
		return this.handleDomainSubmit(finalDomains).then(() => {
			this.setState({ newDomain: '' })
		})
		.finally(() => {
			this.setState({ newDomainLoading: false })
		})
	} 

	handleDomainDelete = index => {
		this.setState({
			domains: _.set([...this.state.domains], [index, 'isDeleting'], true)
		})
	}

	handleDomainConfirmDelete = index => {
		const finalDomains = [...this.state.domains.map(el => el.name)].filter((val, idx) => idx !== index)
		this.setState({ domains: _.set([...this.state.domains], [index, 'isLoading'], true)})
		return this.handleDomainSubmit(finalDomains).catch(() => this.setState({ domains: _.set([...this.state.domains], [index, 'isLoading'], false)}))
	}

	handleDomainCancelDelete = index => {
		this.setState({
			domains: _.set([...this.state.domains], [index, 'isDeleting'], false)
		})
	}

	handleDomainSubmit = finalDomains => {
		return this.props.updateBot(this.state.info.id, _.set(_.cloneDeep(this.state.info), ['domain'], finalDomains.join(','))).then(() => this.props.fetchBot(this.props.activeBot))
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

	getWebTutorial = () => {
		const { t } = this.props
		const step1 = require(`../../assets/img/chatbot/en-us/web/script.PNG`)
		return <Image src={step1} />
	}

	handlePreview = e => {
		const { robotIcon, chatIcon, headerTextColor, headerBackgroundColor, chatLabel } = this.state
		this.setState({
			preview: {
				robotIcon,
				chatIcon,
				headerTextColor,
				headerBackgroundColor,
				chatLabel
			}
		})
	}

	handlePreviewFormChange = (name, e) => {
		const value = e.target.value
		this.setState({[name]: value})
	}

	handlePreviewFileChange = (name, e) => {
		const file = e.target.files[0]
		if (! file ) {
			this.setState({[name]: ''})
			return false
		}
		const fr = new FileReader()
		fr.onload = (evt) => {
			this.setState({[name]: evt.target.result})
		}
		fr.readAsDataURL(file)
	}

	generateScript = () => {
		const { info: { vendor_id } } = this.state
		const { robotIcon, chatIcon, headerTextColor, headerBackgroundColor, chatLabel } = this.state.preview
		const windowData = {
			KEY: vendor_id,
			// KEY: '240b4cd2-b39c-3698-b8db-8abab8da6ba9',
			robotIcon,
			chatIcon,
			headerTextColor,
			headerBackgroundColor,
			chatLabel
		}
		const str = _.reduce(windowData, (acc, o, k) => {
			acc += o && o.trim() && `window.LING_BOT.${k} = '${o}';\n`
			return acc
		}, '')
		const scriptUrl = process.env.REACT_APP_WEBSCRIPT_URL
		// const scriptUrl = 'http://127.0.0.1:5000/static/thrid-party.js'
		return `<script type="text/javascript">
window.LING_BOT = window.LING_BOT || {};
${str}</script>
<script type="text/javascript" src="${scriptUrl}"></script>`
	}

	render() {
		const { supportPlatforms, t, user, user: {packages} } = this.props
		const { info, info: { third_party }, domains, newDomain, newDomainLoading, copied, loading, show, robotIcon, chatIcon, headerTextColor, headerBackgroundColor, chatLabel } = this.state
		const currentPlatforms = _.filter(supportPlatforms, plat => third_party.indexOf(plat.id) >= 0)

		const webScript = this.generateScript()
 
		const webActive = !!_.find(currentPlatforms, plat => plat.name == 'Web')
		const srcDoc = `<!doctype html><html><head></head><body>${webScript}</body></html>`

		const currentPaidtype = _.find(packages, p => p.name === user.paid_type)
		const isActivable = currentPaidtype && currentPaidtype.third_party.find(el => el.name === 'Web')

		return <Fragment><Grid className='integration-page'>
			<Grid.Row columns='equal'>
				<Grid.Column><Header>Web Chat Plugin</Header></Grid.Column>
				<Grid.Column floated='right'>
				{webActive ? 
					<Label color='green' style={{ float: 'right'}}><Icon name='check' /> {t('chatbot.integration.activated')}</Label>
				: <Label color='grey' style={{ float: 'right'}} basic><Icon name='exclamation' /> {t('chatbot.setting.unavailable')}</Label>}
				</Grid.Column>
			</Grid.Row>
			<Grid.Row>
				<Grid.Column>
					<div>{t('chatbot.setting.web.description')}</div>
					<Form>
						<TextArea rows={5} style={{fontFamily: 'monospace', backgroundColor: '#eee'}} value={webScript}></TextArea>
						<br /><br />
						<CopyToClipboard text={webScript}>
							<Button disabled={!webActive} onClick={this.handleCopy} primary>
								<Icon name='copy' />
								{ ! copied ? t('chatbot.copy') : t('chatbot.copied')}
							</Button>
						</CopyToClipboard>
					</Form>
				</Grid.Column>
			</Grid.Row>
			<Grid.Row>
				<Grid.Column>
					<Header>{t('chatbot.setting.web.domains.title')}</Header>
					<p>{t('chatbot.setting.web.domains.description')}</p>
					<List style={{maxWidth: '400px'}} divided>
						{domains.map((domain, key) => <List.Item key={key}>
							{domain.isDeleting ? <Fragment>
								<Button negative loading={domain.isLoading} onClick={this.handleDomainConfirmDelete.bind(null, key)} size='tiny' content={t('chatbot.setting.web.domains.deleteDomain')} />&nbsp;
								{t('chatbot.setting.web.domains.or')}&nbsp;
								<a href='#' onClick={this.handleDomainCancelDelete.bind(null, key)}>{t('chatbot.setting.web.domains.cancel')}</a>
							</Fragment> : <Fragment>
								<List.Content floated='left'>
									{domain.name}
								</List.Content>
								<List.Content floated='right'>
									<a href='#' onClick={this.handleDomainDelete.bind(null, key)}>{t('chatbot.setting.web.domains.delete')}</a>
								</List.Content>
							</Fragment>}
						</List.Item>)}
						<List.Item>
							<Form onSubmit={this.handleNewDomainSubmit}>
								<Input size='small' type='text' loading={newDomainLoading} fluid placeholder='mydomain.com' value={newDomain} onChange={this.handleNewDomainChange} action={<Button icon='plus' content={t('chatbot.setting.web.domains.addDomain')} disabled={!newDomain} onClick={this.handleNewDomainSubmit} />} />
							</Form>
						</List.Item>
					</List>
				</Grid.Column>
			</Grid.Row>
			<Grid.Row>
				<Grid.Column>
					<Header>{t('chatbot.setting.web.customizations')}</Header>
					<Message warning header={t('chatbot.setting.web.custHeader')} content={t('chatbot.setting.web.custDescription')} />
				</Grid.Column>
			</Grid.Row>
		</Grid>
		<Grid stackable>
			<Grid.Row columns={2}>
				<Grid.Column>
					<Form>
						<FormField control={Input} label={t('chatbot.setting.web.robotIcon')} type='file' onChange={this.handlePreviewFileChange.bind(null, 'robotIcon')} />
						<FormField control={Input} label={t('chatbot.setting.web.chatIcon')} type='file' onChange={this.handlePreviewFileChange.bind(null, 'chatIcon')} />
						<FormField control={Input} label={t('chatbot.setting.web.headerBackgroundColor')} type='text' onChange={this.handlePreviewFormChange.bind(null, 'headerBackgroundColor')} value={headerBackgroundColor} placeholder={'#0084FF'} />
						<FormField control={Input} label={t('chatbot.setting.web.headerTextColor')} type='text' onChange={this.handlePreviewFormChange.bind(null, 'headerTextColor')} value={headerTextColor} placeholder={'#FFFFFF'} />
						<FormField control={Input} label={t('chatbot.setting.web.chatLabel')} type='text' onChange={this.handlePreviewFormChange.bind(null, 'chatLabel')} value={chatLabel} />
						<Button content={t('chatbot.setting.web.preview')} icon='eye' color='green' onClick={this.handlePreview} />
					</Form>
				</Grid.Column>
				<Grid.Column>
					<iframe srcDoc={srcDoc} width='330' height='450'></iframe>
				</Grid.Column>
			</Grid.Row>
			<Grid.Row>
				<Grid.Column>
					<a onClick={this.toggleTutorial.bind(this, 'web')} href='#'>
						{show.web ? t('chatbot.integration.hide_tutorial') : t('chatbot.integration.see_tutorial')}
						{ show.web ? <Icon name='caret up' /> : <Icon name='caret down' />}
					</a>
					{ show.web && this.getWebTutorial()}
				</Grid.Column>
			</Grid.Row>
		</Grid></Fragment>
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
	connect(mapStateToProps, { updateBot, fetchBot }),
	translate(),
	toJS
)(WebIntegration)