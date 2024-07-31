// Importing the express library
const express = require("express");

// Creating a router instance
const taskRouter = express.Router();

// Importing middleware
const auth = require("../middlewares/auth");
// Importing multer middleware
const files = require("../middlewares/multer");
const taskController = require("../controllers/taskController");



// Route for creating a new task
taskRouter.post(
  "/:projectId/tasks",
  auth.authenticate,
  auth.authorize,
  files.array("attachments"),
  taskController.createTask
);
taskRouter.get(
    "/:projectId/tasks",
    auth.authenticate,
    auth.authorize,
    taskController.getAllTasksByProjectId
  );
  
  // Route for getting all tasks by user it is assigned to
  
  taskRouter.get(
    "/tasks/:userId",
    auth.authenticate,
    auth.authorize,
    taskController.getAllTasksByUserId
  );

  // Route for updating a task
taskRouter.put(
    "/tasks/:taskId",
    auth.authenticate,
    auth.authorize,
    files.array("attachments"),
    taskController.updateTask
  );
  // Route for deleting a task
taskRouter.delete(
    "/:projectId/tasks/:taskId",
    auth.authenticate,
    auth.authorize,
    taskController.deleteTask
  );
  
  // Route for removing attachments from a task

taskRouter.delete(
    "/tasks/:taskId/attachments/:filename",
    auth.authenticate,
    auth.authorize,
    taskController.removeAttachments
  );
// Exporting the router
module.exports = taskRouter;