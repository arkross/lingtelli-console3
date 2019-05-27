import React, {Component} from 'react'
import * as d3 from 'd3'
import { connect } from 'react-redux'
import { compose } from 'recompose'
import { Card, Icon, Label, Loader, Dimmer, Statistic, Header, Responsive, List } from 'semantic-ui-react'
import { translate } from 'react-i18next'
import _ from 'lodash'
import moment from 'moment'
import { fetchBot, fetchReport } from 'actions/bot'
import toJS from 'components/utils/ToJS';

class BotListPage extends Component {
	state = {
		
	}

	componentDidMount = () => {
		const { onUpdate } = this.props
		if (this.props.isUpdate) {
			return onUpdate()
		}
		document.title = 'LingBot | Dashboard'
	}

	componentDidUpdate = (prevProps) =>  {
		const { onUpdate, bots } = this.props
		if (JSON.stringify(_.map(bots, 'id')) !== JSON.stringify(_.map(prevProps.bots, 'id'))) {
		}
		document.title = 'LingBot | Dashboard'
	}

	onCardClick = (href) => {
		this.props.history.push(href)
	}

	render = () => {
		const { bots, t, match } = this.props
		const baseUrl = match.url.replace(/\/$/, '')
		const onCardClick = this.onCardClick
		moment.locale(localStorage.i18nextLng.toLowerCase())

		const thisWeek = moment().subtract(7, 'days')
		const botData = _.map(bots, el => {
			const midReport = _.chain(el.report ? el.report['7'] : [])
				.filter(o => moment(o.date, 'YYYY/MM/DD').isAfter(thisWeek))
				.reduce((acc, o) => ({
					total_chat: acc.total_chat + o.total_chat,
					success_count: acc.success_count + o.success_count
				}), {total_chat: 0, success_count: 0})
				.value()
			const totalChat = midReport.total_chat
			const successCount = midReport.success_count
			const successRate = totalChat ? successCount / totalChat : 0
			return _.assign({
				total_chat: totalChat,
				total_chat_text: d3.format(',')(totalChat),
				success_count: successCount,
				success_rate: successRate,
				success_rate_text: d3.format('.0%')(successRate)
			}, el)
		})

		return <List relaxed divided>
			{_.map(botData, el => <List.Item key={`${el.id}bot`} href={`${baseUrl}/bot/${el.id}`} onClick={e => {
				e.preventDefault()
				return onCardClick(`${baseUrl}/bot/${el.id}`)
			}}>
				<List.Content floated='right'>
					{t('chatbot.tile.total_questions')} {el.total_chat_text}
				</List.Content>
				<List.Content>
					<List.Header as='a'>{el.robot_name}</List.Header>
					<List.Description>{el.bot_type === 'TASK' ? t('menu.task') : '' }</List.Description>
				</List.Content>
			</List.Item>)}
		</List>
	}
}

const mapStateToProps = (state) => ({
	bots: state.getIn(['bot', 'bots']).filter(el => el.get('id'))
})

export default compose(
	translate(),
	connect(mapStateToProps, { fetchBot, fetchReport }),
	toJS
)(BotListPage)
