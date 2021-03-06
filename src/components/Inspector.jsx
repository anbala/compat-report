import { h, Component } from 'preact'
import { connect } from 'preact-redux'
import { bindActionCreators } from 'redux'
import reducer from './../reducers'
import * as actions from './../actions'
import css from './Inspector.css'
import Link from './Link.jsx'
import Placeholder from './Placeholder.jsx'

class Inspector extends Component {
  _handleLineToggle (number) {
    const {
      openLines
    } = this.state

    this.setState({
      openLines: Object.assign({}, openLines, {
        [number]: !Boolean(openLines[number])
      })
    })
  }

  constructor (props) {
    super(props)

    this.state.openLines = {}
  }

  render () {
    const {
      data,
      stylesheets,
      tabActive,
      tabs
    } = this.props
    const {
      openLines
    } = this.state
    const {
      browser,
      issue,
      issueInstance,
      stylesheet,
      version
    } = tabs[tabActive].data

    let issuesByKey = {}
    let issuesByLine = {}

    if (!stylesheet) {
      return (
        <Placeholder>
          Select a stylesheet from the sidebar
        </Placeholder>
      )
    }

    const issues = data[browser][version]

    Object.keys(issues).forEach(issueKey => {
      issuesByKey[issueKey] = 0

      issues[issueKey].filter(occurrence => {
        return occurrence.source === stylesheet
      }).forEach(occurrence => {
        const startLine = occurrence.instance.start.line

        // 0-index so it's more convenient for Array.map
        issuesByLine[startLine - 1] = issuesByLine[startLine - 1] || {
          instance: issuesByKey[issueKey]++,
          issueKey,
          lines: occurrence.instance.end.line - startLine
        }
      })
    })

    let propertyIndex = 0
    let scrolled = false

    return (
      <div
        class={css.container}
        ref={el => this.containerRef = el}
      >
        <div class={css.lineContainer}>
          {stylesheet && stylesheets[stylesheet].map((line, number) => {
            if (issuesByLine[number]) {
              const lineIssue = issuesByLine[number]
              const issueData = data[browser][version][lineIssue.issueKey]
                .filter(issue => {
                  return issue.source === stylesheet
                })[lineIssue.instance]

              let lineClasses = [
                css.lineContents,
                css.lineHighlight
              ]

              if (openLines[number]) {
                lineClasses.push(css.lineOpen)
              }

              return (
                <div
                  class={css.line}
                  ref={el => {
                    if (
                      el &&
                      this.containerRef &&
                      !scrolled &&
                      lineIssue.issueKey === issue &&
                      lineIssue.instance === issueInstance
                    ) {
                      scrolled = true

                      this.containerRef.scrollTop = el.offsetTop - 60
                    }
                  }}
                >
                  <div
                    class={lineClasses.join(' ')}
                    onClick={this._handleLineToggle.bind(this, number)}
                  >
                    <pre dangerouslySetInnerHTML={{__html: line.length > 0 ? line : '&nbsp;'}} />
                  </div>

                  {openLines[number] && (
                    <div class={css.lineBody}>
                      {issueData.missingPrefixes && (
                        <p>
                          <strong>Missing vendor prefixes: </strong>

                          {issueData.missingPrefixes.map(p => (
                            <code>{p}</code>
                          ))}
                        </p>
                      )}

                      <p><strong>Source:</strong> {issueData.source}</p>

                      <p><strong>Position:</strong> {(() => {
                        if (issueData.instance.start.line === issueData.instance.end.line) {
                          return `Line ${issueData.instance.start.line}`
                        } else {
                          return `Lines ${issueData.instance.start.line}-${issueData.instance.end.line}`
                        }
                      })()}, columns {issueData.instance.start.column}-{issueData.instance.end.column}</p>

                      {Boolean(issueData.data.__compat.mdn_url) && (
                        <p>
                          <strong>Documentation: </strong>
                          <Link href={issueData.data.__compat.mdn_url}>Open MDN page</Link>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            } else {
              return (
                <div
                  class={css.line}
                >
                  <pre dangerouslySetInnerHTML={{__html: line.length > 0 ? line : '&nbsp;'}} />
                </div>
              )
            }
          })}
        </div>
      </div>
    )
  }
}

export default connect(
  state => state,
  dispatch => bindActionCreators(actions, dispatch)
)(Inspector)
