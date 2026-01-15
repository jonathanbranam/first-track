# Task & Track

## Features

- [X] add tasks to a task list and mark them complete
- [X] add a hook for saving data to local storage
- [X] use the useStorage hook to add saving and loading the task list
- [X] add swiping left to delete a task
- [ ] add a grab bar icon to allow dragging
- [ ] set up and track daily behaviors
- [ ] view daily goal behaviors
- [ ] check off when a daily behavior has been completed
- [ ] add metrics to a daily behavior such as number of pushups completed
- [ ] increment or add to a behavior metric such as number of pushups
- [ ] track quantitative metrics associated with tasks and behaviors such as
    type and number of minutes of exercise


## Write a storage hook prompt

Add a storage layer solution with hooks that can be called by any component to
store data. The data should be stored  using two pieces of data: a label and a
unique key. These can be combined to form a composite key with a "-" inside the
hook. For example, to store a task, the label is "task" and the key is the id
of the task.

## Save and load tasks from storage with useStorage hooks

Use the new useStorage hook to update the tasks.tsx component to save and load
the list of tasks from storage. The task list should be stored with the label
"tasklist" and a unique id of "default" and contain a list of task keys. When a
new task is added to the list, it will be saved as a "task" with the id as a
unique key and also added to the tasklist. This design is to support multiple
task lists in the future.
