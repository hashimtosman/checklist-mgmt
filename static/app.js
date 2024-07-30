let categories = [];
let selectedColor = null;
let currentCommentTarget = null;

document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    setupColorPicker();
    document.getElementById('addCategoryBtn').addEventListener('click', addCategory);

    // Add Enter key event listener for category input
    document.getElementById('categoryName').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            addCategory();
        }
    });

    // Modal handling
    const modal = document.getElementById("commentaryModal");
    const span = document.getElementsByClassName("close")[0];
    span.onclick = function() {
        saveComments();
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            saveComments();
            modal.style.display = "none";
        }
    }
});

function setupColorPicker() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
    const colorOptionsContainer = document.querySelector('.color-options');
    colorOptionsContainer.innerHTML = '';

    colors.forEach(color => {
        let colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = color;
        colorOption.addEventListener('click', function() {
            selectedColor = color;
            document.getElementById('colorPreview').style.backgroundColor = color;
            colorOptionsContainer.style.display = 'none';
        });
        colorOptionsContainer.appendChild(colorOption);
    });

    document.getElementById('colorPreview').addEventListener('click', function() {
        colorOptionsContainer.style.display = colorOptionsContainer.style.display === 'none' ? 'block' : 'none';
    });
}

function loadCategories() {
    fetch('/api/categories')
        .then(response => response.json())
        .then(data => {
            categories = data;
            displayCategories();
        });
}

function displayCategories() {
    const categoriesDiv = document.getElementById('categories');
    categoriesDiv.innerHTML = '';
    categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';
        categoryDiv.innerHTML = `
            <div class="category-header" style="background-color: ${category.color};">
                <div class="category-title">
                    <div class="category-letter">${category.name[0].toUpperCase()}</div>
                    <span>${category.name}</span>
                </div>
                <div class="category-actions">
                    <i class="fas fa-comment" onclick="showCommentary(event, 'category', ${category.id})" style="color: ${category.comments ? '#3498db' : '#7f8c8d'}"></i>
                    <i class="fas fa-trash" onclick="removeCategory(${category.id})"></i>
                </div>
            </div>
            <div class="category-content">
                <div class="tasks" id="tasks-${category.id}"></div>
                <div class="add-task">
                    <input type="text" id="taskInput-${category.id}" placeholder="New task">
                    <button onclick="addTask(${category.id})"><i class="fas fa-plus"></i> Add Task</button>
                </div>
            </div>
        `;
        categoriesDiv.appendChild(categoryDiv);
        categoryDiv.querySelector('.category-header').addEventListener('click', () => toggleCategory(categoryDiv));
        loadTasks(category.id);

        // Add Enter key event listener for task input
        const taskInput = categoryDiv.querySelector(`#taskInput-${category.id}`);
        taskInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                addTask(category.id);
            }
        });
    });
}

function showCommentary(event, targetType, targetId) {
    event.stopPropagation();
    const modal = document.getElementById("commentaryModal");
    const commentaryText = document.getElementById("commentaryText");
    const saveButton = document.getElementById("saveCommentsBtn");

    // Set the current comment target
    currentCommentTarget = { type: targetType, id: targetId };

    // Load the existing comments
    let url = '';
    if (targetType === 'category') {
        url = `/api/categories/${targetId}`;
    } else if (targetType === 'task') {
        url = `/api/tasks/${targetId}`;
    }

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            commentaryText.value = data.comments || '';
        })
        .catch(error => {
            console.error('Error fetching comments:', error);
            commentaryText.value = '';
        });

    // Update save button click handler
    if (saveButton) {
        saveButton.onclick = saveComments;
    }

    // Position and show the modal
    const rect = event.target.getBoundingClientRect();
    modal.style.top = `${rect.top + window.scrollY}px`;
    modal.style.left = `${rect.left + window.scrollX}px`;
    modal.style.display = "block";
}

function saveComments() {
    const commentaryText = document.getElementById("commentaryText").value;
    if (currentCommentTarget) {
        const { type, id } = currentCommentTarget;
        let url = '';
        if (type === 'category') {
            url = `/api/categories/${id}/comments`;
        } else if (type === 'task') {
            url = `/api/tasks/${id}/comments`;
        }

        fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comments: commentaryText })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(() => {
            // Update the comment icon color
            const commentIcon = document.querySelector(`[data-${type}-id="${id}"] .fa-comment`);
            if (commentIcon) {
                commentIcon.style.color = commentaryText ? '#3498db' : '#7f8c8d';
            }
            // Close the modal after saving
            document.getElementById("commentaryModal").style.display = "none";
        })
        .catch(error => {
            console.error('Error saving comments:', error);
            alert('Failed to save comments. Please try again.');
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.onclick = function() {
            document.getElementById("commentaryModal").style.display = "none";
        }
    }
});

function toggleCategory(categoryDiv) {
    const content = categoryDiv.querySelector('.category-content');
    content.style.display = content.style.display === 'none' ? 'block' : 'none';
}

