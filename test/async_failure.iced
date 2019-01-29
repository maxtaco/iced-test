# A test file with an async exception - an exception that
# happens after node continuation passing.

file = "async_failure.iced"

exports.init = (T, cb) ->
  T.waypoint "ran init for #{file}"
  cb null

exports.test1 = (T, cb) ->
  T.waypoint "this is test1"
  await setTimeout defer(), 1
  cb null

exports.test_exception = (T, cb) ->
  await setTimeout defer(), 1
  T.equal hello, 1, "fail here"
  cb null

exports.test2 = (T, cb) ->
  # We should still get here after the exception in previous test.
  T.waypoint "this is test2"
  await setTimeout defer(), 1
  cb null

exports.destroy = (T, cb) ->
  T.waypoint "and still ran the destructor for #{file}"
  cb null
