import React from 'react'
import propTypes from 'prop-types'
import { Message } from 'semantic-ui-react'

const InlineMessage = ({ text }) => (
	<Message
		error
		header="ERROR"
		content={text}
	/>
)

InlineMessage.propTypes = {
	text: propTypes.string.isRequired
}

export default InlineMessage
