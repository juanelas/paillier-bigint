const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')

module.exports = class Builder extends EventEmitter {
  constructor (semaphoreFile, name = 'builder') {
    super()
    this.name = name
    this.firstBuild = true
    fs.mkdirSync(path.dirname(semaphoreFile), { recursive: true })

    this.semaphoreFile = semaphoreFile
    this._ready = false

    this.on('message', (...message) => {
      if (message !== undefined) {
        console.log(`\x1b[33mℹ [${this.name}]`, ...message, '\x1b[0m')
      }
    })

    this.on('error', (...error) => {
      if (error !== undefined) {
        console.error(`\x1b[31m❗ [${this.name}]`, ...error, '\x1b[0m')
      }
    })

    this.on('ready', () => {
      if (this.firstBuild === false) {
        fs.writeFileSync(this.semaphoreFile, '', 'utf-8')
      } else {
        this.firstBuild = false
      }
      this._ready = true
    })

    this.on('busy', () => {
      this._ready = false
    })
  }

  ready () {
    return new Promise(resolve => {
      if (this._ready === true) return resolve()
      this.once('ready', () => {
        resolve()
      })
    })
  }

  async start () {

  }

  async close () {}

  clean () {
    fs.rmSync(this.semaphoreFile, { force: true })
  }
}
