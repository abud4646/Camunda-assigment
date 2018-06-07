import React, { Component } from 'React';
import { FormControl, Button, Grid, Row, Col } from 'react-bootstrap';
import Api from './api';
import BpmnViewer from 'bpmn-js';
import './styles.css';
import ReactDom from 'react-dom';

class App extends Component {
  constructor(props) {
    super(props);
    this.viewer = new BpmnViewer();
    this.state = {
      filteredActivities: [],
      selectedProcessId: '',
      renderDiagram: false,
      renderError: false,
    };
  }
  componentDidMount() {
    this.viewer.attachTo('#bmpnViwer');
  }
  async submit() {
    try {
      const id = this.state.selectedProcessId;
      const processInstance = await Api.getHistoryProcessInstance(id);
      const processDefinition = await Api.getProcessDefinition(processInstance.processDefinitionId);
      const { bpmn20Xml } = processDefinition;
      const ProcessInstanceActivities = await Api.getProcessInstanceActivities(id);
      this.openDiagram(bpmn20Xml, this.viewer, ProcessInstanceActivities);
    } catch (err) {
      this.setState({ renderError: true, renderDiagram: false });
      console.error('could not import BPMN 2.0 diagram', err);
    }
  }
  openDiagram(bpmnXML, bpmnViewer, activities) {
    // import diagram
    bpmnViewer.importXML(bpmnXML, err => {
      if (err) {
        this.setState({ renderError: true, renderDiagram: false });
        return console.error('could not import BPMN 2.0 diagram', err);
      }
      // access viewer components
      this.setState({ renderDiagram: true, renderError: false });
      const canvas = bpmnViewer.get('canvas');
      const overlays = bpmnViewer.get('overlays');
      const eventBus = bpmnViewer.get('eventBus');
      var events = ['element.click'];
      events.forEach(event => {
        eventBus.on(event, e => {
          const filteredActivities = activities.filter(
            activity => activity.activityId == e.element.id,
          );
          this.setState({ filteredActivities });
        });
      });
      // zoom to fit full viewport
      canvas.zoom('fit-viewport');
      // attach an overlay to a node
      const map = new Map();
      this.setState({ filteredActivities: activities });
      activities.forEach(activity => {
        let temp = map.get(activity.activityId) || { start: 0, end: 0 };

        if (activity.startTime) temp.start = temp.start + 1;
        if (activity.endTime) temp.end = temp.end + 1;
        map.set(activity.activityId, temp);
      });
      const keys = [...map.keys()];
      keys.forEach(key => {
        const { start, end } = map.get(key);
        overlays.add(key, 'note', {
          position: {
            bottom: -10,
            left: -10,
          },
          html: `<div class="diagram-note">${end}/${start}</div>`,
        });
      });
    });
  }
  onChange(e) {
    this.setState({ selectedProcessId: e.target.value, renderError: false });
  }

  render() {
    const { filteredActivities, selectedProcessId, renderError, renderDiagram } = this.state;
    return (
      <div className="container">
        <h1>Camunda hack session</h1>
        <div>
          {' '}
          <FormControl
            type="text"
            value={selectedProcessId}
            placeholder="Enter process instance id"
            onChange={e => this.onChange(e)}
            bsClass="input"
          />
          <Button
            onClick={() => this.submit()}
            bsSize="small"
            bsStyle="primary"
            disabled={selectedProcessId === ''}
          >
            Go
          </Button>
        </div>
        {renderError && (
          <div>
            <h2 className="errorMsg">Could not import BPMN 2.0 diagram :/</h2>
          </div>
        )}
        <div id="bmpnViwer" />
        {renderDiagram && (
          <div>
            <h4>
              Please click in the digram on a step to filter the list of activity instances
              accordingly
            </h4>
            <Grid>
              <Row>
                <Col md={4}>Name</Col>
                <Col md={4}>StartTime</Col>
                <Col md={4}>EndTime</Col>
              </Row>
              {filteredActivities.map((activity, key) => {
                return (
                  <Row key={key}>
                    <Col md={4}>{activity.activityName}</Col>
                    <Col md={4}>{activity.startTime}</Col>
                    <Col md={4}>{activity.endTime || 'didnt end'}</Col>
                  </Row>
                );
              })}
            </Grid>
          </div>
        )}
      </div>
    );
  }
}

ReactDom.render(<App />, document.getElementById('root'));
