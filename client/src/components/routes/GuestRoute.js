import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Route, Redirect } from 'react-router-dom'
import toJS from '../utils/ToJS'

// Take component(rename to Component)
const UserRoute = ({ isAuthenticated, component: Component, ...rest}) => (
	<Route
		{...rest}
		render={ props =>
			!isAuthenticated ? <Component {...props} /> : <Redirect to='/dashboard' />
		}
	/>
)

UserRoute.propTypes = {
	component: PropTypes.func.isRequired,
	isAuthenticated: PropTypes.bool.isRequired
}

function  mapStateToProps(state) {
	return {
		isAuthenticated: !!state.getIn(['user', 'access_token'])
	}
}

export default connect(mapStateToProps)(toJS(UserRoute))
