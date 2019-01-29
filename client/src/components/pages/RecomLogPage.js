import React, {Component} from 'react'
import { connect } from 'react-redux'
import { compose } from 'recompose'
import { translate } from 'react-i18next'
import toJS from 'components/utils/ToJS'
import { fetchMatching } from 'actions/bot'
import { Header, Table, Container, Dimmer, Loader } from 'semantic-ui-react'
import _ from 'lodash'

class RecomLogPage extends Component {
	state = {
		loading: true
	}

	handleAfterFetch = () => {
		this.setState({ loading: false})
	}

	componentWillUnmount() {
		this.handleAfterFetch = () => {}
	}

	componentDidMount() {
		this.props.fetchMatching(this.props.activeBot)
			.then(data => {
				this.handleAfterFetch()
			}, err => {
				this.handleAfterFetch()
			})
	}
	
	render() {
		const { t, data } = this.props
		const { loading } = this.state
		
		return <Container fluid textAlign='center'>
			<Dimmer inverted active={loading} />
			<Loader active={loading} />

			{ (data && data.length) ? 
			<div>
								 
				<Table celled>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell>
								{t('chatbot.recommendations.ori_question')}
							</Table.HeaderCell>
							<Table.HeaderCell>
								{t('chatbot.recommendations.selected_question')}
							</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{_.map(data, el => <Table.Row key={el.id}>
							<Table.Cell>{el.ori_question}</Table.Cell>
							<Table.Cell>{el.select_question}</Table.Cell>
						</Table.Row>)}
					</Table.Body>
				</Table>
			</div> : <Header as='h4'>{t('chatbot.history.empty')}</Header>}
		</Container>
	}
}

const mapStateToProps = (state, props) => ({
	data: state.getIn(['bot', 'bots', props.match.params.id, 'recomlog']) || [],
	activeBot: props.match.params.id
})

export default compose(
	translate(),
	connect(mapStateToProps, { fetchMatching }),
	toJS
)(RecomLogPage)
