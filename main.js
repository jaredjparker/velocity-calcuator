class VelocityTable extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.addEventListeners();
    }

    lastRowIndex = 0;

    funnyProjectNames = ["Ctrl+Alt+Defeat", "404: Project Not Found", "The Last Minute", "Operation Don't Panic", "Feature Creep", "Mission: Improbable", "Bug Life", "Pixelated Dreams", "Fork This"];

    inputRow = (rowIndex) => {
        return `
        <tr>
            <td><input class="form-control" type="text" name="ticket"></td>
            <td><input class="form-control" type="text" name="title"></td>
            <td>
                <select id="effort-${rowIndex}" class="form-control" name="effort">
                    <option value=""></option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="difficult">Difficult</option>
                    <option value="not-sure">Not Sure</option>
                </select>
            </td>
            <td><input id="storyPoints-${rowIndex}" min="0" class="form-control" type="number" name="storyPoints"></td>
            <td><input id="timeSpent-${rowIndex}" min="0" class="form-control" type="number" name="timeSpent"></td>
        </tr>`
    };

    render() {
        this.shadowRoot.innerHTML = `
        <link rel="stylesheet" href="styles.css">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <div class="header">
            <h1>Velocity Calculator</h1>
            <button id="hamburgerMenu" class="btn btn-outline-secondary">☰</button>
        </div>
        <div class="row-box project-name-container">
            <h3>Project Name:</h3>
            <input class="form-control" type="text" name="projectName" value="${this.funnyProjectNames[Math.floor(Math.random() * this.funnyProjectNames.length)]}"></input>
        </div>
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Title</th>
              <th>Effort</th>
              <th>Story Points</th>
              <th>Time Spent</th>
            </tr>
          </thead>
          <tbody>
            ${this.inputRow(this.lastRowIndex)}
          </tbody>
          <tfoot>
            <tr>
              <td></td>
              <td></td>
              <td>Total</td>
              <td id="totalStoryPoints">0</td>
              <td id="totalTimeSpent">0</td>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td>Velocity</td>
              <td colspan="2" id="velocity">0</td>
            </tr>
          </tfoot>
        </table>
        <div class="row-box button-container">
            <button id="addRow" type="button" class="btn btn-primary">Add Row</button>
            <button id="saveToLocalStorage" type="button" class="btn btn-primary">Save to Local Storage</button>
        </div>
      `;
    }

    showProjectList() {
        const projectListDialog = document.createElement('dialog');
        const unorderedList = document.createElement('ul');
        unorderedList.id = 'savedProjectsList';
        unorderedList.innerHTML = '';
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const li = document.createElement('li');
            li.textContent = key;
            li.dataset.project = key;
            unorderedList.appendChild(li);
        }
        projectListDialog.innerHTML = `
            <div id="projectList" class="project-list">
                <h3>Saved Projects</h3>
                ${unorderedList.outerHTML}
                <button id="closeDialog" class="btn btn-primary">Close</button>
            </div>
        `;
        
        this.shadowRoot.appendChild(projectListDialog);
        projectListDialog.showModal();

        const savedProjectsList = projectListDialog.querySelector('#savedProjectsList');
        savedProjectsList.addEventListener('click', (event) => {
            if (event.target.tagName === 'LI') {
                const projectName = event.target.getAttribute('data-project');
                this.loadProject(projectName);
            }
        });

        const closeButton = projectListDialog.querySelector('#closeDialog');
        closeButton.addEventListener('click', () => {
            projectListDialog.close();
            this.shadowRoot.removeChild(projectListDialog);
        });
    }

    showOverwriteDialog(projectName, data) {
        const dialog = document.createElement('dialog');
        dialog.innerHTML = `
            <h3>Project Already Exists</h3>
            <p>A project named "${projectName}" already exists. Do you want to overwrite it?</p>
            <button id="confirmOverwrite" class="btn btn-primary">OK</button>
            <button id="cancelOverwrite" class="btn btn-secondary">Cancel</button>
        `;
        
        this.shadowRoot.appendChild(dialog);
        dialog.showModal();
    
        dialog.querySelector('#confirmOverwrite').addEventListener('click', () => {
            localStorage.setItem(projectName, JSON.stringify(data));
            dialog.close();
            this.shadowRoot.removeChild(dialog);
        });
    
        dialog.querySelector('#cancelOverwrite').addEventListener('click', () => {
            dialog.close();
            this.shadowRoot.removeChild(dialog);
        });
    }

    saveToLocalStorage() {
        const projectName = this.shadowRoot.querySelector('input[name="projectName"]').value;
        const rows = this.shadowRoot.querySelectorAll('tbody tr');
        
        const tickets = Array.from(rows).map(row => ({
            ticketNumber: row.querySelector('input[name="ticket"]').value,
            title: row.querySelector('input[name="title"]').value,
            effort: row.querySelector('select[name="effort"]').value,
            storyPoints: parseInt(row.querySelector('input[name="storyPoints"]').value) || 0,
            timeSpent: parseFloat(row.querySelector('input[name="timeSpent"]').value) || 0
        }));
    
        const data = {
            readonly: false,
            projectName: projectName,
            tickets: tickets
        };
        if (!localStorage.getItem(projectName)) {
            localStorage.setItem(projectName, JSON.stringify(data));
        } else {
            this.showOverwriteDialog(projectName, data);
        }
    }

    loadProject(projectName) {
        const projectData = JSON.parse(localStorage.getItem(projectName));
        this.shadowRoot.querySelector('input[name="projectName"]').value = projectData.projectName;
        const projectListDialog = this.shadowRoot.querySelector('dialog');
        
        const tbody = this.shadowRoot.querySelector('tbody');
        tbody.innerHTML = '';
        
        projectData.tickets.forEach((ticket, index) => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = this.inputRow(index);
            newRow.querySelector('input[name="ticket"]').value = ticket.ticketNumber;
            newRow.querySelector('input[name="title"]').value = ticket.title;
            newRow.querySelector('select[name="effort"]').value = ticket.effort;
            newRow.querySelector('input[name="storyPoints"]').value = ticket.storyPoints;
            newRow.querySelector('input[name="timeSpent"]').value = ticket.timeSpent;
            tbody.appendChild(newRow);
        });
        
        this.lastRowIndex = projectData.tickets.length - 1;
        this.calculateTotals();
        projectListDialog.close();
        this.shadowRoot.removeChild(projectListDialog);
    }

    effortSelectChanged(event) {
        const rowIndex = event.target.id.split('-')[1];
        const storyPointsInput = this.shadowRoot.getElementById(`storyPoints-${rowIndex}`);
        switch (event.target.value) {
            case '':
                storyPointsInput.value = null;
                break;
            case 'easy':
                storyPointsInput.value = 1;
                break;
            case 'medium':
                storyPointsInput.value = 2;
                break;
            case 'difficult':
                storyPointsInput.value = 5;
                break;
            case 'not-sure':
                storyPointsInput.value = 13;
                break;
        }
    }

    storyPointsInputChanged(event) {
        const rowIndex = event.target.id.split('-')[1];
        const effortSelect = this.shadowRoot.getElementById(`effort-${rowIndex}`);
        effortSelect.value = '';
    }

    addEventListeners() {
        const addRowButton = this.shadowRoot.getElementById('addRow');
        const saveButton = this.shadowRoot.getElementById('saveToLocalStorage');
        const hamburgerMenu = this.shadowRoot.getElementById('hamburgerMenu');
        const effortSelect = this.shadowRoot.querySelector('select[name="effort"]');
        const storyPointsInput = this.shadowRoot.querySelector('input[name="storyPoints"]');
        const timeSpentInput = this.shadowRoot.querySelector('input[name="timeSpent"]');

        addRowButton.addEventListener('click', () => this.addRow());
        saveButton.addEventListener('click', () => this.saveToLocalStorage()); 
        hamburgerMenu.addEventListener('click', () => this.showProjectList());
        effortSelect.addEventListener('change', (event) => {
            this.effortSelectChanged(event);
        });
        storyPointsInput.addEventListener('input', (event) => {
            this.storyPointsInputChanged(event);
            this.calculateTotals();
        });
        timeSpentInput.addEventListener('input', () => {
            this.calculateTotals();
        });
    }

    addRow() {
        const tbody = this.shadowRoot.querySelector('tbody');
        this.lastRowIndex++;
        const newInputRow = document.createElement('tr');
        newInputRow.innerHTML = this.inputRow(this.lastRowIndex);
        newInputRow.querySelector('select[name="effort"]').addEventListener('change', (event) => {
            this.effortSelectChanged(event);
        });
        newInputRow.querySelector('input[name="storyPoints"]').addEventListener('input', (event) => {
            this.storyPointsInputChanged(event);
            this.calculateTotals();
        });
        newInputRow.querySelector('input[name="timeSpent"]').addEventListener('input', () => {
            this.calculateTotals();
        });
        tbody.appendChild(newInputRow);
    }

    calculateTotals() {
        const inputRows = this.shadowRoot.querySelectorAll('tbody tr');
        let totalStoryPoints = 0;
        let totalTimeSpent = 0;

        inputRows.forEach(row => {
            const storyPoints = parseFloat(row.querySelector('input[name="storyPoints"]').value) || 0;
            const timeSpent = parseFloat(row.querySelector('input[name="timeSpent"]').value) || 0;
            totalStoryPoints = totalStoryPoints + storyPoints;
            totalTimeSpent = totalTimeSpent + timeSpent;
        });

        const totalStoryPointsElement = this.shadowRoot.getElementById('totalStoryPoints');
        const totalTimeSpentElement = this.shadowRoot.getElementById('totalTimeSpent');
        const velocityElement = this.shadowRoot.getElementById('velocity');

        totalStoryPointsElement.textContent = totalStoryPoints.toFixed(2);
        totalTimeSpentElement.textContent = totalTimeSpent.toFixed(2);

        const velocity = totalTimeSpent > 0 ? totalStoryPoints / totalTimeSpent : 0;
        velocityElement.textContent = velocity.toFixed(2);
    }
}

customElements.define('velocity-table', VelocityTable);