import React from 'react';
import {connect} from 'react-redux';
import {fetchTaskList} from '../actions';
import {actions as messageActions} from '../../MessageProvider';
import TaskItem from './TaskItem';
import '../style.css';

class TaskList extends React.Component {
  render() {
    if(this.props.errMsg) {
      this.props.displayMessage(this.props.errMsg);
    }
    return (
      <ul className="task-list">
        {
          this.props.list.map(item => (
            <TaskItem
              key={item.id}
              id={item.id}
              title={item.title}
              state={item.state}
              gurl={item.gurl}
            />
          ))
        }
      </ul>
    )
  }

  componentDidMount() {
    this.props.fetchTaskList();
    this.intervalID = setInterval(this.props.fetchTaskList, 3000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalID);
  }
}

const mapStateToProps = state => ({
  list: state.taskList.list,
  errMsg: state.taskList.errMsg
});

const mapDispatchToProps = dispatch => ({
  fetchTaskList: () => dispatch(fetchTaskList()),
  displayMessage: (text) => dispatch(messageActions.displayMessage(text))
});

export default connect(mapStateToProps, mapDispatchToProps)(TaskList);