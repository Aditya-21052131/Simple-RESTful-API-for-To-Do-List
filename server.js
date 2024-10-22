const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const TASKS_FILE = path.join(__dirname, 'tasks.json');

app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// Helper function to read tasks from file
async function readTasks() {
  try {
    const data = await fs.readFile(TASKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper function to write tasks to file
async function writeTasks(tasks) {
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

// GET all tasks
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await readTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Error reading tasks' });
  }
});

// GET a single task by ID
app.get('/tasks/:id', async (req, res) => {
  try {
    const tasks = await readTasks();
    const task = tasks.find(t => t.id === req.params.id);
    if (task) {
      res.json(task);
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error reading task' });
  }
});

// POST a new task
app.post('/tasks', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const newTask = {
      id: uuidv4(),
      title,
      description,
      completed: false,
      createdAt: new Date().toISOString()
    };
    const tasks = await readTasks();
    tasks.push(newTask);
    await writeTasks(tasks);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Error creating task' });
  }
});

// PUT (update) a task
app.put('/tasks/:id', async (req, res) => {
  try {
    const { title, description, completed } = req.body;
    const tasks = await readTasks();
    const taskIndex = tasks.findIndex(t => t.id === req.params.id);
    if (taskIndex > -1) {
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        title: title || tasks[taskIndex].title,
        description: description !== undefined ? description : tasks[taskIndex].description,
        completed: completed !== undefined ? completed : tasks[taskIndex].completed,
        updatedAt: new Date().toISOString()
      };
      await writeTasks(tasks);
      res.json(tasks[taskIndex]);
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error updating task' });
  }
});

// DELETE a task
app.delete('/tasks/:id', async (req, res) => {
  try {
    const tasks = await readTasks();
    const filteredTasks = tasks.filter(t => t.id !== req.params.id);
    if (filteredTasks.length < tasks.length) {
      await writeTasks(filteredTasks);
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error deleting task' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
