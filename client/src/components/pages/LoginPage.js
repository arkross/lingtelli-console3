import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import LoginForm from 'components/forms/LoginForm';
import { login } from 'actions/auth';
import { hideAllMessages } from 'actions/message'
import { Container } from 'semantic-ui-react';

class LoginPage extends React.Component {
	// react-router will pass history in components
	submit = data =>
		this.props.login(data)
			.then(() => this.props.history.push('/dashboard'))

	render() {
		return (
			<Container>
				<LoginForm submit={this.submit} dismissError={this.props.dismissError} />
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

export default connect(null, { login, dismissError: hideAllMessages })(LoginPage);
