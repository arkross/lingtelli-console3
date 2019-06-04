import React from "react";

import { compose } from "recompose";
import { connect } from "react-redux";
import { translate } from "react-i18next";
import { Button, Input, Icon, Form } from "semantic-ui-react";
import { updateQuestion } from "actions/question";
import toJS from './ToJS'

class Question extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			id: props.id,
			originalContent: props.content || '',
			content: props.content || '',
			showCheck: false,
			updateLoading: false,
			editable: false,
			loading: false
		}
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.content !== nextProps.content) {
			this.setState({
				content: nextProps.content,
				originalContent: nextProps.content
			})
		}
	}

	onClick = (id, e) => {
		if (e.target.classList.contains("input"))
			this.setState({editable: true});
	}

	update = () => {
		const { id, content, originalContent } = this.state;
		const { updateQuestion, activeBot } = this.props;

		if (originalContent !== content) {
			updateQuestion(activeBot, { id, content })
				.then(() => {
					this.setState({ editable: false, showCheck: true, updateLoading: false, originalContent: content })
					setTimeout(() => {
						this.setState({ showCheck: false })
					}, 2000)
				})
				.catch(() => {
					this.setState({ editable: false, updateLoading: false });
				});
		}
	}

	onKeyPress = (e) => {
		if (e.keyCode === 13 || e.key === "Enter")
			this.update();
	}

	onSubmit = e => {
		e.preventDefault()
		this.update()
		return false
	}

	onBlur = (e) => {
		this.onSubmit(e)
	}

	onChange = (e) => {
		this.setState({ content: e.target.value });
	}

	componentWillUnmount = () => {
		this.cleanLoading = () => {}
	}

	cleanLoading = () => {
		this.setState({ loading: false })
	}

	onDelete = (e, ix) => {
		e.preventDefault()
		this.setState({loading: true})
		this.props.onDelete(e, ix)
			.catch(err => this.setState({loading: false}))
			.finally(() => this.cleanLoading())
		return false
	}


	render = () => {
		const { id, content, originalContent, editable, loading, showCheck, updateLoading } = this.state;
		const { t, ix, onDelete, deletable } = this.props;

		return (
			<Form
				ref={el => (this.formEl = el)}
				onSubmit={this.onSubmit}
				onClick={ e => this.onClick(10, e)}
				className="question"
			>
				<Form.Input
					action
					placeholder={t("chatbot.faq.form.question")}
					value={content}
					onBlur={this.onBlur}
					onChange={this.onChange}
					fluid
				>
					<input ref={ input => this.input = input } />
					<Button icon={showCheck ? 'check' : 'save'} loading={updateLoading} color='green' disabled={originalContent === content} />
					{deletable ?
					<Button icon='trash alternate outline' loading={loading} color='red' className='question-delete' onClick={ e => this.onDelete(e, ix) } /> : ''}
				</Form.Input>
			</Form>
		)
	}
}

export default compose(
	translate("translations"),
	connect(null, { updateQuestion }),
	toJS
)(Question);
