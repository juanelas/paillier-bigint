const childProcess = require('child_process')

const rootDir = require('path').join(__dirname, '../')

function runScript (scriptPath, args) {
  return new Promise((resolve, reject) => {
    const cmd = childProcess.fork(scriptPath, args, {
      cwd: rootDir
    })

    cmd.on('error', (error) => {
      reject(error)
    })

    // execute the callback once the process has finished running
    cmd.on('exit', function (code) {
      if (code !== 0) {
        const error = new Error('exit code ' + code)
        reject(error)
      }
      resolve()
    })
  })
}

module.exports = runScript
