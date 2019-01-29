file = "timeout.iced"

exports.init = (T, cb) ->
  T.waypoint "ran init for #{file}"
  cb null

exports.before = (T, cb) ->
  T.waypoint "test before the exception"
  await setTimeout defer(), 1
  cb null

exports.timeouting_function = (T, cb) ->
  T.waypoint "we are never returning from this one!"
  # no cb call

exports.after = (T, cb) ->
  # We should still get here after the exception in previous test.
  T.waypoint "test after the exception"
  await setTimeout defer(), 1
  cb null

exports.destroy = (T, cb) ->
  T.waypoint "and still ran the destructor for #{file}"
  cb null
