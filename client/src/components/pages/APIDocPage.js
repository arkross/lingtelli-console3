import React, {Component} from 'react'
import ReactMD from 'react-markdown'
import api_en from '../../docs/en/api.md'
import api_tw from '../../docs/zh-TW/api.md'
import api_cn from '../../docs/zh-CN/api.md'
import qs from 'query-string'
import hljs from 'highlight.js'
import 'github-markdown-css/github-markdown.css'
import 'highlight.js/styles/github.css'

hljs.registerLanguage('http', function(hljs) {
  var VERSION = 'HTTP/[0-9\\.]+';
  return {
    aliases: ['https'],
    illegal: '\\S',
    contains: [
      {
        begin: '^' + VERSION, end: '$',
        contains: [{className: 'number', begin: '\\b\\d{3}\\b'}]
      },
      {
        begin: '^[A-Z]+ (.*?)$', returnBegin: true, end: '$',
        contains: [
          {
            className: 'string',
            begin: ' ', end: ' ',
						excludeBegin: true, excludeEnd: true,
						contains: [
							{
								className: 'param',
								begin: '{',
								end: '}'
							}
						]
          },
          {
            begin: VERSION
          },
          {
            className: 'keyword',
            begin: '[A-Z]+'
					}
        ]
      },
      {
        className: 'attribute',
        begin: '^\\w', end: ': ', excludeEnd: true,
        illegal: '\\n|\\s|=',
        starts: {end: '$', relevance: 0}
      },
      {
        begin: '\\n\\n',
        starts: {subLanguage: [], endsWithParent: true}
      }
    ]
  };
})

class APIDocPage extends Component {
	constructor(props) {
		super(props)
		document.title = 'Lingtelli Chatbot API'
		this.state = {
			content: ''
		}
	}

	loadMd() {
		const vendor_id = this.props.vendorId
		const rootUrl = process.env.REACT_APP_WEBHOOK_API_HOST + (vendor_id ? `/${vendor_id}` : '/{vendor_id}')
		const webhookUrl = process.env.REACT_APP_WEBHOOK_HOST + (vendor_id ? `/${vendor_id}` : '/{vendor_id}')

		const params = this.props.location ? qs.parse(this.props.location.search) : {lang: ''}
		let accLang = api_en
		if (params.lang) {
			switch (params.lang) {
				case 'tw': accLang = api_tw; break;
				case 'cn': accLang = api_cn; break;
			}
		} else {
			switch (localStorage.i18nextLng) {
				case 'zh-TW': accLang = api_tw; break;
				case 'zh-CN': accLang = api_cn; break;
			}
		}

		fetch(accLang)
			.then(response => response.text())
			.then(text => {
				this.setState({ content: text.replace(/{{{BASE_URL}}}/g, rootUrl).replace(/{{{WEBHOOK_URL}}}/g, webhookUrl) })
			})
	}

	componentDidMount() {
		this.loadMd()
	}

	render() {
		const { content } = this.state
		return <ReactMD
			source={content}
			className='markdown-body'
			renderers={{
				heading: HeadingRenderer,
				code: CodeBlock
			}}
		/>
	}
}

function flatten(text, child) {
  return typeof child === 'string'
    ? text + child
    : React.Children.toArray(child.props.children).reduce(flatten, text)
}

function HeadingRenderer(props) {
  var children = React.Children.toArray(props.children)
  var text = children.reduce(flatten, '')
	var slug = text.toLowerCase().replace(/\W/g, '-')

	// Not giving anchor name for h6
	if (props.level > 5) {
		return React.createElement('h' + props.level, {}, props.children)
	}
  return React.createElement('h' + props.level, {id: slug}, props.children)
}

class CodeBlock extends React.PureComponent {
  constructor(props) {
    super(props)
    this.setRef = this.setRef.bind(this)
  }

  setRef(el) {
    this.codeEl = el
  }

  componentDidMount() {
    this.highlightCode()
  }

  componentDidUpdate() {
    this.highlightCode()
  }

  highlightCode() {
    hljs.highlightBlock(this.codeEl)
  }

  render() {
    return (
      <pre>
        <code ref={this.setRef} className={`language-${this.props.language}`}>
          {this.props.value}
        </code>
      </pre>
    )
  }
}

export default APIDocPage