import React, {Component, Fragment} from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import { Switch, Route, Redirect } from 'react-router-dom'
import { fetchTemplates, fetchTemplateFields } from '../../../actions/user';
import { createBot, fieldFaq, fetchAllBotDetails } from '../../../actions/bot'
import {
	List,
	Button,
	Container,
	Form,
	Header,
	Label,
	Loader,
	Modal,
	Message,
	Input,
} from 'semantic-ui-react';
import _ from 'lodash'
import toJS from 'components/utils/ToJS'

class CreateFromTemplatePage extends Component {
	constructor(props) {
		super(props)
		this.state = {
			newBotId: null,
			openSuccessModal: false,
			openFailModal: false,
			loading: false,
			selectedTemplate: null,
			basicData: {},
			fields: {}
		}
	}

	handleSelectTemplate = id => {
		this.setState({
			selectedTemplate: id,
			loading: true
		})
		return this.props.fetchTemplateFields(id).then(() => {
			const template = _.find(this.props.templates, template => template.id === parseFloat(id))
			this.setState({
				basicData: template,
				fields: template ? template.fields.reduce((acc, el) => ({...acc, ...el}), {}) : [],
				loading: false
			})
		})
	}

	handleBasicDataChange = ({target: {name, value}}) => {
		this.setState({
			basicData: {...this.state.basicData, [name]: value}
		})
	}

	handleFieldChange = ({target: {name, value}}) => {
		this.setState({
			fields: {...this.state.fields, [name]: value}
		})
	}

	handleSubmit = async () => {
		const { createBot, fieldFaq, history, fetchAllBotDetails } = this.props
		const { basicData, selectedTemplate, fields } = this.state
		this.setState({ loading: true })
		try {
			const newBotData = await createBot({
				robot_name: basicData.robot_name,
				greeting_msg: basicData.greeting_msg,
				failed_msg: basicData.failed_msg,
				postback_title: basicData.postback_title,
				language: basicData.language
			})
			await fieldFaq(newBotData.id, selectedTemplate, fields)
			await fetchAllBotDetails()
			this.setState({ loading: false, openSuccessModal: true, newBotId: newBotData.id })
		} catch (err) {
			this.setState({ loading: false, openFailModal: true })
		}
	}

	handleSuccessModalSubmit = e => {
		this.props.history.push(`/dashboard/bot/${this.state.newBotId}/faq`)
	}

	handleFailModalSubmit = e => {
		this.setState({ openFailModal: false })
	}

	render() {
		const { match, t, templates, user, packages, bots } = this.props
		const { loading, openSuccessModal, openFailModal } = this.state

		const currentPaidtype = _.find(packages, p => p.name === user.paid_type)
		const bot_limit = (user.paid_type && currentPaidtype && currentPaidtype.bot_amount > 0) ? currentPaidtype.bot_amount : Infinity
		const botLimitText = bot_limit === Infinity ? '∞' : bot_limit
		const botCount = Object.keys(bots).length

		return <Fragment>
			<Modal open={openSuccessModal} size='tiny' onClose={this.handleSuccessModalSubmit}>
				<Modal.Content>{t('fromTemplate.success')}</Modal.Content>
				<Modal.Actions>
					<Button onClick={this.handleSuccessModalSubmit} primary autoFocus>{t('fromTemplate.successSubmit')}</Button>
				</Modal.Actions>
			</Modal>
			<Modal open={openFailModal} size='tiny' onClose={this.handleFailModalSubmit}>
				<Modal.Content>{t('fromTemplate.fail')}</Modal.Content>
				<Modal.Actions>
					<Button onClick={this.handleFailModalSubmit} primary autoFocus>{t('fromTemplate.failSubmit')}</Button>
				</Modal.Actions>
			</Modal>
			<Switch>
				<Route path={`${match.path}`} exact render={props => <TemplateStepOne
					t={t} {...props}
					templates={templates}
					botCount={botCount}
					botLimit={botLimitText}
					/>} />
				<Route path={`${match.path}/:templateId([0-9]+)`} render={props => <TemplateChosenWrapper t={t} {...props}
					loading={loading}
					selectTemplate={this.handleSelectTemplate}
					basicData={this.state.basicData}
					fields={this.state.fields}
					onBasicDataChange={this.handleBasicDataChange}
					onFieldChange={this.handleFieldChange}
					onSubmit={this.handleSubmit} templates={templates}
					/>} />
				<Route render={props => <Redirect to={match.path} />} />
			</Switch>
		</Fragment>
	}
}

