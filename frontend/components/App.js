import Tasklist from './Tasklist';
import AppModel from '../model/AppModel.js';

export default class App {
  #tasklists = [];
  #productList = null;
  #working_date = '';
  onEscapeKeydown = (event) => {
    if (event.key === 'Escape') {
      const input = document.querySelector('.tasklist-adder__input');
      input.style.display = 'none';
      input.value = '';

      document.querySelector('.tasklist-adder__btn')
        .style.display = 'inherit';
    }
  };


  onInputKeydown = async () => {
    const start = document.getElementById('start');
    const e_input = document.getElementById('eban_input');

    const tasklistID = crypto.randomUUID();

    try{
      const addTasklistResult = await AppModel.addOrder({
        orderID: tasklistID,
        name: e_input.value,
        datetime: new Date(start.value).getTime(),
        position: this.#tasklists.length
      });
      const  newTasklist = new Tasklist({
        tasklistID,
        name: e_input.value,
        position: this.#tasklists.length,
        datetime: start.value,
        onDropTaskInTasklist: this.onDropTaskInTasklist,
        addNotification: this.addNotification

      });

      this.#tasklists.push(newTasklist);
      newTasklist.render();

      
      this.addNotification({ text: addTasklistResult.message, type: 'success'});

    } catch (err) {
      this.addNotification({ text: err.message, type: 'error'});
      console.error(err);

    };

    const input_date = document.querySelector('.tasklist-adder__date');
    input_date.style.display = 'none';
    input_date.value = '';

    const input_text = document.querySelector('.tasklist_text');
    input_text.style.display = 'none';
    input_text.value = '';

    const adder_text = document.querySelector('.tasklist-adder__input');
    adder_text.style.display = 'none';
    adder_text.value = '';

    const button = document.querySelector('.tasklist_ok_button');
    button.style.display = 'none';
    button.value = '';

    document.querySelector('.tasklist-adder__btn')
      .style.display = 'inherit';

  };

  onDropTaskInTasklist = async (evt) => {
    evt.stopPropagation();

    const destTasklistElement = evt.currentTarget;
    destTasklistElement.classList.remove('tasklist_droppable');
    
    const movedTaskID = localStorage.getItem('movedTaskID');
    const srcTasklistID = localStorage.getItem('srcTasklistID');
    const destTasklistID = destTasklistElement.getAttribute('id');
    localStorage.setItem('movedTaskID', '');
    localStorage.setItem('srcTasklistID', '');

    if (!destTasklistElement.querySelector(`[id="${movedTaskID}"]`)) return;

    const srcTasklist = this.#tasklists.find(tasklist => tasklist.tasklistID === srcTasklistID);
    const destTasklist = this.#tasklists.find(tasklist => tasklist.tasklistID === destTasklistID);
    
    try {
      
      if (srcTasklistID !== destTasklistID) {
        await AppModel.movePosition({
          positionID: movedTaskID,
          srcOrderID: srcTasklistID,
          destOrderID: destTasklistID
        });
        const movedTask = srcTasklist.deleteTask({ taskID: movedTaskID });
        destTasklist.pushTask({ task: movedTask });
  
      }
  

      
      this.addNotification({ text: `Task (ID: ${movedTaskID}) move between tasklists`, type: 'success'});
    } catch(err) {
      this.addNotification({ text: err.message, type: 'error'});
      console.error(err);

    }
  };

 

  editTasklistName = async ({ orderID, name, datetime, trueDate }) => {
    console.log("HERE");

    try{
      const updateTaskResult = await AppModel.updateOrder({ orderID, name, datetime});

      const gotta_change = document.getElementById(orderID);
      gotta_change.querySelector('.tasklist__name').innerHTML = `Заказчик: ${name}`;
      gotta_change.querySelector('.tasklist__date').innerHTML = `Дата заказа: ${trueDate}`;
      
      console.log(gotta_change);
      console.log(updateTaskResult);
      this.addNotification({ text: updateTaskResult.message, type: 'success'});
    } catch (err) {
      this.addNotification({ text: err.message, type: 'error'});
      console.error(err);

    }

    
  };

  deleteTask = async ({ taskID }) => {
    let fTask = null;
    let fTasklist = null;
    for (let tasklist of this.#tasklists) {
      fTasklist = tasklist;
      fTask = tasklist.getTaskById({ taskID });
      if (fTask) break;
    }


    try{
      console.log("ok", taskID);
      const deleteTaskResult = await AppModel.deletePosition({ positionID:taskID });

      fTasklist.deleteTask({ taskID });
      document.getElementById(taskID).remove();

      this.addNotification({ text: deleteTaskResult.message, type: 'success'});
    } catch (err) {
      this.addNotification({ text: err.message, type: 'error'});
      console.error(err);
    }

    
  };

  deleteTasklist = async ({ tasklistID }) => {
    try{
      console.log("ok", tasklistID);
      const deleteTasklistResult = await AppModel.deleteOrder({ orderID: tasklistID });

      document.getElementById(tasklistID).remove();

      this.addNotification({ text: deleteTasklistResult.message, type: 'success'});
    } catch (err) {
      this.addNotification({ text: err.message, type: 'error'});
      console.error(err);
    }
  };

