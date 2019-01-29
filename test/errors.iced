# Test if we have right errors and helpful stacktraces.

{make_esc} = require 'iced-error'

exports.test1 = (T, cb) ->
  await setTimeout defer(), 1
  T.equal 0, 1
  T.assert false
  T.error "hey!"
  T.error null
  T.no_error new Error("hey!")
  T.no_error null
  cb null

exports.fail_in_cb = (T, cb) ->
  await setTimeout defer(), 1
  cb new Error "failure"
