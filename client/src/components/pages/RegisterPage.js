import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import RegisterForm from 'components/forms/RegisterForm';
import { register } from 'actions/register'

class RegisterPage extends React.Component {

  submit = data =>
    this.props.register(data)

  render = () => {
    return (
      <div>
        <RegisterForm history={this.props.history} submit={this.submit}/>
      </div>
    )
  };
}

RegisterPage.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }).isRequired,
  register: PropTypes.func.isRequired
}

export default connect(null, { register })(RegisterPage);
