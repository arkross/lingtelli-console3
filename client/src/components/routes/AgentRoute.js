import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Route, Redirect } from 'react-router-dom'
import toJS from '../utils/ToJS'

// Take component(rename to Component)
const AgentRoute = ({ isAuthenticated, component: Component, ...rest}) => (
	<Route
		{...rest}
		render={ props =>
			isAuthenticated ? <Component {...props} /> : <Redirect to='/agent/login' />
		}
	/>
)

AgentRoute.propTypes = {
	component: PropTypes.func.isRequired,
	isAuthenticated: PropTypes.bool.isRequired
}

function mapStateToProps(state) {
	return {
		isAuthenticated: !!state.getIn(['user', 'agent_token'])
	}
}

export default connect(mapStateToProps)(toJS(AgentRoute))
