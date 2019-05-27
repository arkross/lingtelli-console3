import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import LoginForm from 'components/forms/LoginForm';
import { login, cancelLogin } from 'actions/auth';
import { hideAllMessages } from 'actions/message'
import { Container } from 'semantic-ui-react';

class LoginPage extends React.Component {
	// react-router will pass history in components
	submit = (data, kick = false) =>
		this.props.login(data, kick)
			.then(() => this.props.history.push('/dashboard'))

	cancelLogin = () => this.props.cancelLogin()

	render() {
		return (
			<Container>
				<LoginForm submit={this.submit} dismissError={this.props.dismissError} cancelLogin={this.cancelLogin} />
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

export default connect(null, { login, cancelLogin, dismissError: hideAllMessages })(LoginPage);
