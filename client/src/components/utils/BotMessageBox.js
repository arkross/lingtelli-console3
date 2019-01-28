import React from 'react'

const BotMessageBox = ({ role, text }) => (
	<div className='message-container'>
		{
			role === 'bot' ?
				<div className='message-wrapper bot'>
					<span>{text}</span>
				</div>
				:
				<div className='message-wrapper user'>
					<span>{text}</span>
				</div>
		}
	</div>
)

export default BotMessageBox
