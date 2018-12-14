import React from "react";
import Question from "./Question";
import Answer from "./Answer";
import groupApis from "apis/group";
import _ from 'lodash'
import { v4 } from "uuid";
import { compose } from "recompose";
import { connect } from "react-redux";
import { translate } from "react-i18next";
import { Icon, Button } from "semantic-ui-react";
import { createQuestion, deleteQuestion } from "actions/question";
import toJS from './ToJS'

class Group extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			id: this.props.id,
			questions: this.props.questions || [],
			answers: this.props.answers || []
		}
	}

	// make sure data is correct.
	refresh = () => {
		const { id } = this.state;
		const { activeBot } = this.props;

		return this.props.fetchGroup()
			.catch((err) => {console.log(`Failed to fetch group`, err)})
	}

	onCreate = (e) => {
		const { id } = this.state;
		const { activeBot, createQuestion } = this.props;

		createQuestion(activeBot, id)
			.then(() => this.refresh(), (err) => console.log(`Failed to create question.`, err));
	}

	onDelete = (e, ix) => {
		const { activeBot, deleteQuestion, questions } = this.props;
		const id = questions[ix].id;

		return deleteQuestion(activeBot, id)
			.then(() => this.refresh(), (err) => {
				console.log('Failed to delete question', err)
			})
	}

	render() {
		const { onDelete, ix, t, activeBot, questions, answers } = this.props

		return (
			<div className="group">
				<Icon
					name="remove"
					onClick={(e) => onDelete(e, ix) }
					className='delete-group-icon pull-right clickable'
				/>
				<Button color='blue' onClick={this.onCreate} className="block create-question">
					<Icon name="add" />
					<span>{t("chatbot.faq.question")}</span>
				</Button>
				<div className="questions-group inline-block">
					{
						questions && _.map(questions, (item, ix) =>
							<Question
								key={item.id}
								id={item.id}
								ix={ix}
								content={item.content}
								onDelete={this.onDelete}
								onChange={this.onQuestionChanged}
								activeBot={activeBot}
							/>
						)
					}
				</div>
				<div className="answer-group inline-block">
					{
						answers && _.map(answers, (item, ix) =>
							<Answer
								key={item.id}
								id={item.id}
								content={item.content}
								activeBot={activeBot}
							/>
						)
					}
				</div>
			</div>
		);
	}
}


export default compose(
	translate("translations"),
	connect(null, { deleteQuestion, createQuestion }),
	toJS
)(Group);