function addTask(categoryId) {
    const taskInput = document.getElementById(`taskInput-${categoryId}`);
    const taskContent = taskInput.value.trim();
    if (!taskContent) {
        alert('Please enter a task.');
        return;
    }
    fetch('/api/tasks', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({content: taskContent, category_id: categoryId})
    })
    .then(response => response.json())
    .then(data => {
        const taskList = document.getElementById(`tasks-${categoryId}`);
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task';
        taskDiv.setAttribute('data-task-id', data.id);
        taskDiv.innerHTML = `
            <div class="task-content">
                <input type="checkbox" ${data.done ? 'checked' : ''} onchange="updateTask(${data.id}, this.checked)">
                <span>${data.content}</span>
            </div>
            <div class="task-actions">
                <i class="fas fa-plus" onclick="showAddSubtask(${data.id})"></i>
                <i class="fas fa-comment" onclick="showCommentary(event, 'task', ${data.id})"></i>
                <i class="fas fa-trash" onclick="removeTask(${data.id})"></i>
            </div>
            <div class="subtasks" id="subtasks-${data.id}"></div>
        `;
        taskList.appendChild(taskDiv);
        taskInput.value = '';
    });
}

function removeCategory(categoryId) {
    fetch(`/api/categories/${categoryId}`, { method: 'DELETE' })
    .then(() => {
        categories = categories.filter(c => c.id !== categoryId);
        displayCategories();
    });
}

function loadTasks(categoryId) {
    fetch(`/api/tasks?category_id=${categoryId}`)
        .then(response => response.json())
        .then(tasks => displayTasks(categoryId, tasks));
}


function displayTasks(categoryId, tasks) {
    const taskList = document.getElementById(`tasks-${categoryId}`);
    taskList.innerHTML = '';
    tasks.forEach(task => {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task';
        taskDiv.setAttribute('data-task-id', task.id);
        taskDiv.innerHTML = `
            <div class="task-content">
                <input type="checkbox" ${task.done ? 'checked' : ''} onchange="updateTask(${task.id}, this.checked)">
                <span>${task.content}</span>
            </div>
            <div class="task-actions">
                <i class="fas fa-plus" onclick="showAddSubtask(${task.id})"></i>
                <i class="fas fa-comment" onclick="showCommentary(event, 'task', ${task.id})" style="color: ${task.comments ? '#3498db' : '#7f8c8d'}"></i>
                <i class="fas fa-trash" onclick="removeTask(${task.id})"></i>
            </div>
            <div class="subtasks" id="subtasks-${task.id}"></div>
        `;
        taskList.appendChild(taskDiv);
        displaySubtasks(task.id, task.subtasks);
    });
}

function addTask(categoryId) {
    const taskInput = document.getElementById(`taskInput-${categoryId}`);
    const taskContent = taskInput.value.trim();
    if (!taskContent) {
        alert('Please enter a task.');
        return;
    }
    fetch('/api/tasks', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({content: taskContent, category_id: categoryId})
    })
    .then(response => response.json())
    .then(data => {
        const taskList = document.getElementById(`tasks-${categoryId}`);
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task';
        taskDiv.setAttribute('data-task-id', data.id);
        taskDiv.innerHTML = `
            <div class="task-content">
                <input type="checkbox" ${data.done ? 'checked' : ''} onchange="updateTask(${data.id}, this.checked)">
                <span>${data.content}</span>
            </div>
            <div class="task-actions">
                <i class="fas fa-plus" onclick="showAddSubtask(${data.id})"></i>
                <i class="fas fa-comment" onclick="showCommentary(event, 'task', ${data.id})" style="color: '#7f8c8d'"></i>
                <i class="fas fa-trash" onclick="removeTask(${data.id})"></i>
            </div>
            <div class="subtasks" id="subtasks-${data.id}"></div>
        `;
        taskList.appendChild(taskDiv);
        taskInput.value = '';
    });
}

function showAddSubtask(taskId) {
    const subtasksDiv = document.getElementById(`subtasks-${taskId}`);
    const addSubtaskDiv = document.createElement('div');
    addSubtaskDiv.className = 'add-subtask';
    addSubtaskDiv.innerHTML = `
        <input type="text" placeholder="New subtask">
        <button onclick="addSubtask(${taskId})"><i class="fas fa-plus"></i> Add</button>
    `;
    subtasksDiv.appendChild(addSubtaskDiv);

    // Add Enter key event listener for the subtask input
    const subtaskInput = addSubtaskDiv.querySelector('input');
    subtaskInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            addSubtask(taskId);
        }
    });
}

