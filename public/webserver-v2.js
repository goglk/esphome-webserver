import { render } from "preact";
import { html, Component } from "htm/preact";

// To do
// https://github.com/preactjs/preact-devtools
//import "preact/debug";
//import "preact/devtools";

// C:\Users\rhys\source\repos\wmr\examples\demo\public\pages\meta-tags.js
// C:\Users\rhys\source\repos\wmr\examples\demo\public\pages\json.js

class App extends Component {
  constructor() {
    super();
    const source = new EventSource("/events");

    const entityByid = entities.reduce((map, entity) => {
      map[`${entity.entity}-${entity.id}`] = entity;
      return map;
    }, {});

    source.addEventListener("state", function (e) {
      const data = JSON.parse(e.data.replace(":NaN", ":null")); //'{"id":"number-template_number","state":"nan","value":NaN}' invalid json
      let ref = entityByid[data.id];
      if (ref) {
        ref.state = data.state;
        ref.value = data.value;
      } else {
        // Dynamically add discovered..
        console.log(`discovered:${data.id}`);
        let parts = data.id.split("-");
        let entity = {
          entity: parts[0],
          id: parts[1],
          state: data.state,
          value: data.value,
          name: data.id,
          found: true,
        };
        entities.push(entity);
        entityByid[data.id] = entity;
      }
    });
    source.addEventListener("log", (e) => {
      let parts = e.data.slice(10, e.data.length - 4).split(":");
      const debug = {
        "[1;31m": "e",
        "[0;33m": "w",
        "[0;32m": "i",
        "[0;35m": "c",
        "[0;36m": "d",
        "[0;37m": "v",
      };
      const record = {
        sort: debug[e.data.slice(0, 7)],
        level: e.data.slice(7, 10),
        who: `${parts[0]}:${parts[1]}`,
        detail: parts[2],
        when: new Date().toTimeString().split(" ")[0],
      };
      this.addLog(record);
    });
  }

  addLog(log) {
    const { logs = [] } = this.state;

    logs.unshift(log);
    this.setState({
      logs: logs,
    });
  }

  toggle(entity) {
    fetch(`/${entity.entity}/${entity.id}/toggle`, {
      method: "POST",
      body: "true",
    }).then((r) => {
      console.log(r);
    });
  }

  actionToggle(entity) {
    return ( entity.entity === 'fan' || entity.entity === 'switch' ||  entity.entity === 'light') ? 
    'Toggle' : ''
  }

  render({ page }, { logs = [] }) {
    return html`
      <article>
        <h1>${document.title}</h1>
        <h2>States</h2>

        <table class="pure-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>State</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${entities.map(
              (entity) =>
                html`
                  <tr>
                    <td>${entity.name}</td>
                    <td>${entity.state}</td>
                    <td><button class="pure-button pure-button-primary" onClick=${() => this.toggle(entity)}>${this.actionToggle(entity)}</button></td>
                  </tr>
                `
            )}
          </tbody>
        </table>

        <table id="log" class="pure-table" style="font-family: monospace;">
          <thead>
            <tr>
              <th>Time</th>
              <th>level</th>
              <th>who</th>
              <th style="width:50%">detail</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(
              (log) =>
                html`
                  <tr class="${log.sort}">
                    <td>${log.when}</td>
                    <td>${log.level}</td>
                    <td>${log.who}</td>
                    <td>${log.detail}</td>
                  </tr>
                `
            )}
          </tbody>
        </table>

        <h2>OTA Update</h2>
        <form method="POST" action="/update" enctype="multipart/form-data">
          <input type="file" name="update" />
          <input type="submit" value="Update" />
        </form>
      </article>
    `;
  }
}
render(html`<${App} page="All" />`, document.body);
