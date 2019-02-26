import React, {Component} from 'react'
import AnalysisWidget from 'components/widgets/Analysis'
import BasicSettingsWidget from 'components/widgets/BasicSettings'
import { Grid, Segment } from 'semantic-ui-react'

class BotDashboard extends Component {
	compoonentDidMount() {
		this.props.fetchData()
	}
	render() {
		return <Grid className='bot-dashboard' >
			<Grid.Row>
				<Grid.Column>
					<Segment>
						<AnalysisWidget {...this.props} />
					</Segment>
				</Grid.Column>
			</Grid.Row>
		</Grid>
	}
}

export default BotDashboard
