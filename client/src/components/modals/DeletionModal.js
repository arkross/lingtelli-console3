import React from 'react'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { Modal, Input, Button, Form } from 'semantic-ui-react'
import { translate } from 'react-i18next'
import auth from '../../apis/auth'
import toJS from 'components/utils/ToJS'

const PROGRESS = {
	BUTTON_CLICK: 0,
	PASSWORD_INPUT: 1
}

/**
 * Deletion Modal
 * @prop {boolean} open Controls whether this dialog is open.
 * @prop {string} buttonText Dialog primary action button text
 * @prop {string} title Dialog title
 * @prop {string} message Dialog message body
 * @prop {function} onSuccess Callback function when authentication is successful
 * @prop {function} onFailure Callback function when authentication is failed
 */
class DeletionModal extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			loading: false,
			inputValue: '',
			error: false,
			progress: PROGRESS.BUTTON_CLICK
		}
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.open !== nextProps.open) {
			this.setState({
				inputValue: '',
				progress: PROGRESS.BUTTON_CLICK,
				error: false,
				loading: false
			})
		}
	}

	onInputChange = e => {
		this.setState({inputValue: e.target.value})
	}

	onInputKeyDown = e => {
		if (e.keyCode === 13) {
			e.preventDefault()
			this.onAuth()
		}
	}

	onSubmit = e => {
		e.preventDefault()
		this.onAuth()
	}

	onAuth = () => {
		if (this.state.progress === PROGRESS.BUTTON_CLICK) {
			this.setState({
				progress: PROGRESS.PASSWORD_INPUT
			})
		} else {
			const { username, onSuccess, onFailure } = this.props
			const { inputValue: password } = this.state
			this.setState({ loading: true })
			auth.confirmPassword({username, password})
				.then(data => {
					this.setState({error: false})
					typeof onSuccess === 'function' && onSuccess(data)
				}, err => {
					this.setState({error: true})
					typeof onFailure === 'function' && onFailure(err)
				})
				.finally(() => this.setState({ loading: false }))
		}
	}

	render() {
		const { open, onClose, title, message, buttonText, t } = this.props
		const { loading, inputValue, error, progress } = this.state
		return <Modal
				open={open}
				onClose={onClose}
			>
			<Modal.Header>{title}</Modal.Header>
			<Modal.Content>
				<Modal.Description>{message}</Modal.Description>
				{progress === PROGRESS.PASSWORD_INPUT && 
				<Form>
					<Form.Field error={error}>
						<label>
							{t('chatbot.delete.prompt_password')}
						</label>
						<Input
							type='password'
							value={inputValue}
							onChange={this.onInputChange}
							onKeyDown={this.onInputKeyDown}
							autoFocus
						/>
					</Form.Field>
				</Form>}
			</Modal.Content>
			<Modal.Actions>
				<Button onClick={onClose} disabled={loading}>
				{t('chatbot.delete.cancel')}</Button>
				<Button onClick={this.onSubmit} negative disabled={loading} loading={loading}>{buttonText}</Button>
			</Modal.Actions>
		</Modal>
	}
}

const mapStatetoProps = (state, props) => ({
	username: state.getIn(['user', 'id']),
})

export default compose(
	connect(mapStatetoProps),
	translate(),
	toJS
)(DeletionModal)