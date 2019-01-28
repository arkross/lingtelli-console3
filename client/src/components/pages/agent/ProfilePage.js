import React from 'react'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import toJS from 'components/utils/ToJS'

class Profile extends React.Component {
	render() {
		return <div>Profile</div>
	}
}

const mapStateToProps = (state, props) => ({
	
})

export default compose(
	connect(mapStateToProps, {}),
	toJS,
	translate()
)(Profile)