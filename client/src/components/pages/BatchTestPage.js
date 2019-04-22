import React, {Component, Fragment} from 'react'
import { connect } from 'react-redux'
import { Input, Container, Header, List, Icon, Form, Table, Grid, Button, Checkbox, Label, Image, Modal} from 'semantic-ui-react'
import { compose } from 'recompose';
import { translate } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import api from 'apis/demo'
import toJS from 'components/utils/ToJS'
import _ from 'lodash'
import moment from 'moment'

class BatchTestPage extends Component {
	constructor(props) {
		super(props)
		this.state = {
			records: [],
			openDescriptionModal: false,
			file: null,
			isRunning: false,
			isParsingCSV: false,
			showExpected: false,
			showPostback: true,
		}
	}

	CSVtoArray = text => {
    var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
		// var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
		var re_value = /(?:"((?:[^"]|"")*)")|([^,"\n\r]*)(,|,?\r?\n|\r)/gm
    // Return NULL if input string is not well formed CSV string.
		// if (!re_value.test(text)) return []
		
    var a = [], result = []  // Initialize array to receive values.
		var row = []
		while((a = re_value.exec(text)) !== null) {
			row.push(a[1] || a[2])
			if (/[\r?\n]/.test(a[3]) || !a[3]) {
				result.push(row)
				row = []
			}
			if (!a[3]) {
				break
			}
		}
		
    // Handle special case of empty last value.
    if (/,\s*$/.test(text)) result.push('')
    return result
	}

	readCsv = text => {
		const rows = this.CSVtoArray(text)
		const records = rows.filter(row => (row && row[0])).map(row => ({
			question: row[0].trim(),
			expected: row[1] ? row[1].trim() : '',
			isEditing: false,
			isRun: false,
			isRunning: false,
			isError: false,
			isExactMatch: false,
			response: {}
		}))
		this.setState({ records })
	}

	handleToggleExpected = e => {
		this.setState({
			showExpected: !this.state.showExpected
		})
	}

	handleTogglePostback = e => {
		this.setState({
			showPostback: !this.state.showPostback
		})
	}

	handleUpload = e => {
		e.preventDefault()
		this.setState({ isParsingCSV: true })
		const file = e.target.files[0]
		if ( ! file) {
			return false
		}
		e.target.value = ''
		const fr = new FileReader
		fr.onload = (evt) => {
			const text = evt.target.result
			this.readCsv(text)
			this.setState({ isParsingCSV: false })
		}
		fr.readAsText(file)
	}

	handleRun = async e => {
		e.preventDefault()
		const records = _.cloneDeep(this.state.records)
		this.setState({
			isRunning: true
		})
		for(let i = 0; i < records.length; i++) {
			await this.handleIndividualRun(i, e)
		}
		this.setState({ isRunning: false })
	}

	handleIndividualRun = async (index, e) => {
		e.preventDefault()
		const records = _.cloneDeep(this.state.records)
		_.set(records, [index, 'isRunning'], true)
		const record = records[index]
		try {
			const response = await this.sendMessage(record.question)
			_.set(records, [index, 'response'], response)
			_.set(records, [index, 'isRun'], true)
			_.set(records, [index, 'isEditing'], false)
			_.set(records, [index, 'isRunning'], false)
			_.set(records, [index, 'isExactMatch'], this.responseToMatch(response, record.expected))
		} catch(err) {
			_.set(record, [index, 'isError'], true)
			_.set(record, [index, 'isRunning'], false)
			_.set(record, [index, 'isEditing'], false)
			_.set(record, [index, 'isRun'], false)
		}
		this.setState({ records })
	}

	responseToString = resObj => {
		const { t } = this.props
		if (resObj.data && resObj.data.buttons) {
			return <Fragment>
				<div>{!this.state.showPostback && <Label content={t('chatbot.batch.choice')} horizontal/>}<strong>{resObj.data.title}</strong></div>
				{this.state.showPostback &&
				<List divided bulleted>
					{resObj.data.buttons.map(button => <List.Item key={button.id}>
						<List.Content>{button.text}</List.Content>
					</List.Item>)}
				</List>}
			</Fragment>
		} else if (resObj.data && resObj.data.text) {
			return <p>
				{resObj.data.text}
			</p>
		}
		return ''
	}

	responseToMatch = (resObj, expected) => {
		if (resObj.data) {
			return (resObj.data.title === expected) || (resObj.data.text === expected)
		}
		return false
	}

	handleChangeEditing = (index, toState = true, e) => {
		const records = _.clone(this.state.records)
		_.set(records, [index, 'isEditing'], toState)
		this.setState({
			records
		})
	}

	handleQuestionChange = (index, e, { value }) => {
		const records = _.clone(this.state.records)
		_.set(records, [index, 'question'], value)
		if (records[index]['isRun']) {
			_.set(records, [index, 'response'], {})
			_.set(records, [index, 'isRun'], false)
			_.set(records, [index, 'isExactMatch'], false)
			_.set(records, [index, 'isError'], false)
		}
		this.setState({
			records
		})
	}

	sendMessage = message => {
		return api.ask(this.props.info.vendor_id, message)
	}

	handleReadMoreClick = e => {
		e.preventDefault()
		this.setState({ openDescriptionModal: true })
	}

	handleCloseModal = () => {
		this.setState({ openDescriptionModal: false })
	}

	render() {
		const { t, info } = this.props
		const { records, showExpected, showPostback, isRunning, isParsingCSV, openDescriptionModal } = this.state
		const img = require('../../assets/img/chatbot/csvdemo.png')

		const total = records.length
		const errors = records.filter(record => (record.isRun && record.response.type === 'error')).length
		const run = records.filter(record => record.isRun).length
		const exact = records.filter(record => (record.isRun && record.isExactMatch)).length

		return <Grid>
			<Grid.Row>
				<Grid.Column>
					<Header style={{float: 'left'}}>{t('chatbot.batch.text')}</Header>
					<NavLink style={{float: 'right'}} to={`/dashboard/bot/${info.id}/test`}>{t('chatbot.batch.basic')}</NavLink>
				</Grid.Column>
			</Grid.Row>
			<Grid.Row>
				<Grid.Column>
					<Form>
						<Form.Field>
							<label>{t('chatbot.batch.uploadCsv')}</label>
							<p>{t('chatbot.batch.popup')}. <a href="#" onClick={this.handleReadMoreClick}>{t('chatbot.batch.readMore')}</a></p>
							<Input type='file' loading={isParsingCSV} onChange={this.handleUpload} placeholder={'CSV file'} action={<Button content={t('chatbot.batch.run')} onClick={this.handleRun} primary icon='play' disabled={!total} loading={isRunning} />} />
							<p></p>
						</Form.Field>
						<Form.Field>
							<Checkbox label={t('chatbot.batch.showExpected')} checked={showExpected} onChange={this.handleToggleExpected} />
						</Form.Field>
						<Form.Field>
							<Checkbox label={t('chatbot.batch.showPostback')} checked={showPostback} onChange={this.handleTogglePostback} />
						</Form.Field>
					</Form>
				</Grid.Column>
			</Grid.Row>
			<Grid.Row>
				<Grid.Column>
					<Header>{t('chatbot.batch.result')}</Header>
					<Label content={t('chatbot.batch.total')} detail={total} /><Label content={t('chatbot.batch.executed')} detail={run} color='teal' /><Label content={t('chatbot.batch.errors')} detail={errors} color='red' /><Label content={t('chatbot.batch.matches')} detail={exact} color='green' />
					<Table celled compact='very'>
						<Table.Header>
							<Table.Row>
								<Table.HeaderCell collapsing></Table.HeaderCell>
								<Table.HeaderCell width={showExpected ? 6 : 8}>{t('chatbot.batch.question')}</Table.HeaderCell>
								<Table.HeaderCell width={showExpected ? 6 : 9}>{t('chatbot.batch.actual')}</Table.HeaderCell>
								{showExpected &&
								<Table.HeaderCell width={5}>{t('chatbot.batch.expected')}</Table.HeaderCell>}
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{records.map((record, idx) => <Table.Row key={idx} disabled={record.isError}>
								<Table.Cell>
									{!record.isRun ? <Button size='small' icon='play' color='blue' loading={record.isRunning} onClick={this.handleIndividualRun.bind(null, idx)} /> : <Icon name='check' color='teal' />}
								</Table.Cell>
								<Table.Cell onClick={this.handleChangeEditing.bind(null, idx, true)}>
									{record.isEditing ?
									<Input fluid type='text' value={record.question} onBlur={this.handleChangeEditing.bind(null, idx, false)} onChange={this.handleQuestionChange.bind(null, idx)} /> : record.question}
								</Table.Cell>
								<Table.Cell negative={record.response.type === 'error'}>{record.response ? this.responseToString(record.response) : ''}</Table.Cell>
								{showExpected && <Table.Cell positive={record.isExactMatch}>{record.expected}</Table.Cell>}
							</Table.Row>)}
						</Table.Body>
					</Table>
					<Modal open={openDescriptionModal} onClose={this.handleCloseModal}>
						<Modal.Header>{t('chatbot.batch.csvFormat')}</Modal.Header>
						<Modal.Content image>
							<Image src={img} centered rounded />
							<Modal.Description>
								<p>{t('chatbot.batch.description')}</p>
								<p>{t('chatbot.batch.description2')}</p>
							</Modal.Description>
						</Modal.Content>
					</Modal>
				</Grid.Column>
			</Grid.Row>
		</Grid>
	}
}

const mapStateToProps = (state, props) => ({
	info: props.info ? props.info : (state.getIn(['bot', 'bots', props.match.params.id]) || {}),
	supportPlatforms: state.getIn(['bot', 'supportPlatforms']) || [],
	user: state.get('user')
})

export default compose(
	connect(mapStateToProps),
	translate(),
	toJS
)(BatchTestPage)