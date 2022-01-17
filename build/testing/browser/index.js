const puppeteer = require('puppeteer')

const browserTests = async (
  {
    logWarnings = false,
    serverPort = 38000,
    keepServerRunning = false,
    puppeteerOptions = {
      headless: false,
      devtools: true
    }
  }) => {
  const server = require('./server.js').server
  await server.init()
  await server.listen(serverPort)
  const browser = await puppeteer.launch(puppeteerOptions)
  const page = (await browser.pages())[0]
  page.on('console', function (message) {
    let ignore = message.type() === 'warning' && !logWarnings
    if (message.type() === 'error' && message.location()) {
      if (message.location().url.includes('favicon.ico')) {
        ignore = true
      }
    }
    if (ignore) return

    let text = (message.args().length > 0) ? message.args()[0]._remoteObject.value : message.text()
    const args = []
    if (message.args() !== undefined && message.args().length > 1) {
      for (let i = 1; i < message.args().length; i++) {
        args.push(message.args()[i]._remoteObject.value)
      }
    }

    if (message.type() === 'error' && message.location()) {
      text = `${message.location().url} : ${text}`
    }
    let consoleType = 'log'
    switch (message.type()) {
      case 'error':
        consoleType = 'error'
        break
      case 'warning':
        consoleType = 'warn'
        break
      default:
        break
    }
    console[consoleType](text, ...args)
  })

  page.on('error', function (err) { page.emit(new Error(err)) })

  page.on('close', async () => {
    await close()
  })

  page.goto('http://localhost:38000/').then(async () => {
    const watchDog = page.waitForFunction('_mocha.state === \'stopped\'', { timeout: 0 })
    await watchDog.catch(async (reason) => {
      console.error(reason)
    })
    if (puppeteerOptions.headless === true) {
      await close()
    }
  }).catch(async (reason) => {
    console.error(reason)
  })

  async function close () {
    console.log('Closing browser tests...')
    await browser.close().catch(() => {})
    if (keepServerRunning !== true) {
      await server.close().catch(() => {})
    }
  }
}

const opts = {
  // puppeteer options
  puppeteerOptions: {
    headless: false,
    devtools: true
    // slowMo: 100,
    // timeout: 10000
  },
  logWarnings: false, // log warnings in Node console (usually not needed)
  keepServerRunning: false, // keep server running until manually closed with ctrl-c. In combination with puppeteerOptions.headless (or just connecting any browser to the test page) allows debugging in browser
  serverPort: 38000
}

const args = process.argv.slice(2)
if (args[0] === 'headless') {
  opts.puppeteerOptions.headless = true
}

browserTests(opts)
