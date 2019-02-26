import React from 'react';
import _ from 'lodash'
import moment from 'moment'
import PropTypes from 'prop-types'
import Chart from 'react-c3js'
import * as d3 from 'd3'
import 'c3/c3.css'
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import { fetchReport } from 'actions/bot';
import {
	Header,
	Button,
	Dimmer,
	Loader,
	Grid,
	Statistic
} from 'semantic-ui-react';
import toJS from 'components/utils/ToJS'

class Analysis extends React.Component {
	state = {
		errors: {},
		report: []
	}

	componentWillReceiveProps = (nextProps) => {
		const { report, t } = nextProps;
		const labels  = report.map(item => item.date);
		this.setState({
			maximum: Math.max(...report.map(item => item.total_chat)),
			report: [
				{
					labels: labels,
					title: t('chatbot.analysis.questions'),
					data: report.map(item => item.total_chat)
				},
				{
					labels: labels,
					title: t('chatbot.analysis.unhandled'),
					data: report.map(item => (item.total_chat - item.success_count))
				}
			]
		});
	}

	componentDidUpdate(prevProps) {
		const {reportStat: { question_count: questionCount }} = this.props
		const {reportStat: { question_count: prevQuestion }} = prevProps
		const currentTop = _.chain(questionCount)
			.sortBy(el => el.que_count)
			.takeRight(5)
			.reverse()
			.value()
		const prevTop = _.chain(prevQuestion)
			.sortBy(el => el.que_count)
			.takeRight(5)
			.reverse()
			.value()
		if (JSON.stringify(currentTop) === JSON.stringify(prevTop)) {
			return true
		}
		const pieData = _.map(currentTop, el => ([el.content, el.que_count]))
		setTimeout(() => {
			this.pieChart && this.pieChart.chart.load({
				columns: pieData,
				unload: true
			})
		}, 1)
	}

	componentWillMount = () => {
		this.props.onChangeScale(7)
	}

	onChange = (e, { value }) => {
		this.props.onChangeScale(value)
	}

	render = () => {
		const { t, report, scale, loading, reportStat: { question_count: questionCount } } = this.props;
		moment.locale(localStorage.i18nextLng.toLowerCase())
		const dateOptions = [
			{ key: 0, value: 7 , text: t('chatbot.analysis.options._7') },
			{ key: 1, value: 14 , text: t('chatbot.analysis.options._14') },
			{ key: 2, value: 30 , text: t('chatbot.analysis.options._30') }
		]

		const dateLimit = moment().subtract(scale, 'day')
		const chartData = _.chain(report)
			.filter(el => moment(el.date, 'YYYY/MM/DD').isAfter(dateLimit, 'day'))
			.map(item => _.assign({ unhandled_count: item.total_chat - item.success_count }, item))
			.value()
		const totalChat = _.sumBy(chartData, 'total_chat')
		const totalSuccess = _.sumBy(chartData, 'success_count')
		const successRate = (totalSuccess / totalChat) || 0
		const questionsTop = _.chain(questionCount)
			.sortBy(el => el.que_count)
			.takeRight(5)
			.reverse()
			.value()
		const questionsJSON = _.map(questionsTop, el => ({[el.content]: el.que_count}))
		const questionsJSONKeys = _.reduce(questionsTop, (acc, o) => (acc = [...acc, o.content]), [])
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

		return (
			<div className='analysis-container'>
				<Dimmer inverted active={loading} />
				<Loader active={loading} />
				<Grid>
					<Grid.Row>
						<Grid.Column>
							<Button.Group className='scale-button-group'>
								{_.map(dateOptions, el =>
									<Button
										color='blue'
										basic={scale !== el.value}
										key={el.key}
										active={scale === el.value}
										onClick={this.onChange.bind(this, this, {value: el.value})}>
											{el.text}
									</Button>)
								}
							</Button.Group>
						</Grid.Column>
					</Grid.Row>
					<Grid.Row columns={2}>
						<Grid.Column computer={12} tablet={10} mobile={16}>
							<Chart
								ref={el => {this.chartEl = el}}
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
								transition={{
									duration: 0 
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
						</Grid.Column>
						<Grid.Column computer={4} tablet={6} mobile={16}>
							<Header>{t('chatbot.analysis.top_5')}</Header>
							<Chart
								ref={el => {this.pieChart = el}}
								data={{
									type: 'pie',
									json: questionsJSON,
									keys: {
										value: questionsJSONKeys
									}
								}}
								pie={{
									label: {
										format: v => v
									}
								}}
								legend={{
									show: true,
									position: 'bottom' 
								}}
								axis={{
									x: {
										type: 'category'
									}
								}}
							/>
							{questionsJSONKeys.length ?
							'' : <p>{t('chatbot.history.empty')}</p>}
						</Grid.Column>
					</Grid.Row>
					<Grid.Row>
						<Grid.Column>
							<Statistic.Group widths={stats.length}>
								{_.map(stats, el => <Statistic key={el.key}>
									<Statistic.Value>{el.text}</Statistic.Value>
									<Statistic.Label>{el.label}</Statistic.Label>
								</Statistic>)}
							</Statistic.Group>
						</Grid.Column>
					</Grid.Row>
				</Grid>
			</div>
		)
	}
}

const mapStateToProps = (state, ownProps) => ({
	activeBot: ownProps.match.params.id,
	report: state.getIn(['bot', 'bots', ownProps.match.params.id, 'report']) || [],
	reportStat: state.getIn(['bot', 'bots', ownProps.match.params.id, 'reportStat']) || {question_count: []}
});

Analysis.propTypes = {
	fetchReport: PropTypes.func.isRequired
};

export default compose(
	translate('translations'),
	connect(mapStateToProps,{ fetchReport }),
	toJS
)(Analysis);
