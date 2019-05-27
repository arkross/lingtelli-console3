import React from 'react'
import {Breadcrumb, Responsive} from 'semantic-ui-react'
import {Link} from 'react-router-dom'
import {connect} from 'react-redux'
import _ from 'lodash'
import toJS	from '../../utils/ToJS'

class LingBreadcrumbs extends React.Component {
	render() {
		const {pathname, t, bots} = this.props
		const paths = _.map(pathname.split('/').slice(1), (el, key, arr) => {
	
			// First key
			if (key === 0) return{
				key,
				content: (<Link to={'/dashboard'}>{t('menu.dashboard')}</Link>),
				active: (key === arr.length - 1)
			}

			if (arr[key - 2] === 'bot') {
				return {
					key,
					content: t(`chatbot.${el}.text`),
					active: key === arr.length -1
				}
			}
		
			if (el === 'bot') {
				return {
					key,
					content: t(`menu.${el}`)
				}
			}

			if (arr[key - 1] === 'bot' && !isNaN(parseFloat(el))) {
				const bot = _.find(bots, o => o.id === parseFloat(el))
				return {
					key,
					content: (<Link to={`/${arr.slice(0, key + 1).join('/')}`}>{bot ? bot.robot_name : el}</Link>),
				}
			}

			// Last key
			if (key === arr.length - 1) return {
				key,
				content: t(`menu.${el}`),
				active: (key === arr.length - 1)
			}
		
			return {
				key,
				content: (<Link to={`${arr.slice(0, key + 1).join('/')}`}>{t(`menu.${el}`)}</Link>),
				active: (key === arr.length - 1),
				link: (key < arr.length - 1)
			}
		})
		return <Breadcrumb icon='chevron right' sections={paths} />
	}
}

const mapStateToProps = (state) => ({
	bots: state.getIn(['bot', 'bots'])
})

export default connect(mapStateToProps)(toJS(LingBreadcrumbs))