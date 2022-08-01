import EventEmitter from 'events'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { dirname } from 'path'

export default class Builder extends EventEmitter {
  constructor (semaphoreFile, name = 'builder') {
    super()
    this.name = name
    this.firstBuild = true
    mkdirSync(dirname(semaphoreFile), { recursive: true })

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
        writeFileSync(this.semaphoreFile, '', 'utf-8')
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
    rmSync(this.semaphoreFile, { force: true })
  }
}
