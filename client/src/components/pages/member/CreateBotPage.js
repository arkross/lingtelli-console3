import React, {Fragment} from 'react';
import InlineMessage from '../../messages/InlineMessage';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import { createBot, fetchAllBotDetails } from '../../../actions/bot'
import { fetchPackages } from 'actions/user';
import {
	Form,
	Label,
	Button,
	Icon,
	Segment,
	Modal,
	Container,
	Responsive,
	Grid
} from 'semantic-ui-react';
import _ from 'lodash'
import toJS from 'components/utils/ToJS'

class CreateBotPage extends React.Component {

	state = {
		loading: false,
		errors: {},
		openModal: false,
		focusedOnce: {
			robotName: false,
			greetingMsg: false,
			failedMsg: false,
			postbackMsg: false
		},
		newId: '',
		data: {
			robotName: '',
			greetingMsg: '',
			failedMsg: '',
			postbackMsg: '',
			language: 'tw',
			packageSelect: -1,
		}
	}

	onChange = ({target: {name, value}}) => {
		const newData = {...this.state.data, [name]: value}
		const newFocused = {...this.state.focusedOnce, [name]: true}
		const errors = this.validate(newData, newFocused)
		this.setState({
			data: newData,
			focusedOnce: newFocused,
			errors
		})
	}

	onPackageSelect = (e, { value }) => {
		this.setState({
			data: { ...this.state.data, packageSelect: value }
		})
	}

	validate = (data, focused, isOnSubmission = false) => {
		const errors = {};
		const { t } = this.props;

		if ((focused.robotName || isOnSubmission) && (!data.robotName || data.robotName.trim().length===0))
			errors.robotName = t('errors.robotName.blank');
		if ((focused.greetingMsg || isOnSubmission) && (!data.greetingMsg|| data.greetingMsg.trim().length===0))
			errors.greetingMsg = t('errors.greetingMsg.blank');
		if ((focused.failedMsg || isOnSubmission) && (!data.failedMsg || data.failedMsg.trim().length===0))
			errors.failedMsg = t('errors.failedMsg.blank');
		if ((focused.language || isOnSubmission) && ( ! data.language || data.language.trim().length === 0)) {
			errors.language = t('errors.language.blank')
		}
		if (data.packageSelect===-1)
			errors.package = t('errors.package.invalid');

		return errors
	}

	componentDidMount() {
		document.title = 'LingBot | Create Bot'
	}

	componentDidUpdate = () => {
		const { data } = this.state
		const { packages } = this.props
		if (data.packageSelect === -1) {
			if (packages && packages.length) {
				const defaultPackage = packages[0]
				this.setState({data: {...this.state.data, packageSelect: defaultPackage.id}})
			}
		}
	}

	componentWillMount() {
		this.setState({ loading: true });
		this.props.fetchPackages()
			.then( () => {
				this.setState({ loading: false })
			}, err => {
				this.packages = <div />
			})
	}

	onCreate = () => {
		const { data } = this.state
		const errors = this.validate(data, this.state.focusedOnce, true)
		this.setState({ errors })
		if (Object.keys(errors).length === 0) {
			this.setState({ loading: true })
			this.props.createBot({
				robot_name: data.robotName,
				failed_msg: data.failedMsg,
				greeting_msg: data.greetingMsg,
				postback_title: data.postbackMsg,
				language: data.language
			})
			.then(data => {
				this.setState({ loading: false, openModal: true, newId: data.id })
				this.modalButton.focus()
			}, err => {
				const error = err.message
				this.setState({errors: {create: error}, loading: false})
			})
		}
	}

	onCloseModal = (e) => {
		e.preventDefault()
		this.setState({openModal: false})
		this.props.fetchAllBotDetails(this.props.user.paid_type)
		this.props.history.push(`/dashboard/bot/${this.state.newId}/faq`)
	}

