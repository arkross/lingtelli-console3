import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { login } from 'actions/agent';
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
	Image
} from 'semantic-ui-react';

class LoginPage extends React.Component {
	// react-router will pass history in components
	submit = data =>
		this.props.login(data)
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

	onSubmit = e => {
		const errors = this.validate(this.state.data);
		const { dismissError } = this.props
		this.setState({ errors })
		if (Object.keys(errors).length === 0) {
			this.setState({ loading: true })
			this.submit(this.state.data)
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
		const { t, messages } = this.props
		return (
			<Container>
				<div className='login-container'>
					<Segment textAlign='center'>
						<h2> <Image src={logo} size='mini' inline /> Lingtelli Agent </h2>
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
						<Form size='small' onSubmit={this.onSubmit} loading={loading}>
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
							<Button fluid color='teal'>{t('login.loginBtn')}</Button>
						</Form>
					</Segment>
				</div>
			</Container>
		)
	}
}

LoginPage.propTypes = {
	history: PropTypes.shape({
		push: PropTypes.func.isRequired
	}).isRequired,
	login: PropTypes.func.isRequired,
}

const mapStateToProps = (state, props) => ({
	messages: state.get('messages')
})

export default compose(
	connect(mapStateToProps, { login, dismissError: hideAllMessages }),
	toJS,
	translate()
)(LoginPage)