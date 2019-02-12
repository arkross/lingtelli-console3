import React, {Component} from 'react'
import { connect } from 'react-redux'
import { Input, Container, Header, List, Icon} from 'semantic-ui-react'
import { compose } from 'recompose';
import { translate } from 'react-i18next'
import api from 'apis/demo'
import toJS from 'components/utils/ToJS'
import _ from 'lodash'
import moment from 'moment'

class TestBotPage extends Component {
	state = {
		messages: [],
		loading: false,
		currentMessage: '',
		mode: 'text', // 'text' or 'postback'
		currentPostback: {}
	}

	componentDidUpdate() {
		if (this.props.info && this.props.info.greeting_msg && (this.state.messages.length === 0 || (this.props.info.greeting_msg !== this.state.messages[0].text))) {

			this.setState({
				messages: [{
					sender: 'bot',
					type: 'text',
					text: this.props.info.greeting_msg,
					data: {
						title: this.props.info.greeting_msg
					},
					date: moment().format('YYYY-MM-DD HH:mm:ss')
				}]
			})
		}
		this.chatMessages.scrollTop = this.chatMessages.scrollHeight
	}

	componentDidMount() {
		if (this.props.info && this.props.info.greeting_msg) {
			this.setState({
				messages: [...this.state.messages, {
					sender: 'bot',
					type: 'text',
					data: {
						title: this.props.info.greeting_msg
					},
					date: moment().format('YYYY-MM-DD HH:mm:ss')
				}]
			})
		}
	}
	
	submitMessage(message, mode = 'text', id = 'NoId', oriQue = '') {
		const { info: { vendor_id }, t} = this.props
		const { currentPostback } = this.state
		let request = null
		if (mode === 'text') {
			request = api.ask(vendor_id, message)
		}
		else if (mode === 'postback') {
			request = api.postback(vendor_id, {oriQue, id}, message)
		}
		request = request
			.then(res => {
				this.setState({ messages: [...this.state.messages, {
					sender: 'bot',
					type: res.type,
					data: res.data,
					oriQue: res.oriQue,
					date: moment().format('YYYY-MM-DD HH:mm:ss')
				}]})
			})
			.catch(() => {
				this.setState({
					messages: [...this.state.messages, {
						sender: 'bot',
						type: 'text',
						data: {
							title: t('errors.demo.ask')
						},
						date: moment().format('YYYY-MM-DD HH:mm:ss')
					}]
				})
			})
	}

	sendMessage = message => {
		if ( ! this.validate(message)) {
			return false
		}
		this.setState({ 
			currentMessage: '',
			messages: [...this.state.messages, {
				sender: 'user',
				type: 'text',
				data: {
					title: message
				},
				date: moment().format('YYYY-MM-DD HH:mm:ss')
			}]
		})
		this.submitMessage(this.state.currentMessage, this.state.mode)
	}
	onKeyUp = e => {
		if (e.keyCode === 13) {
			// Submit message
			this.sendMessage(this.state.currentMessage)
		}
	}
	onClickSend = e => {
		if ( ! this.validate(this.state.currentMessage) ) {
			this.messageField.focus()
			return false
		}
		this.setState({currentMessage: '', messages: [...this.state.messages, {
			sender: 'user',
			type: 'text',
			data: {
				title: this.state.currentMessage
			},
			date: moment().format('YYYY-MM-DD HH:mm:ss')
		}]})
		this.submitMessage(this.state.currentMessage, this.state.mode)
		this.messageField.focus()
	}
	onTextboxChange = e => {
		this.setState({ currentMessage: e.target.value})
	}
	onRecommendationSelected = recommendation => {
		this.setState({ messages: [...this.state.messages, {
			sender: 'user',
			type: 'text',
			data: {
				title: recommendation.text
			},
			oriQue: recommendation.oriQue,
			date: moment().format('YYYY-MM-DD HH:mm:ss')
		}]})
		this.submitMessage(recommendation.text, 'postback', recommendation.id, recommendation.oriQue)
		this.messageField.focus()
	}
	validate = message => {
		if ( ! message) {
			return false
		}
		if (typeof message !== 'string') {
			return false
		}
		if ( ! message.trim()) {
			return false
		}
		return true
	}
	render() {
		const { info, t } = this.props
		const { messages, currentMessage } = this.state
		moment.locale(localStorage.i18nextLng.toLowerCase())
		let keyCounter = 0
		return <Container text className='chat-container'>
			<Header as='h3'>{info.robot_name}</Header>
			<div ref={el => {this.chatMessages = el}} className='chat-messages-container'>
				{
					_.map(messages, message => {
						if (message.type === 'list' || (message.type === 'answer' && message.data.buttons) || message.type === 'no_answer') {
							return <RecommendationBalloon t={t} oriQue={message.oriQue} date={message.date} title={message.data.title || message.data.text} data={message.data.buttons} key={keyCounter++} onSelect={this.onRecommendationSelected} />
						}
						else {
							return <TextBalloon key={keyCounter++} date={message.date} sender={message.sender}>{message.data.title || message.data.text}</TextBalloon>
						}
					})
				}
			</div>
			<div className='chat-input-container'>
				<Input icon placeholder={t('demo.input')}>
					<input type='text' ref={el => {this.messageField = el}} onChange={this.onTextboxChange} onKeyUp={this.onKeyUp} autoFocus value={currentMessage} />
					<Icon name='send' link={!!currentMessage} onClick={this.onClickSend} />
				</Input>
			</div>
		</Container>
	}
}

const mapStateToProps = (state, props) => ({
	info: state.getIn(['bot', 'bots', props.match.params.id]) || {}
})

export default compose(
	connect(mapStateToProps),
	translate(),
	toJS
)(TestBotPage)

class TextBalloon extends Component {
	render() {
		const { date, sender, children } = this.props
		return <div className={'text-balloon-wrapper ' + (sender ? sender : 'user')}>
			<div className='flexer'>
				<div className='text-balloon-text'>
					{children}
				</div>
				<div className='text-balloon-date' title={moment(date).format('YYYY-MM-DD HH:mm:ss')}>
					{moment(date).fromNow()}
				</div>
			</div>
		</div>
	}
}

class RecommendationBalloon extends Component {
	handleClick = obj => {
		return this.props.onSelect(obj)
	}
	render() {
		const { date, data, title, t} = this.props
		let counter = 0 // temporary key
		const links = _.map(data, question => <List.Item as='a' key={question.id + counter++} onClick={this.handleClick.bind(this, question)}>
			{question.text}
		</List.Item>)
		return <TextBalloon sender='bot' date={date}>
			<div className='recommendation-title'>{title}</div>
			<List divided>{links}</List>
		</TextBalloon>
	}
}
