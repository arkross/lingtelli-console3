import React from 'react'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { NavLink } from 'react-router-dom'
import _ from 'lodash'
import Dropzone from "react-dropzone"
import { Button, Icon, Table, Dropdown, Input } from 'semantic-ui-react'
import FileDownload from "react-file-download"
import groupApis from "apis/group"
import { fetchTemplates, updateTemplate, fetchTemplateFAQGroups, uploadFAQ } from '../../../actions/template'
import toJS from 'components/utils/ToJS'
import DeletionModal from '../../modals/DeletionModal'

class TemplatesPage extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			openDeleteModal: false,
			data: props.templates,
			changes: []
		}
	}

	componentDidMount() {
		this.fetchTemplates()
	}

	fetchTemplates = () => {
		return this.props.fetchTemplates().then(() => {
			this.calculateChanges(this.props.templates)
		})
	}

	calculateChanges = (newTemplates) => {
		const changes = _.filter(newTemplates, template => JSON.stringify(_.find(this.props.templates, (dtemplate => dtemplate.id === template.id))) !== JSON.stringify(template))
		this.setState({ data: newTemplates, changes })
	}

	onFormChange = (id, e, data) => {
		const { name, value } = data
		const index = this.state.data.findIndex(template => template.id === id)
		const clone = _.cloneDeep(this.state.data)
		const newData = _.set(clone, [index, name], value)
		this.calculateChanges(newData)
	}

	onSubmit = e => {
		const { data: templates, changes } = this.state
		const promises = changes.map(template => this.props.updateTemplate(template.id, {
			robot_name: template.robot_name
		}))
		this.setState({loading: true})
		return Promise.all(promises).then(() => {
			this.fetchTemplates().then(() => {
				this.setState({ loading: false })
			})
		})
	}

	onCloseDeleteModal = () => {
		this.setState({ openDeleteModal: false })
	}

	onDeleteClick = id => {
		this.setState({
			openDeleteModal: true
		})
	}

	onVendorClick = (e) => {
		const el = e.target
		// do select text
	}

	render() {
		const { members, match } = this.props
		const { data: templates, changes, openDeleteModal } = this.state
		
		return <div>
			<NavLink to='/agent/templates/create' className='ui button green'><Icon name='plus' /> Create</NavLink>
			<Button content='Save Changes' floated='right' primary icon='save' disabled={changes.length === 0} onClick={this.onSubmit} />
			<Table>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell>Name</Table.HeaderCell>
						<Table.HeaderCell>Actions</Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{_.map(templates, template => {
						const isChanged = changes.findIndex(c => c.id === template.id) >= 0
						return <Table.Row key={template.id} warning={isChanged}>
							<Table.Cell><Input name='robot_name' onChange={this.onFormChange.bind(null, template.id)} value={template.robot_name} /></Table.Cell>
							<Table.Cell>
								<Button.Group>
									<NavLink className='ui button' to={`/agent/templates/${template.id}`}><Icon name='file alternate' />Details</NavLink>
								</Button.Group>
							</Table.Cell>
						</Table.Row>
					})}
				</Table.Body>
			</Table>
		</div>
	}
}

const mapStateToProps = (state, props) => ({
	members: state.getIn(['agent', 'allMembers']) || [],
	templates: state.get('template') || []
})

export default compose(
	connect(mapStateToProps, { fetchTemplateFAQGroups, uploadFAQ, fetchTemplates, updateTemplate }),
	toJS
)(TemplatesPage)