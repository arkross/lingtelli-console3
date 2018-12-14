import React from 'react'
import { translate } from 'react-i18next'
import { TextArea, Icon } from 'semantic-ui-react'
import DeletionModal from '../modals/DeletionModal'

class QAForm extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			data: props.data,
			openDeleteModal: false,
			deleteGroupId: null
		}
	}

	onDeleteGroup = () => {
		const { onDeleteGroup } = this.props
		onDeleteGroup(this.state.deleteGroupId)
	}

	onDeleteGroupClick = (e, groupId) => {
		e.preventDefault()
		this.setState({ openDeleteModal: true, deleteGroupId: groupId })
	}

	render = () => {
		let questions = <div />
		const { data } = this.state;
		const {
			t,
			parentId,
			onDelete,
			onQuestionChange,
			onInputCreate,
			onAnwserChange
		} = this.props;

		const groupStyle = {
			marginTop: '20px',
			padding: '10px',
			border: '1px solid',
			borderRadius: '10px',
			boxShadow: '1px 1px 20px black'
		}

		const textAreaStyle = {
			width: '95%',
			padding: '10px',
			fontSize: '18px',
			margin: '0 20px 25px 20px'
		}

		questions = data.question.map( (q, index) => {
			return (
				<QuestionComponent
					key={index}
					num={index}
					pid={parentId}
					text={q.content}
					onDelete={onDelete}
					onChange={onQuestionChange}
				/>
			)
		})

		return (
			<div className='question-container'>
				<Icon
					className='pull-right clickable'
					onClick={ (e) => this.onDeleteGroupClick(e, parentId) }
					name='trash outline'
				/>
				<div className='question-wrapper'>
					<Icon className='question-header' name='question circle outline' />
					<TextArea
						as='input'
						className='question-input question-question'
						maxLength={1000}
						placeholder={t('chatbot.faq.form.question')}
						onKeyPress={ (e) => onInputCreate(e, parentId) }
					/>
					{questions}
				</div>
				<div className='question-wrapper'>
					<Icon className='answer-header' name='commenting outline' />
					<TextArea
						rows={1}
						autoHeight
						pid={parentId}
						className='question-input question-question'
						maxLength={1000}
						placeholder={t('chatbot.faq.form.answer')}
						defaultValue={data.answer.content}
						onChange={onAnwserChange}
					/>
				</div>
			</div>
		)
	}
}

const QuestionComponent = (props) => {
	const textAreaStyle = {
		width: '90%',
		padding: '10px',
		fontSize: '18px',
		margin: '0 5px 5px 20px'
	}

	const iconStyle = {
		position: 'absolute',
		padding: '10px',
		fontSize: '20px',
		cursor: 'pointer'
	}

	return (
		<div style={{margin: '0 auto', width:'90%'}}>
			<TextArea
				id={props.num}
				pid={props.pid}
				rows={1}
				autoHeight
				className='question-content'
				maxLength={1000}
				style={textAreaStyle}
				defaultValue={props.text}
				onChange={props.onChange}
			/>
			<Icon
				id={props.num}
				pid={props.pid}
				style={iconStyle}
				onClick={ (e) => props.onDelete(e, props.pid) }
				name='remove'
			/>
		</div>
	)
}

export default translate('translations')(QAForm);
