import React from "react";

import { compose } from "recompose";
import { connect } from "react-redux";
import { translate } from "react-i18next";
import { Button, Input, Icon } from "semantic-ui-react";
import { updateQuestion } from "actions/question";
import toJS from './ToJS'

class Question extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			id: props.id,
			content: props.content || '',
			editable: false,
			loading: false
		}
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.content !== nextProps.content) {
			this.setState({'content': nextProps.content})
		}
	}

	onClick = (id, e) => {
		if (e.target.classList.contains("input"))
			this.setState({editable: true});
	}

	update = () => {
		const { id, content } = this.state;
		const { updateQuestion, activeBot } = this.props;

		updateQuestion(activeBot, { id, content })
			.then(() => this.setState({ editable: false }))
			.catch(() => {
				console.log('Failed to update question');
				this.setState({ editable: false });
			});
	}

	onKeyPress = (e) => {
		if (e.keyCode === 13 || e.key === "Enter")
			this.update();
	}

	onBlur = (e) => {
		this.update();
	}

	onChange = (e) => {
		this.setState({ content: e.target.value });
	}

	componentDidUpdate = () => {
		if (this.state.editable) this.input.focus();
	}

	onDelete = (e, ix) => {
		this.setState({loading: true})
		this.props.onDelete(e, ix)
			.catch(err => this.setState({loading: false}))
	}


	render = () => {
		const { id, content, editable, loading } = this.state;
		const { t, ix, onDelete } = this.props;

		return (
			<div
				onClick={ (e) => this.onClick(id, e) }
				className="question"
			>
				<Input
					placeholder={t("chatbot.faq.form.question")}
					ref={ input => this.input = input }
					value={content}
					onBlur={this.onBlur}
					onKeyDown={this.onKeyPress}
					onChange={this.onChange}
					action
				>
					<input disabled={!editable} />
					<Button icon='trash alternate outline' loading={loading} color='red' className='question-delete' onClick={ e => this.onDelete(e, ix) } />
				</Input>
			</div>
		)
	}
}

export default compose(
	translate("translations"),
	connect(null, { updateQuestion }),
	toJS
)(Question);