const mapStateToProps = (state) => ({
	user: state.getIn(['user']),
	templates: state.getIn(['template']),
	bots: state.getIn(['bot', 'bots']),
	packages: state.getIn(['user', 'packages'])
})

class TemplateStepOne extends Component {
	handleChooseTemplate = (id, e) => {
		e.preventDefault()
		this.props.history.push(`${this.props.match.url}/${id}/basic`)
	}
	render() {
		const { templates, t, botCount, botLimit } = this.props
		return <Container text>
			<Header>{t('fromTemplate.chooseTemplate')}</Header>
			<Label>{t('chatbot.create.bot_count')}: {botCount}/{botLimit}</Label>
			<List divided verticalAlign='middle' size='large'>
			{_.map(templates, template => <List.Item key={template.id}>
				<List.Content floated='right'>
					<Button disabled={!template.available} content={t('fromTemplate.useTemplate')} onClick={this.handleChooseTemplate.bind(null, template.id)} />
				</List.Content>
				<List.Content>
					<List.Header>{template.robot_name}</List.Header>
					<List.Description>{t('fromTemplate.qaCount')}: {template.faq_count}</List.Description>
				</List.Content>
			</List.Item>)}
			</List>
		</Container>
	}
}

class TemplateChosen extends Component {

	async componentWillMount() {
		await this.props.selectTemplate(this.props.match.params.templateId)
	}

	render() {
		const { match, t, templates, loading } = this.props
		return (!loading ?
			<Switch>
			<Route path={`${match.path}/basic`} exact render={props => <TemplateStepTwo
				basicData={this.props.basicData}
				onBasicDataChange={this.props.onBasicDataChange} {...props} t={t} templates={templates} />} />
			<Route path={`${match.path}/fields`} exact render={props => <TemplateStepThree
				basicData={this.props.basicData}
				fields={this.props.fields}
				onFieldChange={this.props.onFieldChange}
				onSubmit={this.props.onSubmit} {...props} t={t} templates={templates} />} />
			<Route path={match.path} render={props => <Redirect to={`${match.url}/basic`} />} />
			<Route render={props => <Redirect to={match.url} />} />
		</Switch> : <Loader active={loading} content={t('loader.fetching')} />)
	}
}

const TemplateChosenWrapper = connect(null, { fetchTemplateFields })(TemplateChosen)

class TemplateStepTwo extends Component {
	constructor(props) {
		super(props)
		const template = props.match.params.templateId ? _.find(props.templates, template => template.id === parseFloat(props.match.params.templateId)) : {}
		this.state = {
			data: template || {},
			errors: {
				robot_name: '',
				greeting_msg: '',
				failed_msg: '',
				postback_title: '',
				language: ''
			}
		}
	}

	handleChange = e => {
		return this.props.onBasicDataChange(e)
	}

	handleValidation = () => {
		let result = true
		let newState = {}
		const { basicData } = this.props
		_.forEach(this.state.errors, (field, key) => {
			if ( ! basicData[key]) {
				result = false
				newState[key] = true
			} else {
				newState[key] = false
			}
		})
		this.setState({ errors: newState })
		return result
	}

	handleNext = e => {
		e.preventDefault()
		if (this.handleValidation()) {
			this.props.history.push(`${this.props.match.url.replace('/basic', '')}/fields`)
		}
	}

	handlePrev = e => {
		this.props.history.push(`/dashboard/bot/fromTemplate`)
	}

