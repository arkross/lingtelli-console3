import React from 'react';
import Validator from 'validator';
import propTypes from 'prop-types';
import InlineError from 'components/messages/InlineError';
import { Link } from 'react-router-dom';
import { compose } from 'recompose'
import { translate } from 'react-i18next';
import logo from 'styles/img/logo.png'
import { connect} from 'react-redux'
import toJS from 'components/utils/ToJS'
import {
	Input,
	Form,
	Button,
	Segment,
	Message,
	Image
} from 'semantic-ui-react';


class LoginForm extends React.Component {
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
		});
	}

	onSubmit = e => {
		const errors = this.validate(this.state.data);
		const { dismissError } = this.props
		this.setState({ errors })
		if (Object.keys(errors).length === 0) {
			this.setState({ loading: true })
			this.props
				.submit(this.state)
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
		const errors = {};
		const { t } = this.props;

		if (!data.email)
			errors.email = t('errors.mail.blank');
		else if (!Validator.isEmail(data.email))
			errors.email = t('errors.mail.invalid');

		if (!data.password)
			errors.password = t('errors.password.blank');

		return errors
	};

	render() {
		const { t, messages }  = this.props;
		const { errors, loading } = this.state;

		return (
			<div className='login-container'>
				<Segment textAlign='center'>
					<h2> <Image src={logo} size='mini' inline /> Lingtelli Chatbot </h2>
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
						<Form.Field error={!!errors.email}>
							<Input
								icon='mail'
								iconPosition='left'
								type='email'
								name='email'
								placeholder={t('register.mail')}
								onChange={this.onChange}
								autoFocus={true}
							/>
							{errors.email && <InlineError text={errors.email} />}
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
					<Message size='small'>
						{t('login.description')}
						<Link to='/signup'>{t('login.signUp')}</Link>
					</Message>
				</Segment>
			</div>
		)
	}
}

LoginForm.propTypes = {
	submit: propTypes.func.isRequired
};

const mapStateToProps = (state) => ({
	messages: state.get('messages')
})

export default compose(
	connect(mapStateToProps),
	toJS,
	translate()
)(LoginForm)