  initAddTaskModal() {
    console.log(this.#productList);
    const addTaskModal = document.getElementById('modal-add-task');
    const someInput = document.getElementById('modal-add-task-input');
    this.#productList.forEach(element => {
      var option = document.createElement('option');
      option.setAttribute('value', element.id)
      option.innerHTML=element.name;
      someInput.appendChild(option);
    });
    document.getElementById('modal-add-task-input-amount').value = "5"
    const cancelHandler = () => {
      addTaskModal.close();
      localStorage.setItem('addTaskTasklistID', '');
      // addTaskModal.querySelector('.app-modal__input').value = '';
    };

    const okHandler = async () => {
      const tasklistID = localStorage.getItem('addTaskTasklistID');
      const modalInput = document.getElementById('modal-add-task-input');
      var text = modalInput.options[modalInput.selectedIndex].text;
      // const count = document.getElementById('modal-add-task-input-amount');
      const count = document.querySelector('.app-modal__input');
      this.#productList = await AppModel.getProducts();
      const desiredElement = this.#productList.find(item => item.id === modalInput.value);
      var local_count = parseInt(count.value);
      if(desiredElement.count >= local_count){
        if(tasklistID && modalInput.value && local_count){
          this.#tasklists.find(tasklist => tasklist.tasklistID === tasklistID).appendNewTask({ 
            prodID : modalInput.value , 
            listID: tasklistID, 
            prodCount: local_count,
            prodName: text});
        }
      }else{
        this.addNotification({ text: `Not enough product for ${desiredElement.name}, only ${desiredElement.count} available`, type: 'error'});
        console.log(`Not enough product for ${desiredElement.name}, only ${desiredElement.count} available`);
      }

      cancelHandler();
    };

    addTaskModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
    addTaskModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
    addTaskModal.addEventListener('close', cancelHandler);
  }

  initEditTaskModal() {
    const editTasklistNameModal = document.getElementById('modal-edit-task');
    const dataInput = document.getElementById('start_modal');
    dataInput.style.display = 'inherit';
    const cancelHandler = () => {
      editTasklistNameModal.close();
      localStorage.setItem('editTasklistNameID', '');
      editTasklistNameModal.querySelector('.app-modal__input').value = '';
    };

    const okHandler = () => {
      const taskID = localStorage.getItem('editTasklistNameID');
      const modalInput = editTasklistNameModal.querySelector('.app-modal__input');
      const dataInput = document.getElementById('start_modal');
      console.log(taskID, modalInput.value, dataInput.value);
      if(taskID && modalInput.value){
        this.editTasklistName({orderID:taskID, name:modalInput.value , datetime:  new Date(dataInput.value).getTime() + 10800000, trueDate: dataInput.value});
      }

      cancelHandler();
    };

    editTasklistNameModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
    editTasklistNameModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
    editTasklistNameModal.addEventListener('close', cancelHandler);
  }

  initDeleteTaskModal() {
    const deleteTaskModal = document.getElementById('modal-delete-task');
    const cancelHandler = () => {
      deleteTaskModal.close();
      localStorage.setItem('deleteTaskID', '');
    };

    const okHandler = () => {
      const taskID = localStorage.getItem('deleteTaskID');

      if(taskID){
        this.deleteTask({taskID});

      }

      cancelHandler();
    };

    deleteTaskModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
    deleteTaskModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
    deleteTaskModal.addEventListener('close', cancelHandler);
  }

