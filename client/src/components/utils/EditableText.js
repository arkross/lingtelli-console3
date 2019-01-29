import React, { Component } from 'react'
import { Input, Icon} from 'semantic-ui-react';
import PropTypes from 'prop-types'

class EditableText extends Component {
	state = {
		isEditing: false,
		value: this.props.value || ''
	}
	onClickEdit = () => {
		if (this.state.isEditing) {
			if (this.state.value !== this.props.value) {
				this.onSubmit()
			}
		}
		else {
			if (this.inputRef) this.inputRef.focus()
		}
		this.setState({ isEditing: ! this.state.isEditing })    
	}
	onSubmit = () => {
		if (this.props.onChange) {
			this.setState({ loading: true })
			this.props.onChange(this.state.value).then(() => {
				this.setState({ loading: false })
			}, () => {
				this.setState({ loading: false })
			})
		}
	}
	onChange = (e) => {
		this.setState({value: e.target.value})
	}
	onKeyDown = e => {
		if (e.keyCode === 13) {
			return this.onClickEdit()
		}
	}
	moveCaretToEnd = e => {
		const temp = e.target.value
		e.target.value = ''
		e.target.value = temp
	}
	componentWillReceiveProps(props) {
		this.setState({ value: props.value })
	}
	onCancel = () => {
		this.setState({ isEditing: false, value: this.props.value }) 
	}
	onKeyUp = e => {
		// Esc key
		if (e.keyCode === 27) {
			this.onCancel()
		}
	}
	onBlur = e => {
		this.onCancel()
	}
	render() {
		const { name, className, placeholder } = this.props
		const TagName = this.props.as || 'span'
		const { value, isEditing } = this.state
		return <span className={(className || '') + ' editable-text'}>
			{isEditing ?
				<Input icon size='small' >
					<input
						className='editable-text-input' 
						type='text'
						ref={el => {this.inputRef = el}}
						name={name}
						value={value} 
						onKeyDown={this.onKeyDown}
						onChange={this.onChange}
						autoFocus
						onFocus={this.moveCaretToEnd}
						placeholder={placeholder}
						onBlur={this.onBlur}
						onKeyUp={this.onKeyUp} />
					<Icon name='pencil' link onClick={this.onClickEdit} />
				</Input>
				:
				<TagName onClick={this.onClickEdit} className='editable-text-label'><span className='editable-text-text'>{value}</span><Icon link className='editable-text-button' name='pencil' onClick={this.onClickEdit} /></TagName> 
			}
		</span>
	}
}

EditableText.propTypes = {
	value: PropTypes.string,
	onChange: PropTypes.func,
	name: PropTypes.string,
	className: PropTypes.string,
	as: PropTypes.string
}

export default EditableText
