import React, {Fragment} from "react";
import Question from "./Question";
import Answer from "./Answer";
import groupApis from "apis/group";
import _ from 'lodash'
import { v4 } from "uuid";
import { compose } from "recompose";
import { connect } from "react-redux";
import { translate } from "react-i18next";
import { Icon, Button, Container, Grid, Form, Segment, Label, Message } from "semantic-ui-react";
import { createQuestion, deleteQuestion } from "actions/question";
import { createAnswer, deleteAnswer } from 'actions/answer'
import toJS from './ToJS'

class Group extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			id: this.props.id,
			createQuestionLoading: false,
			createAnswerLoading: false,
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
		this.setState({ createQuestionLoading: true })
		createQuestion(activeBot, id)
			.then(() => this.refresh(), (err) => console.log(`Failed to create question.`, err))
			.finally(() => {
				this.setState({ createQuestionLoading: false })
			})
	}

	onCreateAnswer = e => {
		const { id } = this.state
		const { activeBot, createAnswer } = this.props
		this.setState({ createAnswerLoading: true })
		createAnswer(activeBot, id)
			.then(() => this.refresh(), err => console.log('Failed to create answer', err))
			.finally(() => {
				this.setState({ createAnswerLoading: false })
			})
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
		const { createAnswerLoading, createQuestionLoading } = this.state

		return <div className='group'>
			<Segment attached='top'>
				<Grid stackable doubling>
					<Grid.Row columns='equal'>
						<Grid.Column>
							{
								questions && _.map(questions, (item, ix) => <Question
									key={item.id}
									id={item.id}
									ix={ix}
									deletable={ix > 0}
									content={item.content}
									onDelete={this.onDelete}
									onChange={this.onQuestionChanged}
									activeBot={activeBot}
								/>)
							}
						</Grid.Column>
						<Grid.Column>
							{
								answers && _.map(answers, (item, ix) =>
									<Answer
										key={item.id}
										id={item.id}
										ix={ix}
										deletable={ix > 0}
										content={item.content}
										onDelete={this.onDeleteAnswer}
										activeBot={activeBot}
									/>
								)
							}
							
						</Grid.Column>
					</Grid.Row>
				</Grid>
			</Segment>
			<Message attached='bottom'>
				<Button icon='plus' loading={createQuestionLoading} content={t('chatbot.faq.question')} onClick={this.onCreate} className="create-question" />
				<Button icon='plus' loading={createAnswerLoading} content={t('chatbot.faq.answer')} onClick={this.onCreateAnswer} className="create-question" />
				<Button icon='remove' negative content={t('chatbot.faq.delete')} onClick={e => onDelete(e, ix)} />
			</Message>
		</div>
	}
}


export default compose(
	translate("translations"),
	connect(null, { deleteQuestion, createQuestion, createAnswer, deleteAnswer }),
	toJS
)(Group);
