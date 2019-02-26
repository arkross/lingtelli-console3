import React, {Component} from 'react'
import { Grid, Header, Statistic } from 'semantic-ui-react'
import { compose } from 'recompose';
import { translate } from 'react-i18next'
import { fetchReport } from 'actions/bot'
import moment from 'moment'
import _ from 'lodash'
import * as d3 from 'd3'
import { connect } from 'react-redux'
import Chart from 'react-c3js'
import 'c3/c3.css'
import toJS from 'components/utils/ToJS'
import { Link } from 'react-router-dom'

const DATE_FORMAT = 'YYYY/MM/DD'

class AnalysisWidget extends Component {

	getDataByTimeRange = (data, start, end) => {
		let result = _.chain(data)
		if (start.isSame(end, 'day')) {
			result = result.filter(el => moment(el.date, DATE_FORMAT).isSame(start, 'day'))
		}
		else {
			result = result.filter(el => moment(el.date, DATE_FORMAT).isBetween(start, end, 'day', '(]'))
		}

		result = result.reduce((acc, o) => ({
			total_chat: acc.total_chat + o.total_chat,
			success_count: acc.success_count + o.success_count
		}), {total_chat: 0, success_count: 0})
		.value()

		result.success_rate = result.total_chat ? (result.success_count / result.total_chat) : 0
		result.text = d3.format('.0%')(result.success_rate)
		return result
	}

	onChange = (e, {value}) => {
		this.props.onChangeScale(value)
	}

	handleAfterFetch = () => {
		this.setState({ loading: false })
	}
	
	render = () => {
		
		const { t, info: {report} } = this.props
		moment.locale(localStorage.i18nextLng.toLowerCase())

		const today = moment()
		const yesterday = moment().subtract(1, 'day')
		const thisWeek = moment().subtract(7, 'day')
		const lastWeek = moment().subtract(14, 'day')
		const thisMonth = moment().subtract(30, 'day')
		const lastMonth = moment().subtract(60, 'day')

		const chartData = _.chain(report)
			.filter(el => moment(el.date, 'YYYY/MM/DD').isAfter(thisWeek, 'day'))
			.map(item => _.assign({ unhandled_count: item.total_chat - item.success_count }, item))
			.value()
		const totalChat = _.sumBy(chartData, 'total_chat')
		const totalSuccess = _.sumBy(chartData, 'success_count')
		const successRate = (totalSuccess / totalChat) || 0
			
		const rawChartData = _.map(report, item => _.assign({ unhandled_count: item.total_chat - item.success_count }, item))

		const todayRate = this.getDataByTimeRange(rawChartData, today, today)
		const yesterdayRate = this.getDataByTimeRange(rawChartData, yesterday, yesterday)
		const thisWeekRate = this.getDataByTimeRange(rawChartData, thisWeek, today)
		const lastWeekRate = this.getDataByTimeRange(rawChartData, lastWeek, thisWeek)
		const thisMonthRate = this.getDataByTimeRange(rawChartData, thisMonth, today)
		const lastMonthRate = this.getDataByTimeRange(rawChartData, lastMonth, thisMonth)

		const stats = [
			{
				label: t('chatbot.tile.total_questions'),
				value: totalChat,
				text: d3.format(',')(totalChat),
				key: 'total_questions_stat'
			},
			{
				label: t('chatbot.tile.success_count'),
				value: totalSuccess,
				text: d3.format(',')(totalSuccess),
				key: 'total_success_stat'
			},
			{
				label: t('chatbot.tile.success_rate'),
				value: successRate,
				text: d3.format('.0%')(successRate),
				key: 'success_rate_stat'
			}
		]

		const extraStats = [
			{
				label: t('chatbot.tile.today'),
				value: todayRate.success_rate,
				text: todayRate.text,
				key: 'today_rate'
			},
			{
				label: t('chatbot.tile.yesterday'),
				value: yesterdayRate.success_rate,
				text: yesterdayRate.text,
				key: 'yesterday_rate'
			},
			{
				label: t('chatbot.tile.this_week'),
				value: thisWeekRate.success_rate,
				text: thisWeekRate.text,
				key: 'this_week_rate'
			},
			{
				label: t('chatbot.tile.last_week'),
				value: lastWeekRate.success_rate,
				text: lastWeekRate.text,
				key: 'last_week_rate'
			},
			{
				label: t('chatbot.tile.this_month'),
				value: thisMonthRate.success_rate,
				text: thisMonthRate.text,
				key: 'this_month_rate'
			}
		]

		return <Grid divided='vertically'>
			<Grid.Row columns={2}>
				<Grid.Column>
					<Header as='h3'>{t('chatbot.analysis.text')} - {t('chatbot.tile.last_7_days')}</Header>
				</Grid.Column>
				<Grid.Column textAlign='right'>
					<Link to={`${this.props.location.pathname}/analysis`}>
					{t('chatbot.tile.detail')}
					</Link>
				</Grid.Column>
			</Grid.Row>
			<Grid.Row>
				<Grid.Column>
					<div className='analysis-container' >
						<Chart
							grid={{
								y: {
									show: true
								}
							}}
							tooltip={{
								format: {
									title: val => moment(val).format('ll')
								}
							}}
							data={{
								json: chartData,
								type: 'line',
								names: {
									total_chat: t('chatbot.analysis.questions'),
									unhandled_count: t('chatbot.analysis.unhandled')
								},
								xFormat: '%Y/%m/%d',
								keys: {
									x: 'date',
									value: ['total_chat', 'unhandled_count']
								}
							}}
							axis={{
								x: {
									type: 'timeseries'
								},
								y: {
									tick: {
										format: (val => (val % 1 === 0) ? val : '')
									}
								}
							}}
						/>
					</div>
				</Grid.Column>
			</Grid.Row>
			<Grid.Row>
				<Grid.Column>
					<Statistic.Group widths={3}>
					{
						_.map(stats, el => <Statistic
							label={el.label}
							key={el.key}
							value={el.text}
							/>)
					}
					</Statistic.Group>
				</Grid.Column>
			</Grid.Row>
			<Grid.Row>
				<Grid.Column>
					<Statistic.Group widths={extraStats.length} size='tiny'>
					{
						_.map(extraStats, el => <Statistic
							label={el.label}
							key={el.key}
							value={el.text}
						/>)
					}
					</Statistic.Group>
				</Grid.Column>
			</Grid.Row>
		</Grid>
	}
}

const mapStateToProps = (state, props) => ({
	info: state.getIn(['bot', 'bots', props.match.params.id]) || {}
})

export default compose(
	translate(),
	connect(mapStateToProps, { fetchReport }),
	toJS
)(AnalysisWidget)
