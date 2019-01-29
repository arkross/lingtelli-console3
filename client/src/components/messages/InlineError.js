import React from 'react'
import propTypes from 'prop-types'

const InlineError = ({ text }) => (
	<span style={{ color: 'red'}}>
		{ text }
	</span>
)

InlineError.propTypes = {
	text: propTypes.string.isRequired
}

export default InlineError
