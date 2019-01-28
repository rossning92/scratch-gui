import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Box from '../components/box/box.jsx';
import GUI from '../containers/gui.jsx';
import HashParserHOC from '../lib/hash-parser-hoc.jsx';
import AppStateHOC from '../lib/app-state-hoc.jsx';
import TitledHOC from '../lib/titled-hoc.jsx';

import { setPlayer } from '../reducers/mode';
import VM from 'scratch-vm';

if (process.env.NODE_ENV === 'production' && typeof window === 'object') {
    // Warn before navigating away
    window.onbeforeunload = () => true;
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

class Player extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            data: {
                title: '佩奇贺喜',
                author: '陈希瑜',
                desc: '该作品是佩奇贺喜，从右边会不停有障碍物出现，我们需要帮助佩奇躲避障碍物。当我们不按空格键时，佩奇会往下掉，按下空格键时，佩奇会往上飞。',
                likes: 1048,
                projectFile: 'test.sb2',
            },
        };
    }

    componentDidMount() {
        let id;
        if (typeof g_projectId !== 'undefined') {
            id = g_projectId;
        } else {
            id = getParameterByName('id');
        }
         
        fetch('/static/projects/' + id + '.json')
            .then(response => response.json())
            .then(
                (json) => {
                    this.setState({
                        data: json,
                    });

                    this.loadProject(json.projectFile);
                },
                (error) => {
                    this.setState({
                        data: null,
                    });
                }
            );
    }

    // Load scratch 2 project
    loadProject(file) {
        fetch('/static/projects/' + file)
            .then(response => response.arrayBuffer())
            .then((buff) => {
                this.props.vm.loadProject(buff)
                    .then(() => {
                        this.setState({ isLoading: false });
                    })
                    .catch(error => {
                        this.setState({ loadingError: true, errorMessage: error });
                    });
            });
    }

    render() {
        return (
            <Box>
                <div className="ui top fixed inverted purple menu">
                    <div className="item">奇乐编程学院作品社区</div>
                </div>
                <div style={{marginTop: '40px'}}>
                    <GUI
                        enableCommunity
                        projectId={this.props.projectId}
                        isLoading={this.state.isLoading}
                    />
                    <div style={{ margin: '4px' }}>
                        <div className="ui segments">
                            <div className="ui segment">
                                <h4 className="ui header">
                                    {this.state.data.title}
                                    <div className="sub header">{this.state.data.author}</div>
                                </h4>
                            </div>
                            <div className="ui secondary segment">
                                <p>{this.state.data.desc}</p>
                            </div>
                        </div>
                        <div style={{textAlign: 'center', paddingTop: '20px'}}>
                            <div className="ui labeled button" tabindex="0">
                                <div className="ui red button">
                                    <i className="heart icon"></i> 点赞
                                </div>
                                <a className="ui basic red left pointing label">
                                    {this.state.data.likes}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </Box>
        );
    }
}

Player.propTypes = {
    onSeeInside: PropTypes.func,
    projectId: PropTypes.string,
    vm: PropTypes.instanceOf(VM).isRequired,
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm,
});

const mapDispatchToProps = dispatch => ({
    onSeeInside: () => dispatch(setPlayer(false))
});

const ConnectedPlayer = connect(
    mapStateToProps,
    mapDispatchToProps
)(Player);

// note that redux's 'compose' function is just being used as a general utility to make
// the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
// ability to compose reducers.
const WrappedPlayer = compose(
    AppStateHOC,
    HashParserHOC,
    TitledHOC
)(ConnectedPlayer);

const appTarget = document.createElement('div');
document.body.appendChild(appTarget);

ReactDOM.render(<WrappedPlayer isPlayerOnly />, appTarget);
