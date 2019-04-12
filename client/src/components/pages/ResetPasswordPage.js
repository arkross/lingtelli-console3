import React, {Component} from 'react'
import InlineError from 'components/messages/InlineError'
import { Link } from 'react-router-dom'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { resetPass } from 'actions/auth'
import logo from 'styles/img/logo.png'
import toJS from '../utils/ToJS'
import {
	Input,
	Form,
	Button,
	Segment,
	Message,
	Image,
	Icon,
	Header
} from 'semantic-ui-react'

class ResetPasswordPage extends Component {
	constructor(props) {
		super(props)
		this.state = {
			email: '',
			done: false,
			loading: false,
			errors: {}
		}
	}

	onChange = (e, { value }) => {
		this.setState({email: value})
	}

	onSubmit = (e) => {
		this.setState({ loading: true })
		this.props.resetPass(this.state.email).then(() => this.setState({ done: true })).
		finally(() => this.setState({ loading: false }))
	}

	render() {
		const { email, done, loading, errors } = this.state
		const { messages, t } = this.props
		return <div className='login-container'>
				<Segment textAlign='center'>
					<h2><Image src={logo} size='mini' inline /> Lingtelli Chatbot </h2>
					<h3>{t('resetPass.title'	)}</h3>
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
					{!done ? 
					<Form size='small' onSubmit={this.onSubmit} loading={loading}>
						<Form.Field error={!!errors.email}>
							<Input
								icon='mail'
								iconPosition='left'
								name='email'
								value={email}
								placeholder={t('resetPass.email')}
								onChange={this.onChange}
								autoFocus={true}
							/>
							{errors.email && <InlineError text={errors.email} />}
						</Form.Field>
						<Button fluid color='teal'>{t('resetPass.continue')}</Button>
					</Form>
					:
					<Header as='h2' icon>
						<Icon name='check' color='green' />
						{t('resetPass.done.title')}
						<Header.Subheader>{t('resetPass.done.description')}</Header.Subheader>
					</Header>
					}
					<br />
					<Link to='/login'>{t('resetPass.done.backToLogin')}</Link>
				</Segment>
			</div>
	}
}

const mapStateToProps = state => ({
	messages: state.get('messages')
})

export default compose(
	connect(mapStateToProps, {resetPass}),
	toJS,
	translate()
)(ResetPasswordPage)