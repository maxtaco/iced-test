# A test file with an sync exception - exception that
# happens in test code before any continuation passing.
# Simple try/catch block recovers from these, without
# uncaughtException recovery.

file = "sync_failure.iced"

exports.init = (T, cb) ->
  T.waypoint "ran init for #{file}"
  cb null

exports.before = (T, cb) ->
  T.waypoint "test before the exception"
  await setTimeout defer(), 1
  cb null

exports.test_exception = (T, cb) ->
  T.equal hello, 1, "fail here"
  cb null

exports.after = (T, cb) ->
  # We should still get here after the exception in previous test.
  T.waypoint "test after the exception"
  await setTimeout defer(), 1
  cb null

exports.destroy = (T, cb) ->
  T.waypoint "and still ran the destructor for #{file}"
  cb null
