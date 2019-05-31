import React from "react";
import Question from "./Question";
import Answer from "./Answer";
import groupApis from "apis/group";
import _ from 'lodash'
import { v4 } from "uuid";
import { compose } from "recompose";
import { connect } from "react-redux";
import { translate } from "react-i18next";
import { Icon, Button, Container, Grid } from "semantic-ui-react";
import { createQuestion, deleteQuestion } from "actions/question";
import { createAnswer, deleteAnswer } from 'actions/answer'
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

	onCreateAnswer = e => {
		const { id } = this.state
		const { activeBot, createAnswer } = this.props

		createAnswer(activeBot, id)
			.then(() => this.refresh(), err => console.log('Failed to create answer', err))
	}

	onDelete = (e, ix) => {
		const { activeBot, deleteQuestion, questions } = this.props;
		const id = questions[ix].id;

		return deleteQuestion(activeBot, id)
			.then(() => this.refresh(), err => console.log('Failed to delete question', err))
	}

	onDeleteAnswer = (e, ix) => {
		const { activeBot, deleteAnswer, answers } = this.props
		const id = answers[ix].id

		return deleteAnswer(activeBot, id)
			.then(() => this.refresh(), err => console.log('Failed to delete answer', err))
	}

	render() {
		const { onDelete, ix, t, activeBot, questions, answers } = this.props

		return (
			<div className="group">
				<Icon
					name="trash alternate"
					color='red'
					onClick={(e) => onDelete(e, ix) }
					className='delete-group-icon pull-right clickable'
				/>
				<Grid stackable doubling>
					<Grid.Row columns='equal'>
						<Grid.Column>
							<Button floated='left' primary icon='plus' content={t('chatbot.faq.question')} onClick={this.onCreate} className="block create-question" />
							<div style={{clear: 'both'}} />
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
						</Grid.Column>
						<Grid.Column>
							<Button floated='right' primary icon='add' content={t('chatbot.faq.answer')} onClick={this.onCreateAnswer} className="block create-question" />
							<div style={{clear: 'both'}} />
							{
								answers && _.map(answers, (item, ix) =>
									<Answer
										key={item.id}
										id={item.id}
										ix={ix}
										content={item.content}
										onDelete={this.onDeleteAnswer}
										activeBot={activeBot}
									/>
								)
							}
						</Grid.Column>
					</Grid.Row>
				</Grid>
				
			</div>
		);
	}
}


export default compose(
	translate("translations"),
	connect(null, { deleteQuestion, createQuestion, createAnswer, deleteAnswer }),
	toJS
)(Group);
