import React, {Fragment} from 'react';
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
	List,
	Button,
	Form,
	Input,
	Dimmer,
	Loader,
	Grid,
	Statistic,
	Dropdown,
	Responsive,
	Table,
} from 'semantic-ui-react';
import toJS from 'components/utils/ToJS'

class Analysis extends React.Component {
	state = {
		errors: {},
		platform: 'ALL',
		uid: '',
		report: [],
		loading: false
	}

	fetchData = (platform, uid) => {

		this.setState({ loading: true })
		this.props.fetchReport(
			this.props.activeBot,
			7,
			platform || this.state.platform,
			uid || this.state.uid)
			.then(() => {
				this.props.fetchReport(
				this.props.activeBot,
				30,
				platform || this.state.platform,
				uid || this.state.uid)
			}).finally(() => {
				this.setState({ loading: false })
			})
	}

	componentDidUpdate(prevProps) {
		if (prevProps.activeBot !== this.props.activeBot) {
			this.fetchData()
		}
	}

	componentDidMount = () => {
		this.fetchData(this.state.platform, this.state.uid)
	}

	onChange = (e, { value }) => {
		e.preventDefault()
		this.setState({ days: value })
		this.fetchData(this.state.platform, this.state.uid)
	}

	onFilterChange = (e, { value }) => {
		e.preventDefault()
		this.setState({ platform: value })
		this.fetchData(value, this.state.uid)
	}

	onInputUidChange = (e, { value }) => {
		e.preventDefault()
		this.setState({ uid: value })
	}

	onFilterSubmit = e => {
		e.preventDefault()
		this.fetchData()
	}

	render = () => {
		const { t, report, reportStat } = this.props
		const { platform, uid, days, loading } = this.state

		const questionCount = reportStat[30] ? reportStat[30].question_count : []
		moment.locale(localStorage.i18nextLng.toLowerCase())
		const dateOptions = [
			{ key: 0, value: 7 , text: t('chatbot.analysis.options._7') },
			{ key: 1, value: 30 , text: t('chatbot.analysis.options._30') }
		]
		
		const platformOptions = [
			{value: 'ALL', text: t('chatbot.history.platforms.all')},
			{value: 'FB', text: t('chatbot.history.platforms.fb')},
			{value: 'LINE', text: t('chatbot.history.platforms.line')},
			{value: 'WEB', text: t('chatbot.history.platforms.web')},
			{value: 'API', text: t('chatbot.history.platforms.api')},
			{value: 'OTHER', text: t('chatbot.history.platforms.other')}
		]
		
		const chartData = dateOptions.map(opt => ({
			days: opt.value,
			data: _.chain(report[opt.value])
			.map(item => _.assign({ unhandled_count: item.total_chat - item.success_count }, item))
			.value()
		}))
		
		const totalChat = _.sumBy(chartData[1].data, 'total_chat')
		const totalSuccess = _.sumBy(chartData[1].data, 'success_count')
		const successRate = (totalSuccess / totalChat) || 0
		const questionsTop = _.chain(questionCount)
		.sortBy(el => el.que_count)
		.takeRight(5)
		.reverse()
		.value()
		const questionsJSON = _.map(questionsTop, el => ({
			key: el.content,
			value: el.que_count
		}))
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

		return <div className={`analysis-container`}>
			<Dimmer inverted active={loading} />
			<Loader active={loading} />
			<Grid>
				<Grid.Row>
					<Grid.Column>
						<Form onSubmit={this.onFilterSubmit}>
							<Form.Group>
								<Form.Field>
									<label>{t('chatbot.history.filter')}</label>
									<Dropdown selection options={platformOptions} placeholder={t('chatbot.history.platform')} value={platform} onChange={this.onFilterChange} />
								</Form.Field>
								<Form.Field>
									<label>{t('chatbot.history.uid')}</label>
									<Input placeholder={t('chatbot.history.uid')} value={uid} onChange={this.onInputUidChange} />
								</Form.Field>
							</Form.Group>
						</Form>
					</Grid.Column>
				</Grid.Row>
				<Grid.Row columns={2}>
					<Grid.Column>
						<Header as='h3'>{t('chatbot.analysis.statistics_30')}</Header>
						<List bulleted>
							{_.map(stats, el => <List.Item key={el.key}>
								{el.label}: <strong>{el.text}</strong>
							</List.Item>)}
						</List>
					</Grid.Column>
					<Grid.Column>
						<Header>{t('chatbot.analysis.top_5')}</Header>
						<Table compact>
							<Table.Header>
								<Table.Row>
									<Table.HeaderCell>{t('chatbot.batch.question')}</Table.HeaderCell>
									<Table.HeaderCell>{t('chatbot.batch.total')}</Table.HeaderCell>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{questionsJSON.map(value => <Table.Row key={value.key}>
									<Table.Cell>{value.key}</Table.Cell>
									<Table.Cell>{value.value}</Table.Cell>
								</Table.Row>)}
							</Table.Body>
						</Table>
						{questionsJSONKeys.length ?
						'' : <p>{t('chatbot.history.empty')}</p>}
					</Grid.Column>
				</Grid.Row>
				{chartData.map(data => <Grid.Row key={data.days}>
					<Grid.Column>
						<Header>{t(`chatbot.analysis.options._${data.days}`)}</Header>
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
								json: data.data,
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
				</Grid.Row>)}
			</Grid>
		</div>
	}
}

const mapStateToProps = (state, ownProps) => ({
	activeBot: ownProps.match.params.id,
	report: state.getIn(['bot', 'bots', ownProps.match.params.id, 'report']) || {},
	reportStat: state.getIn(['bot', 'bots', ownProps.match.params.id, 'reportStat']) || {30: {question_count: []}}
});

Analysis.propTypes = {
	fetchReport: PropTypes.func.isRequired
};

export default compose(
	translate('translations'),
	connect(mapStateToProps,{ fetchReport }),
	toJS
)(Analysis);
