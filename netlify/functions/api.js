const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// In-memory storage since we can't rely on file system in serverless functions
let tasks = [];

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  const path = event.path.replace('/.netlify/functions/api/', '');
  const segments = path.split('/').filter(Boolean);

  try {
    switch (event.httpMethod) {
      case 'GET':
        if (segments.length === 0) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(tasks)
          };
        } else {
          const task = tasks.find(t => t.id === segments[0]);
          if (task) {
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify(task)
            };
          }
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Task not found' })
          };
        }

      case 'POST':
        const { title, description } = JSON.parse(event.body);
        if (!title) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Title is required' })
          };
        }
        const newTask = {
          id: uuidv4(),
          title,
          description,
          completed: false,
          createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newTask)
        };

      case 'PUT':
        if (segments.length > 0) {
          const taskIndex = tasks.findIndex(t => t.id === segments[0]);
          if (taskIndex > -1) {
            const { title, description, completed } = JSON.parse(event.body);
            tasks[taskIndex] = {
              ...tasks[taskIndex],
              title: title || tasks[taskIndex].title,
              description: description !== undefined ? description : tasks[taskIndex].description,
              completed: completed !== undefined ? completed : tasks[taskIndex].completed,
              updatedAt: new Date().toISOString()
            };
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify(tasks[taskIndex])
            };
          }
        }
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Task not found' })
        };

      case 'DELETE':
        if (segments.length > 0) {
          const initialLength = tasks.length;
          tasks = tasks.filter(t => t.id !== segments[0]);
          if (tasks.length < initialLength) {
            return {
              statusCode: 204,
              headers
            };
          }
        }
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Task not found' })
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
