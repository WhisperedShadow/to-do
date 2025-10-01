window.onload = () => {
    showWorks();
    populateOrderWindow();
    populateTaskSelector();
};

// Toggle Add Work Form
document.getElementById('toggle-add-work').onclick = () => {
    document.getElementById('add-work-form').classList.toggle('active');
};

// Toggle Ordering Window
document.getElementById('toggle-ordering').onclick = () => {
    const win = document.getElementById('ordering-window');
    win.style.display = win.style.display === 'flex' ? 'none' : 'flex';
    populateOrderWindow();
};

// Show Works
function showWorks() {
    const works = JSON.parse(localStorage.getItem('works')) || [];
    const container = document.getElementById('works');
    container.innerHTML = '';
    works.forEach(work => createWork(work));
}

// Create Work
function createWork(work) {
    const tasks = JSON.parse(localStorage.getItem(work)) || [];
    const taskBar = document.createElement('div');
    taskBar.className = 'taskBar';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';

    const h3 = document.createElement('h3');
    h3.textContent = work;

    const delBtn = document.createElement('button');
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.onclick = () => deleteWork(work);

    header.appendChild(h3);
    header.appendChild(delBtn);
    taskBar.appendChild(header);

    const addTask = document.createElement('div');
    addTask.className = 'addTask';
    addTask.innerHTML = `<input type="text" placeholder="Add task">
                         <button><i class="fa-solid fa-plus"></i></button>`;
    const input = addTask.querySelector('input');
    const btn = addTask.querySelector('button');
    btn.onclick = () => {
        if (input.value) {
            tasks.push({ text: input.value, completed: false });
            localStorage.setItem(work, JSON.stringify(tasks));
            showWorks();
        }
    };
    taskBar.appendChild(addTask);

    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks';
    const ol = document.createElement('ol');
    tasks.forEach(task => showTask(task, ol, work));
    tasksContainer.appendChild(ol);
    taskBar.appendChild(tasksContainer);

    document.getElementById('works').appendChild(taskBar);
}

// Show Task
function showTask(task, ol, work) {
    const li = document.createElement('li');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.onclick = (e) => finishTask(e, li, task, work);
    li.appendChild(checkbox);

    const span = document.createElement('span');
    span.textContent = task.text;
    span.style.textDecoration = task.completed ? 'line-through' : 'none';
    li.appendChild(span);

    const upbtn = document.createElement('button');
    upbtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
    upbtn.onclick = () => showUpdate(task, work);
    li.appendChild(upbtn);

    const delbtn = document.createElement('button');
    delbtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delbtn.onclick = () => deleteTask(task, work);
    li.appendChild(delbtn);

    ol.appendChild(li);
}

function finishTask(event, li, task, work) {
    const tasks = JSON.parse(localStorage.getItem(work));
    const index = tasks.findIndex(t => t.text === task.text);
    tasks[index].completed = event.target.checked;
    localStorage.setItem(work, JSON.stringify(tasks));
    li.children[1].style.textDecoration = event.target.checked ? 'line-through' : 'none';
}

function addWork(event) {
    event.preventDefault();
    const input = document.getElementById('work-input');
    if (!input.value) return;
    const works = JSON.parse(localStorage.getItem('works')) || [];
    works.push(input.value);
    localStorage.setItem('works', JSON.stringify(works));
    input.value = '';
    showWorks();
    populateOrderWindow();
    populateTaskSelector();
}

function deleteWork(work) {
    let works = JSON.parse(localStorage.getItem('works')) || [];
    works = works.filter(w => w !== work);
    localStorage.setItem('works', JSON.stringify(works));
    localStorage.removeItem(work);
    showWorks();
    populateOrderWindow();
    populateTaskSelector();
}

function deleteTask(task, work) {
    let tasks = JSON.parse(localStorage.getItem(work)) || [];
    tasks = tasks.filter(t => t.text !== task.text);
    localStorage.setItem(work, JSON.stringify(tasks));
    showWorks();
}