function removeTask(taskId) {
    fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    .then(() => {
        let taskElement = document.querySelector(`div.task[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.remove();
        }
    })
    .catch(error => console.error('Error removing task:', error));
}

function updateTask(taskId, done) {
    fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({done: done})
    })
    .then(response => response.json())
    .then(data => {
        const taskDiv = document.querySelector(`.task[data-task-id="${taskId}"]`);
        taskDiv.classList.toggle('completed', data.done);

        // Update subtasks as well
        const subtasks = taskDiv.querySelectorAll('.subtask');
        subtasks.forEach(subtask => {
            subtask.classList.toggle('completed', data.done);
        });

        // Apply animation for visual feedback
        taskDiv.style.animation = 'fadeIn 0.5s ease-in-out';
    });
}


function displaySubtasks(taskId, subtasks) {
    const subtasksDiv = document.getElementById(`subtasks-${taskId}`);
    subtasksDiv.innerHTML = '';
    subtasks.forEach(subtask => {
        const subtaskDiv = document.createElement('div');
        subtaskDiv.className = 'subtask';
        subtaskDiv.setAttribute('data-subtask-id', subtask.id);
        subtaskDiv.innerHTML = `
            <div class="task-content">
                <input type="checkbox" ${subtask.done ? 'checked' : ''} onchange="updateSubtask(${subtask.id}, this.checked)">
                <span>${subtask.content}</span>
            </div>
            <div class="task-actions">
                <i class="fas fa-trash" onclick="removeSubtask(${subtask.id})"></i>
            </div>
        `;
        subtasksDiv.appendChild(subtaskDiv);
    });
}

function addSubtask(taskId) {
    const input = document.querySelector(`.task[data-task-id="${taskId}"] .add-subtask input`);
    const addSubtaskDiv = document.querySelector(`.task[data-task-id="${taskId}"] .add-subtask`);
    const content = input.value;
    if (!content) {
        alert('Please enter a subtask.');
        return;
    }
    fetch('/api/subtasks', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({content, task_id: taskId})
    })
    .then(response => response.json())
    .then(data => {
        const subtasksDiv = document.getElementById(`subtasks-${taskId}`);
        const subtaskDiv = document.createElement('div');
        subtaskDiv.className = 'subtask';
        subtaskDiv.setAttribute('data-subtask-id', data.id);
        subtaskDiv.innerHTML = `
            <div class="task-content">
                <input type="checkbox" ${data.done ? 'checked' : ''} onchange="updateSubtask(${data.id}, this.checked)">
                <span>${data.content}</span>
            </div>
            <div class="task-actions">
                <i class="fas fa-trash" onclick="removeSubtask(${data.id})"></i>
            </div>
        `;
        subtasksDiv.appendChild(subtaskDiv);
        subtaskDiv.style.animation = 'fadeIn 0.5s ease-in-out'; // Apply fade-in animation
        input.value = '';
        addSubtaskDiv.remove(); // Remove the add-subtask div
    });
}

function updateSubtask(subtaskId, done) {
    fetch(`/api/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({done: done})
    })
    .then(response => response.json())
    .then(data => {
        const subtaskDiv = document.querySelector(`.subtask[data-subtask-id="${subtaskId}"]`);
        subtaskDiv.classList.toggle('completed', data.done);

        // Apply animation for visual feedback
        subtaskDiv.style.animation = 'fadeIn 0.5s ease-in-out';
    });
}


function removeSubtask(subtaskId) {
    fetch(`/api/subtasks/${subtaskId}`, { method: 'DELETE' })
    .then(() => {
        let subtaskElement = document.querySelector(`div.subtask[data-subtask-id="${subtaskId}"]`);
        if (subtaskElement) {
            subtaskElement.remove();
        }
    })
    .catch(error => console.error('Error removing subtask:', error));
}

function addCategory() {
    const categoryName = document.getElementById('categoryName').value;
    if (!categoryName || !selectedColor) {
        alert('Please enter a category name and select a color.');
        return;
    }
    fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName, color: selectedColor })
    })
    .then(response => response.json())
    .then(data => {
        const categoriesDiv = document.getElementById('categories');
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';
        categoryDiv.setAttribute('data-category-id', data.id);
        categoryDiv.innerHTML = `
            <div class="category-header" style="background-color: ${data.color};">
                <div class="category-title">
                    <div class="category-letter">${data.name[0].toUpperCase()}</div>
                    <span>${data.name}</span>
                </div>
                <div class="category-actions">
                    <i class="fas fa-comment" onclick="showCommentary(event, 'category', ${data.id})"></i>
                    <i class="fas fa-trash" onclick="removeCategory(${data.id})"></i>
                </div>
            </div>
            <div class="category-content">
                <div class="tasks" id="tasks-${data.id}"></div>
                <div class="add-task">
                    <input type="text" id="taskInput-${data.id}" placeholder="New task">
                    <button onclick="addTask(${data.id})"><i class="fas fa-plus"></i> Add Task</button>
                </div>
            </div>
        `;
        categoriesDiv.appendChild(categoryDiv);
        document.getElementById('categoryName').value = '';
        resetColorPicker();

        categoryDiv.querySelector('.category-header').addEventListener('click', () => toggleCategory(categoryDiv));
    });
}

function resetColorPicker() {
    selectedColor = null;
    document.getElementById('colorPreview').style.backgroundColor = 'gray';
}