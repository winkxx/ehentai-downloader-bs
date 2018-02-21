import React from 'react';
import {connect} from 'react-redux';
import {withRouter, Link} from 'react-router-dom';
import {fetchTaskFilesInfo, cleanTaskInfo} from '../actions';
import {actions as messageActions} from '../../MessageProvider';
import PhotoSwipeComponent from './PhotoSwipe';
import './style.css';

class TaskPreview extends React.Component {
  constructor() {
    super(...arguments);
    this.firstPrompt = true;
  }

  render() {
    if(!this.props.info) {
      return null;
    }

    let info = this.props.info;

    if(info.errMsg) {
      this.props.displayMessage(info.errMsg);
      return null;
    }

    if(info.files.length === 0) {
      this.props.displayMessage('没有可以加载的东西');
      return null;
    }

    if(this.firstPrompt && info.state !== 'success') {
      this.firstPrompt = false;
      this.props.displayMessage('当前任务没有完成下载，仅可以预览部分图片');
    }

    let items = info.files.map(file => ({
      src: `/task/${info.id}/preview/${file.index}`,
      title: `${info.title}[${file.fileName}]`,
      w: file.width,
      h: file.height
    }));

    let matchedURL = this.props.match.url;

    return (
      <div className="task-preview">
        <header>
          <h2 className="title">{info.title}</h2>
        </header>
        <div className="view-area">
          {
            info.files.map(({index, fileName}, arrIndex) => (
              <div key={index} className="thumb">
                <Link to={matchedURL + (/\/$/.test(matchedURL) ? '' : '/') + arrIndex}>
                <img
                  src={`/task/${info.id}/preview/${index}?thumb=yes`}
                  alt={fileName}
                  onLoad={this.onImageLoad}
                />
                </Link>
              </div>
            ))
          }
          {/* 用来对齐flex最后一行的空元素 */}
          <div className="thumb empty"></div>
          <div className="thumb empty"></div>
          <div className="thumb empty"></div>
          <div className="thumb empty"></div>
          <div className="thumb empty"></div>
          <div className="thumb empty"></div>
          <div className="thumb empty"></div>
          <div className="thumb empty"></div>
        </div>
        <PhotoSwipeComponent items={items} match={this.props.match} />
      </div>
    )
  }

  onImageLoad(ev) {
    ev.target.classList.add('load');
  }

  componentDidMount() {
    this.props.fetchTaskFilesInfo(this.props.id);
  }

  componentWillUnmount() {
    this.props.cleanTaskInfo();
  }
}

const mapStateToProps = state => ({
  info: state.taskPreview
});

const mapDispatchToProps = dispatch => ({
  fetchTaskFilesInfo: (id) => dispatch(fetchTaskFilesInfo(id)),
  cleanTaskInfo: () => dispatch(cleanTaskInfo()),
  displayMessage: text => dispatch(messageActions.displayMessage(text))
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TaskPreview));