	render = () => {
		const {
			t,
			packages,
			user,
			bots
		} = this.props

		const currentPaidtype = _.find(packages, p => p.name === user.paid_type)

		const bot_limit = (user.paid_type && currentPaidtype && currentPaidtype.bot_amount > 0) ? currentPaidtype.bot_amount : Infinity
		const botLimitText = bot_limit === Infinity ? '∞' : bot_limit
		const botCount = Object.keys(bots).length

		const { errors, data, openModal, loading } = this.state
		const { packageSelect } = data

		const onChange = this.onChange
		const onCreate = this.onCreate
		const onPackageSelect = this.onPackageSelect
		const onClose = this.onCloseModal

		const allowedLanguages = ['tw', 'cn']

		return (
			<Fragment>
				<Form>
					<Form.Field error={errors.robotName ? true: false}>
						<label htmlFor='field_robotName'>{t('chatbot.name')}</label>
						<input type='text' name='robotName' id='field_robotName' placeholder={t('chatbot.placeholder.name')} maxLength={15} onChange={onChange} value={data.robotName}/>
						{errors.robotName && <Label color='red' pointing>{errors.robotName}</Label>}
					</Form.Field>
					<Form.Field error={errors.greetingMsg ? true : false}>
						<label htmlFor='field_greetingMsg'>{t('chatbot.greetingMsg')}</label>
						<input type='text' name='greetingMsg' id='field_greetingMsg' placeholder={t('chatbot.placeholder.greetingMsg')} maxLength={50} onChange={onChange} />
						{errors.greetingMsg && <Label color='red' pointing>{errors.greetingMsg}</Label>}
					</Form.Field>
					<Form.Field error={errors.failedMsg ? true : false}>
						<label htmlFor='field_failedMsg'>{t('chatbot.failedMsg')}</label>
						<input type='text' name='failedMsg' id='field_failedMsg' placeholder={t('chatbot.placeholder.failedMsg')} maxLength={50} onChange={onChange} />
						{errors.failedMsg && <Label color='red' pointing>{errors.failedMsg}</Label>}
					</Form.Field>
					<Form.Field error={errors.postbackMsg ? true : false}>
						<label htmlFor='field_postbackMsg'>{t('chatbot.postbackMsg')}</label>
						<input type='text' name='postbackMsg' id='field_postbackMsg' placeholder={t('chatbot.placeholder.postbackMsg')} maxLength={50} onChange={onChange} />
						{errors.postbackMsg && <Label color='red' pointing>{errors.postbackMsg}</Label>}
					</Form.Field>
					<Form.Field>
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
				<Responsive as={Grid} minWidth={Responsive.onlyTablet.minWidth}>
					<Grid.Row columns='equal'>
						<Grid.Column>
							{t('chatbot.create.bot_count')}: {botCount}/{botLimitText}
						</Grid.Column>
						<Grid.Column>
							<Button
								disabled={botCount >= bot_limit}
								floated='right'
								primary
								loading={loading}
								onClick={onCreate}>
								<Icon name='checkmark' />
								{t('chatbot.create.btns.create')}
							</Button>
						</Grid.Column>
					</Grid.Row>
				</Responsive>
				<Responsive as={Grid} maxWidth={Responsive.onlyMobile.maxWidth}>
					<Grid.Row>
						<Grid.Column>
							{t('chatbot.create.bot_count')}: {botCount}/{botLimitText}
							<br /><br />
							<Button
								disabled={botCount >= bot_limit}
								floated='right'
								primary
								fluid
								loading={loading}
								onClick={onCreate}>
								<Icon name='checkmark' />
								{t('chatbot.create.btns.create')}
							</Button>
						</Grid.Column>
					</Grid.Row>
				</Responsive>
				<div style={{ clear: 'both'}}></div>
				<Modal open={openModal} size='tiny' onClose={onClose}>
					<Modal.Content>
					{t('chatbot.success')}
					</Modal.Content>
					<Modal.Actions>
						<Button onClick={onClose} primary ref={(el => this.modalButton = el)}>{t('chatbot.create.close')}</Button>
					</Modal.Actions>
				</Modal>
			</Fragment>
		)
	}
}

const mapStateToProps = (state) => ({
	packages: state.getIn(['user', 'packages']),
	user: state.getIn(['user']),
	bots: state.getIn(['bot', 'bots'])
})

export default compose(
	translate('translations'),
	connect(mapStateToProps, { fetchPackages, createBot, fetchAllBotDetails }),
	toJS
)(CreateBotPage);
