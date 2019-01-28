import React, {Component, Fragment} from 'react'
import _ from 'lodash'
import {List, Image, Icon, Grid, Form, Divider, Header, Button, Label} from 'semantic-ui-react'
import { compose } from 'recompose'
import { translate, Trans} from 'react-i18next'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import toJS from '../utils/ToJS'
import { updateBot } from 'actions/bot'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import FBIntegrationPage from './FBIntegrationPage'
import LineIntegrationPage from './LineIntegrationPage'
import WebIntegrationPage from './WebIntegrationPage'

class Integration extends Component {

	constructor(props) {
		super(props)
		this.counter = 0
		this.state = {
			loading: false,
			info: props.info,
			copied: false,
			show: {
				facebook: false,
				line: false,
				web: false
			}
		}
		
	}

	render() {
		const { supportPlatforms, t, match } = this.props
		const { info, info: {platform: activatedPlatforms}, copied, loading, show} = this.state
		const currentPlatforms = _.filter(supportPlatforms, plat => _.find(activatedPlatforms, p => p == plat.id))
		const platformParam = match.params.platform
		const shownPlatforms = platformParam ? supportPlatforms.filter(plat => plat.name.toLowerCase() === platformParam) : supportPlatforms

		const allSections = [
			{
				name: 'facebook',
				content: FBIntegrationPage,
			},
			{
				name: 'line',
				content: LineIntegrationPage,
			},
			{
				name: 'web',
				content: WebIntegrationPage,
			}
		]
		const shownSections = allSections.filter(sec => shownPlatforms.find(plat => plat.name.toLowerCase() === sec.name))

		return <Grid className='integration-page'>
			{shownSections.reduce((acc, o) => {
				if (acc.length) {
					acc.push(<Divider key={`divider${acc.length}`} />)
				}
				acc.push(o.content)
				return acc
			}, [])}
		</Grid>
	}
}

const mapStateToProps = (state, props) => ({
	activeBot: props.match.params.id,
	info: state.getIn(['bot', 'bots', props.match.params.id]) || {},
	supportPlatforms: state.getIn(['bot', 'supportPlatforms']) || []
})
export default compose(
	withRouter,
	connect(mapStateToProps, { updateBot }),
	translate(),
	toJS
)(Integration)