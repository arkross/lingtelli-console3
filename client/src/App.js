import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { Dimmer, Loader } from 'semantic-ui-react';
import { logout, logoutDirectly } from 'actions/auth';
import { logout as agentLogout } from 'actions/agent'
import { connect } from 'react-redux';
import { hideAllMessages} from './actions/message'
import PropTypes from 'prop-types';
import LoginPage from 'components/pages/LoginPage';
import RegisterPage from 'components/pages/RegisterPage';
import DashBoardPage from 'components/pages/DashBoardPage';
import ValidationPage from 'components/pages/ValidationPage';
import ConfirmationPage from 'components/pages/ConfirmationPage';
import NotFoundPage from 'components/pages/NotFoundPage'
import Group from 'components/utils/Group';
import UserRoute from 'components/routes/UserRoute';
import GuestRoute from 'components/routes/GuestRoute';
import AgentApp from 'components/pages/agent/App'
import setAuthorizationHeader from 'utils/setAuthorizationHeader';
import {memberIsExpired, agentIsExpired} from 'utils/isExpired';

import 'moment/locale/zh-cn'
import 'moment/locale/zh-tw'

// use react-redux will cause conflict problem with react-router
// Describtion: https://github.com/ReactTraining/react-router/issues/4252
// Resolution: Pass url locations to solve problem
class App extends React.Component {
  state = {
    loading: false
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location !== this.props.location) {
      this.props.hideAllMessages()
    }
  }

  componentWillMount = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('agent_token')

    if (token) {
      this.setState({ loading: true });
      // Check token if it expred if token is exist.
      setAuthorizationHeader(token);
      memberIsExpired(token)
        .then( (expired) => {
          if (expired) {
            this.props.logout()
              .then( () => {
                // logout normally
                this.setState({ loading: false });
              })
              .catch( () => {
                // if logout api failed, we logout client directly
                this.props.logoutDirectly();
                this.setState({ loading: false });
              });
          } else {
            agentIsExpired(token).then(expired => {
              if (expired) {
                this.props.agentLogout().then(() => {
                  this.setState({ loading: false })
                })
                .catch(() => {
                  this.setState({ loading: false })
                })
              } else {
                this.setState({ loading: false })
              }
            })
          }
        })
    }
  }

  render = () => {
    const { location } = this.props;
    const { loading } = this.state;

    if (loading) {
      return (
        <Dimmer active>
           <Loader content='Loading' size='large' />
        </Dimmer>
      )
    }

    return (
      <Switch>
        <Route location={location} path='/question' exact component={Group} />
        <GuestRoute location={location} path='/' exact component={LoginPage} />
        <Route location={location} path='/confirm' exact component={ValidationPage} />
        <Route location={location} path='/confirmation' exact component={ConfirmationPage} />
        <GuestRoute location={location} path='/login' exact component={LoginPage} />
        <GuestRoute location={location} path='/signup' exact component={RegisterPage} />
        <UserRoute location={location} path='/' exact render={() => <Redirect to='/dashboard' />} />
        <UserRoute
          location={location}
          path='/dashboard'
          component={DashBoardPage}
        />
        <Route location={location} path='/agent*' component={AgentApp} />
        <Route component={NotFoundPage} />
      </Switch>
    )
  }
}

App.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired
  }).isRequired
}

export default connect(null, { logout, logoutDirectly, agentLogout, hideAllMessages })(App)