	render() {
		const { t, basicData: data } = this.props
		
		const { errors } = this.state
		const allowedLanguages = ['tw', 'cn']
		const onChange = this.handleChange
		return <Container text>
			<Button icon='arrow left' labelPosition='left' content={t('fromTemplate.prev')} onClick={this.handlePrev} />
			<Button icon='arrow right' labelPosition='right' floated='right' content={t('fromTemplate.next')} onClick={this.handleNext} />
			<Header>{t('fromTemplate.enterBasicInfo')}</Header>
			<Form>
				<Form.Field required error={errors.robot_name}>
					<label htmlFor='field_robot_name'>{t('chatbot.name')}</label>
					<input type='text' name='robot_name' id='field_robot_name' placeholder={t('chatbot.placeholder.name')} maxLength={15} onChange={onChange} value={data.robot_name} required/>
				</Form.Field>
				<Form.Field required error={errors.greeting_msg}>
					<label htmlFor='field_greeting_msg'>{t('chatbot.greetingMsg')}</label>
					<input type='text' name='greeting_msg' id='field_greeting_msg' placeholder={t('chatbot.placeholder.greetingMsg')} maxLength={50} onChange={onChange} value={data.greeting_msg} required />
				</Form.Field>
				<Form.Field required error={errors.failed_msg}>
					<label htmlFor='field_failed_msg'>{t('chatbot.failedMsg')}</label>
					<input type='text' name='failed_msg' id='field_failed_msg' placeholder={t('chatbot.placeholder.failedMsg')} maxLength={50} onChange={onChange} value={data.failed_msg} required />
				</Form.Field>
				<Form.Field required error={errors.postback_title}>
					<label htmlFor='field_postback_title'>{t('chatbot.postbackMsg')}</label>
					<input type='text' name='postback_title' id='field_postback_title' placeholder={t('chatbot.placeholder.postbackMsg')} maxLength={50} onChange={onChange} value={data.postback_title} required />
				</Form.Field>
				<Form.Field required>
					<Form.Group grouped>
						<label>{t('chatbot.selectLanguage')}</label>
						{
						allowedLanguages.map(el => <Form.Radio
							name='language'
							key={`chatbot.language.${el}`}
							label={t(`chatbot.language.${el}`)}
							value={el}
							checked={data.language === el}
							onChange={onChange.bind(this, {target: {name: 'language', value: el}})}
							error={errors.language ? true : false}
						/>)
						}
						{errors.language && <Label color='red' pointing='left'>{errors.language}</Label>}
					</Form.Group>
				</Form.Field>
			</Form>
		</Container>
	}
}

class TemplateStepThree extends Component {
	constructor(props) {
		super(props)
		_.forEach(props.basicData, field => {
			if ( ! field) {
				this.handlePrev()
			}
		})
	}
	handlePrev = e => {
		e && e.preventDefault()
		this.props.history.push(`${this.props.match.url.replace('/fields', '')}/basic`)
	}
	handleNext = e => {
		e.preventDefault()
		return this.props.onSubmit(e)
	}
	handleChange = e => {
		return this.props.onFieldChange(e)
	}
	render() {
		const { t, fields } = this.props
		return <Container text>
			<Button icon='arrow left' labelPosition='left' content={t('fromTemplate.prev')} onClick={this.handlePrev} />
			<Button floated='right' primary icon='check' labelPosition='right' content={t('fromTemplate.finish')} onClick={this.handleNext} />
			<Header>{t('fromTemplate.enterQADetails')}</Header>
			{(fields && _.keys(fields).length) ?
			<Form style={{paddingBottom: '100px'}}>
				{_.map(fields, (value, key) => <Form.Field key={key}>
					<label htmlFor={`${key}_field`}>{key}</label>
					<Input id={`${key}_field`} name={key} value={value} onChange={this.handleChange} />
				</Form.Field>)}
			</Form> : <Message info>{t('fromTemplate.noFields')}</Message>}
		</Container>
	}
}

export default compose(
	translate(),
	connect(mapStateToProps, { fetchTemplates, fetchTemplateFields, fieldFaq, createBot, fetchAllBotDetails }),
	toJS
)(CreateFromTemplatePage)