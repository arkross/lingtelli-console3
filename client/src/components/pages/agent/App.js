import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import AgentRoute from '../../routes/AgentRoute'
import LoginPage from './LoginPage'
import DashboardPage from './DashboardPage'

class AgentApp extends React.Component {
	render() {
		const {location} = this.props
		return <Switch>
			<Route location={location} path='/agent/login' exact component={LoginPage} />
			<AgentRoute location={location} path='/agent' component={DashboardPage} />
			<Route location={location} render={props => <Redirect to={'/agent'} />} />
		</Switch>
	}
}

export default AgentApp