const rootUrl = 'http://localhost:8080/engine-rest';
class Api {
  async getHistoryProcessInstance(processInstanceId) {
    return fetch(`${rootUrl}/history/process-instance/${processInstanceId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(response => response.json());
  }
  async getProcessDefinition(processDefinitionId) {
    return fetch(`${rootUrl}/process-definition/${processDefinitionId}/xml`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(response => response.json());
  }
  async getProcessInstanceActivities(processInstanceId) {
    return fetch(`${rootUrl}/history/activity-instance?processInstanceId=${processInstanceId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(response => response.json());
  }
}
export default new Api();
