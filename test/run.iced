test = require '../index.iced'
{ServerRunner} = test
{iced} = require 'iced-coffee-script'
iced.catchExceptions()

runner = new ServerRunner()
runner.uncaughtException = true
runner.timeoutMs = 500

argv = require('minimist')(process.argv[2...])
whitelist = if argv._.length > 0 then argv._ else null
await test.run { mainfile : __filename, whitelist, runner }, defer rc
process.exit rc
