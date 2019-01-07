import React from 'react';
import InlineMessage from '../messages/InlineMessage';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import { createBot, fetchAllBotDetails } from '../../actions/bot'
import { fetchPackages } from 'actions/user';
import {
	Form,
	Label,
	Button,
	Icon,
	Segment,
	Modal,
	Container
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
				console.log('Failed to load packages')
				this.packages = <div />
				return err.response.data.errors
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
			.then(() => {
				this.setState({ loading: false, openModal: true })
				this.modalButton.focus()
			})
			.catch(err => {
				const error = err.message
				this.setState({errors: {create: error}, loading: false})
				console.log('Failed to create bot', error);
			})
		}
	}

	onCloseModal = (e) => {
		e.preventDefault()
		this.setState({openModal: false})
		this.props.history.push('/')
	}

	render = () => {
		const {
			t,
			packages,
			user,
			bots
		} = this.props

		const currentPaidtype = _.find(packages, p => p.name === user.paid_type)

		const bot_limit = user.paid_type ? currentPaidtype.bot_amount : 5
		const botCount = Object.keys(bots).length

		const { errors, data, openModal, loading } = this.state
		const { packageSelect } = data

		const onChange = this.onChange
		const onCreate = this.onCreate
		const onPackageSelect = this.onPackageSelect
		const onClose = this.onCloseModal

		const allowedLanguages = ['tw', 'cn']

		return (
			<Segment>
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
						<Form.Group inline>
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
				<div>
					<Label color={botCount < bot_limit ? 'green' : 'red'} size='large' basic>
						{t('chatbot.create.bot_count')} : {botCount} / {bot_limit}
					</Label>
					<Button
						disabled={botCount >= bot_limit}
						floated='right'
						primary
						loading={loading}
						onClick={onCreate}>
						<Icon name='checkmark' />
						{t('chatbot.create.btns.create')}
					</Button>
				</div>
				<div style={{ clear: 'both'}}></div>
				<Modal open={openModal} size='tiny' onClose={onClose}>
					<Modal.Content>
					{t('chatbot.success')}
					</Modal.Content>
					<Modal.Actions>
						<Button onClick={onClose} primary ref={(el => this.modalButton = el)}>{t('chatbot.create.close')}</Button>
					</Modal.Actions>
				</Modal>
			</Segment>
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
