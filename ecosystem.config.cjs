module.exports = {
  apps: [
    {
      name: "taskmaster-app",
      script: "static-server.js",
      cwd: "C:\\Users\\bryan\\aibry\\projects\\TaskMaster",
      env: {
        NODE_ENV: "production",
        PORT: 3100
      }
    },
    {
      name: "taskmaster-api",
      script: "server.js",
      cwd: "C:\\Users\\bryan\\aibry\\projects\\taskmaster-api",
      env: {
        NODE_ENV: "production",
        PORT: 3101
      }
    }
  ]
};