function showUpdate(task, work) {
    document.getElementById('overlay-container').style.display = 'flex';
    document.getElementById('update-input').value = task.text;
    document.getElementById('overlay-button').onclick = () => updateTask(task, work);
}

function updateTask(task, work) {
    let tasks = JSON.parse(localStorage.getItem(work)) || [];
    const index = tasks.findIndex(t => t.text === task.text);
    tasks[index].text = document.getElementById('update-input').value;
    localStorage.setItem(work, JSON.stringify(tasks));
    closeOverlay();
    showWorks();
}

/* ---------------- Overlay ---------------- */
function closeOverlay() {
    document.getElementById('overlay-container').style.display = 'none';
}

/* ---------------- Drag & Drop Ordering ---------------- */
function populateOrderWindow() {
    const orderList = document.getElementById('order-list');
    orderList.innerHTML = '';
    const works = JSON.parse(localStorage.getItem('works')) || [];
    works.forEach(work => {
        const li = document.createElement('li');
        li.draggable = true;
        li.innerHTML = `<span class="drag-handle"><i class="fa-solid fa-grip-lines"></i></span>${work}`;
        orderList.appendChild(li);

        li.ondragstart = e => { e.dataTransfer.setData('text/plain', work); li.classList.add('dragging'); };
        li.ondragend = () => li.classList.remove('dragging');
    });

    orderList.ondragover = e => {
        e.preventDefault();
        const dragging = document.querySelector('.dragging');
        const afterElement = getDragAfterElement(orderList, e.clientY);
        if (!afterElement) orderList.appendChild(dragging);
        else orderList.insertBefore(dragging, afterElement);
    };
}

function getDragAfterElement(container, y) {
    const elements = [...container.querySelectorAll('li:not(.dragging)')];
    return elements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height/2;
        if (offset < 0 && offset > closest.offset) return { offset, element: child };
        return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveOrder() {
    // Save works order
    const newOrder = [...document.querySelectorAll('#order-list li')].map(li => li.textContent.trim());
    localStorage.setItem('works', JSON.stringify(newOrder));

    // Save task order if selected
    const selectedWork = document.getElementById('select-work-for-tasks').value;
    if (selectedWork) {
        const taskOrder = [...document.querySelectorAll('#order-task-list li')].map(li => li.textContent.trim());
        const tasks = JSON.parse(localStorage.getItem(selectedWork));
        const newTasks = taskOrder.map(text => tasks.find(t => t.text === text));
        localStorage.setItem(selectedWork, JSON.stringify(newTasks));
    }

    showWorks();
}

/* ---------------- Task Ordering ---------------- */
function populateTaskSelector() {
    const select = document.getElementById('select-work-for-tasks');
    select.innerHTML = '<option value="">Select Work</option>';
    const works = JSON.parse(localStorage.getItem('works')) || [];
    works.forEach(work => {
        const option = document.createElement('option');
        option.value = work;
        option.textContent = work;
        select.appendChild(option);
    });
    document.getElementById('order-task-list').innerHTML = '';
}

document.getElementById('select-work-for-tasks').onchange = function() {
    const work = this.value;
    const list = document.getElementById('order-task-list');
    list.innerHTML = '';
    if (!work) return;
    const tasks = JSON.parse(localStorage.getItem(work)) || [];
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.draggable = true;
        li.innerHTML = `<span class="drag-handle"><i class="fa-solid fa-grip-lines"></i></span>${task.text}`;
        list.appendChild(li);

        li.ondragstart = e => { e.dataTransfer.setData('text/plain', task.text); li.classList.add('dragging'); };
        li.ondragend = () => li.classList.remove('dragging');
    });

    list.ondragover = e => {
        e.preventDefault();
        const dragging = document.querySelector('#order-task-list .dragging');
        const afterElement = getDragAfterElement(list, e.clientY);
        if (!afterElement) list.appendChild(dragging);
        else list.insertBefore(dragging, afterElement);
    };
};