// Удаление заказа
  initDeleteTasklistModal() {
    const deleteTasklistModal = document.getElementById('modal-delete-tasklist');
    const cancelHandler = () => {
      deleteTasklistModal.close();
      localStorage.setItem('deleteTasklistID', '');
    };

    const okHandler = () => {
      const tasklistID = localStorage.getItem('deleteTasklistID');

      if(tasklistID){
        this.deleteTasklist({tasklistID});
      }

      cancelHandler();
    };

    deleteTasklistModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
    deleteTasklistModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
    deleteTasklistModal.addEventListener('close', cancelHandler);
  }


  initNotifications() {
    const notifications = document.getElementById('app-notifications');
    notifications.show();
  }


  addNotification = ({text, type}) => {
    const notifications = document.getElementById('app-notifications');

    const notificationID = crypto.randomUUID();
    const notification = document.createElement('div');
    notification.classList.add(
      'notification',
      type === 'success' ? 'notification-success': 'notification-error'
    );

    notification.setAttribute('id', notificationID);
    notification.innerHTML = text;

    notifications.appendChild(notification);

    setTimeout(() => {document.getElementById(notificationID).remove();}, 5000)
  };

  async init() {
    document.querySelector('.tasklist-adder__btn')
      .addEventListener(
        'click',
        (event) => {
          event.target.style.display = 'none';

          const input = document.querySelector('.tasklist-adder__input');
          input.style.display = 'inherit';
          input.focus();

          const input_text = document.querySelector('.tasklist_text');
          input_text.style.display = 'inherit';
          input_text.focus();

          const input_date = document.querySelector('.tasklist-adder__date');
          input_date.style.display = 'inherit';
          input_date.focus();

          const button = document.querySelector('.tasklist_ok_button ');
          button.style.display = 'inherit';
          button.focus();
          console.log("input:", input);
        }
      );

    document.addEventListener('keydown', this.onEscapeKeydown);

    document.getElementById('theme-switch')
      .addEventListener('change', (evt) => {
        (evt.target.checked
          ? document.body.classList.add('dark-theme')
          : document.body.classList.remove('dark-theme'));
      });



    this.initDeleteTaskModal();
    this.initNotifications();
    
    const dataElement = document.getElementById("next-date-button");
    let currentDate = new Date();
    this.#working_date = currentDate.toISOString().slice(0,10); 
    dataElement.innerHTML = `${this.#working_date}`;

    console.log(dataElement);
    
    document.querySelector('.arrow-button').addEventListener('click', async (event) => {
      let newcurrentDate = new Date(this.#working_date);
      newcurrentDate.setDate(newcurrentDate.getDate() + 1);
      this.#working_date = newcurrentDate.toISOString().slice(0,10);
      dataElement.innerHTML = `${this.#working_date}`;
      const kill_date = new Date(this.#working_date).getTime();
      console.log(kill_date);
      await AppModel.deleteOrderByDate({datetime: kill_date});
      await AppModel.updateProducts();
      try{
        console.log(document.querySelector('.tasklists-list'));
        //document.querySelector('.tasklists-list').innerHTML = '';
        const pool = await AppModel.getOrders();
        const tasklists = pool.orders;
        // this.initEditTaskModal(); 
          console.log(tasklists);
          for(const tasklist of this.#tasklists){
            const desiredElement = tasklists.find(item => item.orderID === tasklist.tasklistID);
            if (!desiredElement) {
              document.getElementById(tasklist.tasklistID).remove();
            }
          }
        } catch( err) {
          this.addNotification({ text: err.message, type: 'error'});
          console.error(err);
        }

    });

    const TaskOkButton = document.querySelector('.tasklist_ok_button');
    TaskOkButton.addEventListener('click', this.onInputKeydown);

    document.addEventListener('dragover', (evt) => {
      evt.preventDefault();

      const draggedElement = document.querySelector('.task.task_selected');
      const draggedElementPrevList = draggedElement.closest('.tasklist');

      const currentElement = evt.target;
      const prevDroppable = document.querySelector('.tasklist_droppable');
      let curDroppable = evt.target;
      while (!curDroppable.matches('.tasklist') && curDroppable !== document.body) {
        curDroppable = curDroppable.parentElement;
      }

      if (curDroppable !== prevDroppable) {
        if (prevDroppable) prevDroppable.classList.remove('tasklist_droppable');

        if (curDroppable.matches('.tasklist')) {
          curDroppable.classList.add('tasklist_droppable');
        }
      }

      if (!curDroppable.matches('.tasklist') || draggedElement === currentElement) return;

      if (curDroppable === draggedElementPrevList) {
        if (!currentElement.matches('.task')) return;

        const nextElement = (currentElement === draggedElement.nextElementSibling)
          ? currentElement.nextElementSibling
          : currentElement;

        curDroppable.querySelector('.tasklist__tasks-list')
          .insertBefore(draggedElement, nextElement);

        return;
      }

      if (currentElement.matches('.task')) {
        curDroppable.querySelector('.tasklist__tasks-list')
          .insertBefore(draggedElement, currentElement);

        return;
      }

      if (!curDroppable.querySelector('.tasklist__tasks-list').children.length) {
        curDroppable.querySelector('.tasklist__tasks-list')
          .appendChild(draggedElement);
      }
    });
    
    try{
    console.log("selector:", document.querySelector('.tasklists-list'));
    const tasklists = await AppModel.getOrders();
       
    this.#productList = tasklists.products;
    this.initAddTaskModal();
    this.initEditTaskModal();
    this.initDeleteTasklistModal();
     
      for(const tasklist of tasklists.orders){
        console.log((tasklist.datetime));

        const tasklistObj = new Tasklist({
          tasklistID: tasklist.orderID,
          name: tasklist.name,
          position: tasklist.positions,
          onDropTaskInTasklist: this.onDropTaskInTasklist,
          addNotification: this.addNotification,
          availableProducts: tasklists.products,
          datetime: new Date(tasklist.datetime).toISOString().substring(0, 10),
          // onEditTask: this.onEditTask,
        });

        this.#tasklists.push(tasklistObj);
        tasklistObj.render();
        
        for( const task of tasklist.positions){
          tasklistObj.addNewTaskLocal({
            tasklistID: tasklist.orderID,
            prodName: task.name,
            positionID: task.positionID,
            prodCount: task.count,
          });
        
         }
      }

    } catch( err) {
      this.addNotification({ text: err.message, type: 'error'});
      console.error(err);
    }
  }
};
