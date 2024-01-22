export default class Task {
  #positionID = '';
  #prodName = '';
  #prodCount = 1;
  #orderID = '';

  constructor({
    positionID = null,
    prodName,
    prodCount,
    orderID,
  }) {
    this.#positionID = positionID || crypto.randomUUID();
    this.#prodName = prodName;
    this.#prodCount = prodCount;
    this.#orderID = orderID;
  }

  get positionID() { return this.#positionID; }
  get prodName() { return this.#prodName; }
  get prodCount() { return this.#prodCount; }
  get orderID() { return this.#orderID; }

  set prodName(value) {
    if (typeof value === 'string') {
      this.#prodName = value;
    }
  }


  render() {
    const liElement = document.createElement('li');
    liElement.classList.add('tasklist__tasks-list-item', 'task');
    liElement.setAttribute('id', this.#positionID);
    liElement.setAttribute('draggable', true);
    liElement.addEventListener('dragstart', (evt) => {
      evt.target.classList.add('task_selected');
      localStorage.setItem('movedTaskID', this.#positionID);
    });
    liElement.addEventListener('dragend', (evt) => evt.target.classList.remove('task_selected'));

    const span = document.createElement('span');
    span.classList.add('task__text');
    span.setAttribute('id', this.#positionID)
    span.innerHTML = this.#prodName;
    liElement.appendChild(span);

    const span_count = document.createElement('span');
    span_count.classList.add('task__count');
    span_count.innerHTML = this.#prodCount;
    liElement.appendChild(span_count);

    const controlsDiv = document.createElement('div');
    controlsDiv.classList.add('task__controls');

    const lowerRowDiv = document.createElement('div');
    lowerRowDiv.classList.add('task__controls-row');


    const deleteBtn = document.createElement('button');
    deleteBtn.setAttribute('type', 'button');
    deleteBtn.classList.add('task__contol-btn', 'delete-icon');
    deleteBtn.addEventListener('click', () => {
      localStorage.setItem('deleteTaskID', this.#positionID);

      const deleteTaskModal = document.getElementById('modal-delete-task');
      deleteTaskModal.querySelector('.app-modal__question').innerHTML = `Позиция '${this.#prodName}' будет удалена. Прододлжить?`;

      deleteTaskModal.showModal();
      
    });
    lowerRowDiv.appendChild(deleteBtn);

    controlsDiv.appendChild(lowerRowDiv);

    liElement.appendChild(controlsDiv);

    return liElement;
  }
};
