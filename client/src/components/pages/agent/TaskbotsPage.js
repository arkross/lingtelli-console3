import React from 'react'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import Dropzone from "react-dropzone"
import { fetchGroups, uploadGroups, trainGroups } from "actions/group"
import { Button, Icon } from 'semantic-ui-react'
import FileDownload from "react-file-download"
import groupApis from "apis/group"
import toJS from 'components/utils/ToJS'

class TaskbotsPage extends React.Component {
	onExport = (e, id) => {
		groupApis.export(id)
			.then(data => FileDownload(data, 'export.csv'))
			.catch(() => this.setState({ errors: 'Export FAQ Error' }));
	}

	onDrop = (id, acceptedFiles, rejectedFiles) => {
		const { t, uploadGroups } = this.props

		if (acceptedFiles.length) {
			const files = new FormData()
			files.append('file', acceptedFiles[0])

			this.setState({ loading: true })

			uploadGroups(id, files)
				.then(() => {
					this.setState({ success: 'Import FAQ Successful', errors: null })
				})
				.catch( res =>
					this.setState({ loading: false , success: null, errors: 'Import FAQ Error' })
				)
		}
	}

	onTrain = id => {
		const { t, trainGroups } = this.props

		this.setState({ loading: true })

		trainGroups(id)
			.then(() => this.setState({ loading: false, success: 'Training Successful' }))
			.catch(() => this.setState({ loading: false, errors: 'Training Failed' }))
	}

	render() {
		return <div>
			<Dropzone
				onDrop={this.onDrop}
				style={{ display: 'none' }}
				ref={(node) => { this.dropzoneRef = node }}
			>
			</Dropzone>
			<Button.Group size='mini' fluid>
				<Button size='mini' onClick={this.onExport.bind(null)} color='orange' icon><Icon name='download' /> Import FAQ</Button>
				<Button size='mini' onClick={() => this.dropzoneRef.open()} color='violet' icon><Icon name='upload' /> Export FAQ</Button>
				<Button size='mini' color='brown' icon><Icon name='flask' /> Train Model</Button>
			</Button.Group>
		</div>
	}
}

const mapStateToProps = (state, props) => ({
	members: state.getIn(['agent', 'members']) || [],
})

export default compose(
	connect(mapStateToProps, { fetchGroups, uploadGroups, trainGroups }),
	toJS
)(TaskbotsPage)