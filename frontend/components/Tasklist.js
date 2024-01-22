import Task from './Task';
import AppModel from '../model/AppModel';
export default class Tasklist {
  #tasks = [];
  #tasklistName = '';
  #tasklistID = null;
  #tasklistPosition = -1;
  #datetime
  constructor({
    tasklistID = null,
    name,
    position,
    onDropTaskInTasklist,
    addNotification,
    datetime,
  }) {
    this.#tasklistName = name;
    this.#tasklistID = tasklistID || crypto.randomUUID();
    this.#tasklistPosition = position;
    this.onDropTaskInTasklist = onDropTaskInTasklist;
    this.addNotification = addNotification;
    this.#datetime = datetime;
  }

  get tasklistID() { return this.#tasklistID; }

  get tasklistPosition() { return this.#tasklistPosition; }

  pushTask = ({ task }) => this.#tasks.push(task);

  getTaskById = ({ taskID }) => this.#tasks.find(task => task.taskID === taskID);
  // getTasklistById = ({ tasklistID }) => this.#tasklistID.find(tasklist => tasklist.tasklistID === tasklistID);

  deleteTask = ({ taskID }) => {
    const deleteTaskIndex = this.#tasks.findIndex(task => task.taskID === taskID);

    if (deleteTaskIndex === -1) return;

    const [deletedTask] = this.#tasks.splice(deleteTaskIndex, 1);

    return deletedTask;
  };

  reorderTasks = async () => {
    console.log("i am not supposed to be here");
    console.log(document.querySelector(`[id="${this.#tasklistID}"] .tasklist__tasks-list`));
    const orderedTasksIDs = Array.from(
      document.querySelector(`[id="${this.#tasklistID}"] .tasklist__tasks-list`).children,
      elem => elem.getAttribute('id')
    );


    const reorderedTasksInfo = [];

    orderedTasksIDs.forEach((taskID, position) => {
      const task = this.#tasks.find(task => task.taskID === taskID);
      if(task.taskPosition !== position){
        task.taskPosition = position;
        reorderedTasksInfo.push({
          taskID,
          position
        });
      }
    });

    if(reorderedTasksInfo.length > 0){
      try{
        await AppModel.updateOrder({
          reorderedTasks: reorderedTasksInfo
        });
      } catch(err){
        this.addNotification({ text: err.message, type: 'error'});
        console.error(err);
      }

    }

    console.log(this.#tasks);
  };

  appendNewTask = async ({ prodID, prodCount, listID, prodName }) => {
    try {
      const positionID = crypto.randomUUID();
      console.log("count", this.#tasks)
      var isnot_new = this.#tasks.find(item => item.id === prodID);
      console.log("is", isnot_new);
      if (isnot_new){
        console.log("NOT NEW");
      }
      else{
        console.log("New");
      }
      const addTaskResult = await AppModel.addPosition({
        positionID,
        count: prodCount,
        orderID: listID,
        productID: prodID
      });

      this.addNewTaskLocal({
        orderID: this.#tasklistID, 
        positionID,
        prodName, 
        prodCount,
      });

      this.addNotification({ text: addTaskResult.message, type: 'success'});
    } catch (err) {
      this.addNotification({ text: err.message, type: 'error'});
      console.error(err);
    }

    
  };


  addNewTaskLocal = ({orderID, positionID = null, prodName, prodCount}) => {
    const newTask = new Task({
      orderID,
      positionID,
      prodName,
      prodCount,
    });
    this.#tasks.push(newTask);
    const newTaskElement = newTask.render();
    document.querySelector(`[id="${this.#tasklistID}"] .tasklist__tasks-list`)
      .appendChild(newTaskElement);
  };

  render() {
    const liElement = document.createElement('li');
    liElement.classList.add(
      'tasklists-list__item',
      'tasklist'
    );
    liElement.setAttribute('id', this.#tasklistID);
    liElement.addEventListener(
      'dragstart',
      () => localStorage.setItem('srcTasklistID', this.#tasklistID)
    );
    liElement.addEventListener('drop', this.onDropTaskInTasklist);

    
    const h2Element = document.createElement('h2');
    h2Element.classList.add('tasklist__name');
    h2Element.innerHTML = `Заказчик: ${this.#tasklistName}`;
    liElement.appendChild(h2Element);

    const editBtn = document.createElement('button');
    editBtn.setAttribute('type', 'button');
    editBtn.classList.add('task__contol-btn', 'edit-icon');
    editBtn.addEventListener('click', () => {
      localStorage.setItem('editTasklistNameID', this.#tasklistID);
      document.getElementById('modal-edit-task').showModal();
    });
    h2Element.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.setAttribute('type', 'button');
    deleteBtn.classList.add('task__contol-btn', 'delete-icon');
    deleteBtn.addEventListener('click', () => {
      localStorage.setItem('deleteTasklistID', this.#tasklistID);

      const deleteTasklistModal = document.getElementById('modal-delete-tasklist');
      deleteTasklistModal.querySelector('.app-modal__question').innerHTML = `Заказ '${this.#tasklistName}' будет удален. Прододлжить?`;

      deleteTasklistModal.showModal();
    });
    h2Element.appendChild(deleteBtn);

    const innerUlElement = document.createElement('ul');
    innerUlElement.classList.add('tasklist__tasks-list');
    liElement.appendChild(innerUlElement);

    const dateh2Element = document.createElement('h2');
    dateh2Element.classList.add('tasklist__date');
    dateh2Element.innerHTML = `Дата заказа: ${this.#datetime}`;
    liElement.appendChild(dateh2Element);

    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.classList.add('tasklist__add-task-btn');
    button.innerHTML = '&#10010; Добавить позицию';
    button.addEventListener('click', () => {
      localStorage.setItem('addTaskTasklistID', this.#tasklistID);
      document.getElementById('modal-add-task').showModal();
    });
    liElement.appendChild(button);

    const adderElement = document.querySelector('.tasklist-adder');
    adderElement.parentElement.insertBefore(liElement, adderElement);
  }
};
