import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { login } from 'actions/agent';
import { cancelLogin } from 'actions/auth'
import { hideAllMessages } from 'actions/message'
import InlineError from 'components/messages/InlineError';
import { Link } from 'react-router-dom';
import { compose } from 'recompose'
import { translate } from 'react-i18next';
import logo from 'styles/img/logo.png'
import toJS from 'components/utils/ToJS'
import {
	Container,
	Input,
	Form,
	Button,
	Segment,
	Message,
	Image,
	Modal
} from 'semantic-ui-react';

class LoginPage extends React.Component {
	// react-router will pass history in components
	submit = (data, kick = false) =>
		this.props.login(data, kick)
			.then(() => this.props.history.push('/agent/dashboard'))
	
	state = {
		data: {},
		loading: false,
		errors: {}
	}

	componentWillUnmount = () => {
		this.removeLoading = () => {}
	}

	removeLoading = () => {
		this.setState({ loading: false })
	}

	onChange = e => {
		this.setState({
			data: { ...this.state.data, [e.target.name]: e.target.value }
		})
	}

	onSubmit = (kick = false, e) => {
		const errors = this.validate(this.state.data);
		const { dismissError } = this.props
		this.setState({ errors })
		if (Object.keys(errors).length === 0) {
			this.setState({ loading: true })
			this.submit(this.state.data, kick)
				.then(data => {
					dismissError()
					this.removeLoading()
				}, err => {
					const updateState = { loading: false }
					if (err && err.response && err.response.data) {
						updateState.errors = { api: err.response.data.errors }
					}
					this.setState(updateState)
				})
		}
		return false
	}

	onKick = e => {
		e.preventDefault()
		this.onSubmit(true, e)
	}

	onCancelKick = e => {
		e.preventDefault()
		this.props.cancelLogin()
	}

	validate = (data) => {
		const errors = {}
		const { t } = this.props

		if (!data.username)
			errors.username = t('errors.mail.blank')

		if (!data.password)
			errors.password = t('errors.password.blank')

		return errors
	}

	render() {
		const { errors, loading} = this.state
		const { t, messages, promptKick, kickMessage } = this.props
		return (
			<Container>
				<div className='login-container'>
					<Modal
						open={promptKick}
						onClose={this.onCancelKick}
						header={t('login.kickPrompt.header')}
						content={kickMessage}
						actions={[
							{
								key: 'continue',
								content: t('login.kickPrompt.confirm'),
								primary: true,
								autoFocus: true,
								onClick: this.onKick
							},
							{
								key: 'cancel',
								content: t('login.kickPrompt.cancel'),
								onClick: this.onCancelKick
							}
						]}
					/>
					<Segment textAlign='center'>
						<h2> <Image src={logo} size='mini' inline /> Lingtelli Chatbot </h2>
						<h3>Agent Login</h3>
						{errors.api && (
							<Message negative>
								<p>{errors.api}</p>
							</Message>
						)}
						{messages.showing && (
							<Message negative>
								<p>{messages.message}</p>
							</Message>
						)}
						<Form size='small' onSubmit={this.onSubmit.bind(null, false)} loading={loading}>
							<Form.Field error={!!errors.username}>
								<Input
									icon='mail'
									iconPosition='left'
									type='text'
									name='username'
									placeholder={t('register.mail')}
									onChange={this.onChange}
									autoFocus={true}
								/>
								{errors.username && <InlineError text={errors.username} />}
							</Form.Field>
							<Form.Field error={!!errors.password}>
								<Input
									icon='lock'
									iconPosition='left'
									type='password'
									name='password'
									placeholder={t('register.password')}
									onChange={this.onChange}
								/>
								{errors.password && <InlineError text={errors.password} />}
							</Form.Field>
							<Button fluid primary>{t('login.loginBtn')}</Button>
						</Form>
					</Segment>
					<Link to='/login'>Member Login</Link>
				</div>
			</Container>
		)
	}
}

LoginPage.propTypes = {
	history: PropTypes.shape({
		push: PropTypes.func.isRequired
	}).isRequired,
	login: PropTypes.func.isRequired
}

const mapStateToProps = (state, props) => ({
	messages: state.get('messages'),
	promptKick: state.getIn(['user', 'promptKick']),
	kickMessage: state.getIn(['user', 'kickMessage'])
})

export default compose(
	connect(mapStateToProps, { login, cancelLogin, dismissError: hideAllMessages }),
	toJS,
	translate()
)(LoginPage)