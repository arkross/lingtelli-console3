import React, {Fragment} from 'react';
import _ from 'lodash'
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import { Segment, Form, Button, Icon, Message, Label, Modal, Divider, Grid, Statistic } from 'semantic-ui-react';
import { updateUser, resetPassword, fetchDetail } from 'actions/user'
import { showInfo, showError } from 'actions/message'
import Validator from 'utils/Validator'
import toJS from 'components/utils/ToJS'

class AboutForm extends React.Component {
	constructor(props) {
		super(props)

		this.state = {
			loading: false,
			showSuccess: false,
			showModal: false,
			errors: {
				username: {},
				first_name: {},
				repassword: {}
			},
			form: {
				username: '',
				first_name: '',
				password: '',
				password2: '',
				repassword: '',
				paid_type: 'Pro',
				start_date: '2018-11-30',
				expire_date: '2019-11-30'
			}
		}
	}

	componentDidMount() {
		this.setState({form: {...this.state.form, ...this.props.user}})
	}

	componentWillReceiveProps(nextProps) {
		this.setState({form: {...this.state.form, ...nextProps.user}})
	}

	validate(data) {
		const config = {
			username: {
				name: 'account.form.mail',
				rules: ['required', 'email']
			},
			first_name: {
				name: 'account.form.nickname',
				rules: ['required', {range: [5, 10]}]
			},
			password: {
				name: 'account.form.password',
				rules: []
			},
			password2: {
				name: 'account.form.password2',
				rules: []
			},
			repassword: {
				name: 'account.form.repassword',
				rules: [{match: 'password2'}]
			}

		}
		return Validator(config, data)
	}

	closeModal = () => {
		this.props.onResetPassword()
	}

	onChange = (e, {name, value}) => {
		this.setState({
			form: {...this.state.form, [name]: value}
		})
	}

	onSubmit = e => {
		const { form } = this.state
		const { showInfo, t } = this.props
		const errors = this.validate(form)
		const hasError = _.reduce(errors, (acc, o) => {
			return acc || o.error
		}, false)
		if (hasError) {
			this.setState({errors})
			return false
		}
		
		// Update username
		this.setState({loading: true, errors: errors})

		if (form.password2) {
			this.props.resetPassword({
				old_password: form.password,
				password: form.password2
			}).then(() => {
				this.setState({loading: false, showSuccess: true, showModal: true})
			}) 
		}

		this.props.updateUser({
			first_name: form.first_name
		})
		.then(() => {
			showInfo(t('account.success'))
			this.setState({loading: false})
		}, err => {
			this.setState({ loading: false })
		})
	}

	render = () => {
		const { t, bots, user: {packages} } = this.props
		const { loading, showSuccess, errors, form, showModal } = this.state
		const labelColors = {
			'Trial': 'grey',
			'Basic': 'blue',
			'Pro': 'teal'
		}
		const botCount = Object.keys(bots).length
		const faqCount = _.reduce(bots, (acc, bot) => (acc += (bot && bot.group && bot.group.groups && bot.group.groups.length)	 || 0), 0)
		const currentPaidtype = _.find(packages, p => p.name === form.paid_type)
		const botLimit = currentPaidtype ? currentPaidtype.bot_amount : 0
		const faqLimit = currentPaidtype ? currentPaidtype.faq_amount : 0
		return (
			<Form success={showSuccess} loading={loading}>
				<Grid columns={2} divided='vertically'>
					<Grid.Row>
						<Grid.Column>
							<Label size='large' color={labelColors[form.paid_type]}>{form.paid_type}</Label>
							{form.paid_type !== 'Trial' && <Fragment><p>{t('account.activation_date')}: {form.start_date}<br/>{t('account.expiration_date')}: {form.expire_date}</p></Fragment>}
						</Grid.Column>
						<Grid.Column>
							<Statistic.Group>
								<Statistic>
									<Statistic.Value>
										{botCount} / {botLimit}
									</Statistic.Value>
									<Statistic.Label>
										{t('account.bot_limit')}
									</Statistic.Label>
								</Statistic>
								<Statistic>
									<Statistic.Value>
										{faqCount} / {faqLimit}
									</Statistic.Value>
									<Statistic.Label>
										{t('account.faq_limit')}
									</Statistic.Label>
								</Statistic>
							</Statistic.Group>
						</Grid.Column>
					</Grid.Row>
					<Grid.Row>
						<Grid.Column>
							{t('account.profile')}
						</Grid.Column>
						<Grid.Column>
							<Form.Field>
								<Form.Input
									label={t('account.form.mail')}
									type='text'
									name='username'
									placeholder={t('account.form.mail_placeholder')}
									value={form.username}
									onChange={this.onChange}
									error={errors.username.error}
									readOnly
								/>
								{errors.username.error && <Label color='red' pointing>{errors.username.messages.join(' ')}</Label>}
							</Form.Field>
							<Form.Field>
								<Form.Input
									label={t('account.form.nickname')}
									type='text'
									name='first_name'
									placeholder={t('account.form.nickname_placeholder')}
									value={form.first_name}
									onChange={this.onChange}
									error={errors.first_name.error}
								/>
								{errors.first_name.error && <Label color='red' pointing>{errors.first_name.messages.join(' ')}</Label>}
							</Form.Field>
						</Grid.Column>
					</Grid.Row>
					<Grid.Row>
						<Grid.Column>{t('account.form.password_reset')}
						</Grid.Column>
						<Grid.Column>
							<Form.Field>
								<Form.Input
									label={t('account.form.password')}
									type='password'
									name='password'
									placeholder={t('account.form.password_placeholder')}
									value={form.password}
									onChange={this.onChange}
									error={errors.repassword.error}
								/>
							</Form.Field>
							<Form.Field>
								<Form.Input
									label={t('account.form.password2')}
									type='password'
									name='password2'
									placeholder={t('account.form.password2_placeholder')}
									value={form.password2}
									onChange={this.onChange}
									error={errors.repassword.error}
								/>
							</Form.Field>
							<Form.Field>
								<Form.Input
									label={t('account.form.repassword')}
									type='password'
									name='repassword'
									placeholder={t('account.form.repassword_placeholder')}
									value={form.repassword}
									onChange={this.onChange}
									error={errors.repassword.error}
								/>
								{errors.repassword.error && <Label color='red' pointing>{errors.repassword.messages.join(' ')}</Label>}
							</Form.Field>
						</Grid.Column>
					</Grid.Row>
				</Grid>
				<Button floated='right' primary onClick={this.onSubmit}>
					<Icon name='checkmark' />
					{t('account.form.submit')}
				</Button>
				<Modal
					open={showModal}
					closeOnEscape={false}
					closeOnRootNodeClick={false}
					onClose={this.closeModal}>
					<Modal.Content>{t('account.confirmation.reset_password')}</Modal.Content>
					<Modal.Actions>
						<Button primary onClick={this.closeModal}><Icon name='checkmark'></Icon> {t('login.loginBtn')}</Button>
					</Modal.Actions>
				</Modal>
			</Form>
		)
	}

}

const mapStateToProps = (state) => ({
	user: state.get('user'),
	bots: state.getIn(['bot', 'bots'])
})

export default compose(
	translate('translations'),
	connect(mapStateToProps, {updateUser, resetPassword, fetchDetail, showInfo, showError}),
	toJS
)(AboutForm);
